import type {
	Photo,
	PhotoListResponse,
	PostDetail,
	PostListResponse,
	SortValue,
	SuggestResponse,
	Tag
} from './types';

export interface BlogApi {
	getPosts(opts?: {
		offset?: number;
		limit?: number;
		/** OR-match: posts carrying any of these tags. Empty/undefined disables filtering. */
		tags?: string[];
		/** Inclusive YYYY-MM-DD window on the post date. */
		from?: string;
		to?: string;
		/** Inclusive minute window on read time. */
		readMin?: number;
		readMax?: number;
		/** Explicit re-ordering; absent keeps the BE's curation order. */
		sort?: SortValue;
	}): Promise<PostListResponse>;
	getPost(slug: string): Promise<PostDetail>;
	suggestPosts(q: string, limit?: number): Promise<SuggestResponse>;
	/** Ranked, paginated full-text search — the /search page (suggest is the palette's capped launcher). */
	searchPosts(
		q: string,
		opts?: {
			offset?: number;
			limit?: number;
			tags?: string[];
			from?: string;
			to?: string;
			readMin?: number;
			readMax?: number;
			sort?: SortValue;
		}
	): Promise<PostListResponse>;
	getPhotos(opts?: { limit?: number }): Promise<PhotoListResponse>;
	/** The homepage hero photo — curation is the BE's call; null when unset. */
	getFeaturedPhoto(): Promise<Photo | null>;
	/** Tag cloud for the home rail: BE-curated counts and order, rendered as-is. */
	listTags(): Promise<Tag[]>;
}

export class ApiError extends Error {
	constructor(
		readonly status: number,
		message: string
	) {
		super(message);
		this.name = 'ApiError';
	}
}

/** The default backend base for LOCAL DEV — the runtime env always wins
 *  (cluster gets it from ESO-rendered API_BASE); this fallback exists so
 *  `npm run dev` speaks real lumen out of the box (owner ruling 2026-11-09:
 *  real-by-default; the fixture corpus survives ONLY as a test double). */
export const DEV_DEFAULT_API_BASE = 'http://localhost:8080';

export function createApi(base: string): BlogApi {
	return createFetchApi(base.replace(/\/+$/, ''));
}

function createFetchApi(base: string): BlogApi {
	async function get<T>(path: string): Promise<T> {
		const res = await fetch(`${base}${path}`);
		if (!res.ok) throw new ApiError(res.status, `GET ${path} failed with status ${res.status}`);
		return res.json() as Promise<T>;
	}

	return {
		getPosts(opts) {
			const params = new URLSearchParams();
			if (opts?.offset !== undefined) params.set('offset', String(opts.offset));
			if (opts?.limit !== undefined) params.set('limit', String(opts.limit));
			for (const t of opts?.tags ?? []) params.append('tag', t);
			if (opts?.from) params.set('from', opts.from);
			if (opts?.to) params.set('to', opts.to);
			if (opts?.readMin !== undefined) params.set('readMin', String(opts.readMin));
			if (opts?.readMax !== undefined) params.set('readMax', String(opts.readMax));
			if (opts?.sort) params.set('sort', opts.sort);
			const query = params.toString();
			return get<PostListResponse>(`/api/posts${query ? `?${query}` : ''}`);
		},
		getPost(slug) {
			return get<PostDetail>(`/api/posts/${encodeURIComponent(slug)}`);
		},
		suggestPosts(q, limit) {
			const params = new URLSearchParams({ q });
			if (limit !== undefined) params.set('limit', String(limit));
			return get<SuggestResponse>(`/api/search/suggest?${params}`);
		},
		searchPosts(q, opts) {
			const params = new URLSearchParams({ q });
			if (opts?.offset !== undefined) params.set('offset', String(opts.offset));
			if (opts?.limit !== undefined) params.set('limit', String(opts.limit));
			for (const t of opts?.tags ?? []) params.append('tag', t);
			if (opts?.from) params.set('from', opts.from);
			if (opts?.to) params.set('to', opts.to);
			if (opts?.readMin !== undefined) params.set('readMin', String(opts.readMin));
			if (opts?.readMax !== undefined) params.set('readMax', String(opts.readMax));
			if (opts?.sort) params.set('sort', opts.sort);
			return get<PostListResponse>(`/api/search?${params}`);
		},
		getPhotos(opts) {
			const params = new URLSearchParams();
			if (opts?.limit !== undefined) params.set('limit', String(opts.limit));
			const query = params.toString();
			return get<PhotoListResponse>(`/api/photos${query ? `?${query}` : ''}`);
		},
		async getFeaturedPhoto() {
			const res = await fetch(`${base}/api/photos/featured`);
			if (res.status === 404) return null;
			if (!res.ok)
				throw new ApiError(res.status, `GET /api/photos/featured failed with status ${res.status}`);
			return (await res.json()) as Photo;
		},
		listTags() {
			return get<Tag[]>('/api/tags');
		}
	};
}
