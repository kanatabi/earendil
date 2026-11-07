import { redirect } from '@sveltejs/kit';
import { api } from '#lib/api/server.ts';
import type { SortValue } from '#lib/api/types.ts';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 10;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SORTS: SortValue[] = ['newest', 'oldest', 'quickest', 'longest', 'relevance'];

export const load = (async ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim() || undefined;
	// Facet state lives in the URL: repeatable tag params (OR), inclusive date
	// window, inclusive read-time window, and an explicit sort. An empty URL is
	// the archive — every post in curation order — not a bounce to home.
	const tags = [
		...new Set(
			url.searchParams
				.getAll('tag')
				.map((t) => t.trim())
				.filter(Boolean)
		)
	];
	const raw = { from: url.searchParams.get('from'), to: url.searchParams.get('to') };
	const from = raw.from && DATE_RE.test(raw.from) ? raw.from : undefined;
	const to = raw.to && DATE_RE.test(raw.to) ? raw.to : undefined;
	const sortRaw = (url.searchParams.get('sort') ?? '') as SortValue;
	const sort = SORTS.includes(sortRaw) ? sortRaw : undefined;
	// Slider bounds are 0–30 with both ends meaning "any"; endpoints never ship.
	const minute = (name: string) => {
		const v = Number(url.searchParams.get(name));
		return Number.isInteger(v) && v > 0 && v < 30 ? v : undefined;
	};
	const readMin = minute('readMin');
	const readMax = minute('readMax');

	const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
	const opts = {
		offset: (page - 1) * PAGE_SIZE,
		limit: PAGE_SIZE,
		tags,
		from,
		to,
		readMin,
		readMax,
		sort
	};
	const feed = q ? await api.searchPosts(q, opts) : await api.getPosts(opts);

	const pages = Math.max(1, Math.ceil(feed.total / PAGE_SIZE));
	if (page > pages) {
		const params = new URLSearchParams();
		if (q) params.set('q', q);
		for (const t of tags) params.append('tag', t);
		if (from) params.set('from', from);
		if (to) params.set('to', to);
		if (readMin) params.set('readMin', String(readMin));
		if (readMax) params.set('readMax', String(readMax));
		if (sort) params.set('sort', sort);
		params.set('page', String(pages));
		redirect(307, `/search?${params}`);
	}

	return {
		posts: feed.items,
		page,
		pages,
		total: feed.total,
		q,
		tags,
		from,
		to,
		readMin,
		readMax,
		sort,
		tagCloud: await api.listTags()
	};
}) satisfies PageServerLoad;
