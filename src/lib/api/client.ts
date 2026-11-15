import type {
	Photo,
	PhotoListResponse,
	PostDetail,
	PostListResponse,
	SortValue,
	SuggestResponse,
	Tag
} from './types';
import { REQUEST_ID_HEADER, newRequestId, echoedRequestId, logAccess } from './requestid';

/** The operation vocabulary — the enumerated verbs the OUTBOUND metrics
 * carry (one per call site; never a slug or query value). Browser-safe:
 * this module is shared, so the server-only observability machinery is
 * INJECTED (createApi's `instrument` param) — the browser bundle must
 * never pull prom-client (the $lib/server-only-import rule guards it).
 * The parity with the server-side timeout table is guard-tested. */
export const OP = {
	ListPosts: 'list-posts',
	ReadPost: 'read-post',
	SuggestPosts: 'suggest-posts',
	SearchPosts: 'search-posts',
	ListPhotos: 'list-photos',
	FeaturedPhoto: 'featured-photo',
	ListTags: 'list-tags',
	ProxyRelay: 'proxy-relay'
} as const;

/** The injected observability seam: one call = one counted, BOUNDED
 * exchange. The SSR singleton passes the real wrapper (dependency label,
 * budget from the table, AbortSignal); the browser passes nothing and
 * gets the inert default — the proxy route bounds the server leg. */
export type OutboundInstrument = <T>(
	op: string,
	run: (signal: AbortSignal) => Promise<T>
) => Promise<T>;

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
		message: string,
		/** The chain's id (2026-11-15): the minted one, or lumen's echo when it
		 * answered — grep it across BOTH services' logs in one step. */
		readonly requestId?: string
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

export function createApi(base: string, instrument?: OutboundInstrument): BlogApi {
	return createFetchApi(base.replace(/\/+$/, ''), instrument);
}

function createFetchApi(base: string, instrument?: OutboundInstrument): BlogApi {
	/** The inert default: the browser's path through the same-origin proxy
	 * needs no metrics of its own (the PROXY's outbound seam counts and
	 * bounds the server leg for the whole chain). */
	const instrumentCall: OutboundInstrument =
		instrument ?? ((_op, run) => run(new AbortController().signal));
	/** The correlation seam's outbound half: mint → send → the access line.
	 * Network failure throws (503); a non-ok status is the CALLER's decision
	 * (get() turns it into ApiError, getFeaturedPhoto turns 404 into null) —
	 * the line is logged either way, so the chain never loses the hop.
	 *
	 * The call is also COUNTED and BOUNDED (the observability round,
	 * 2026-11-15): `op` is the enumerated verb the metrics carry, and the
	 * injected instrumentor bounds a hung lumen instead of hanging the
	 * SSR render (the SSR singleton injects the real one; the browser
	 * gets the inert default). */
	async function send(
		path: string,
		op: string,
		init?: RequestInit
	): Promise<{ res: Response; requestId: string }> {
		const requestId = newRequestId();
		const method = init?.method ?? 'GET';
		try {
			const res = await instrumentCall(op, (signal) =>
				fetch(`${base}${path}`, {
					...init,
					signal,
					headers: { [REQUEST_ID_HEADER]: requestId, ...init?.headers }
				})
			);
			logAccess('ssr', method, path, res.status, echoedRequestId(res, requestId));
			return { res, requestId };
		} catch {
			logAccess('ssr', method, path, 'unreachable', requestId);
			throw new ApiError(503, 'lumen unreachable', requestId);
		}
	}

	async function get<T>(path: string, op: string): Promise<T> {
		const { res, requestId } = await send(path, op);
		if (!res.ok) {
			throw new ApiError(
				res.status,
				`GET ${path} failed with status ${res.status}`,
				echoedRequestId(res, requestId)
			);
		}
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
			return get<PostListResponse>(`/api/posts${query ? `?${query}` : ''}`, OP.ListPosts);
		},
		getPost(slug) {
			return get<PostDetail>(`/api/posts/${encodeURIComponent(slug)}`, OP.ReadPost);
		},
		suggestPosts(q, limit) {
			const params = new URLSearchParams({ q });
			if (limit !== undefined) params.set('limit', String(limit));
			return get<SuggestResponse>(`/api/search/suggest?${params}`, OP.SuggestPosts);
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
			return get<PostListResponse>(`/api/search?${params}`, OP.SearchPosts);
		},
		getPhotos(opts) {
			const params = new URLSearchParams();
			if (opts?.limit !== undefined) params.set('limit', String(opts.limit));
			const query = params.toString();
			return get<PhotoListResponse>(`/api/photos${query ? `?${query}` : ''}`, OP.ListPhotos);
		},
		async getFeaturedPhoto() {
			const { res, requestId } = await send('/api/photos/featured', OP.FeaturedPhoto);
			if (res.status === 404) return null;
			if (!res.ok) {
				throw new ApiError(
					res.status,
					`GET /api/photos/featured failed with status ${res.status}`,
					echoedRequestId(res, requestId)
				);
			}
			return (await res.json()) as Photo;
		},
		listTags() {
			return get<Tag[]>('/api/tags', OP.ListTags);
		}
	};
}
