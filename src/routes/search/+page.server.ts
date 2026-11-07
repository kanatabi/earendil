import { redirect } from '@sveltejs/kit';
import { api } from '#lib/api/server.ts';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 10;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const load = (async ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim() || undefined;
	// Facet state lives in the URL: repeated tag params + an inclusive date window.
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
	if (!q && tags.length === 0 && !from && !to) redirect(307, '/');

	const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
	const opts = { offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE, tags, from, to };
	const feed = q ? await api.searchPosts(q, opts) : await api.getPosts(opts);

	const pages = Math.max(1, Math.ceil(feed.total / PAGE_SIZE));
	if (page > pages) {
		const params = new URLSearchParams();
		if (q) params.set('q', q);
		for (const t of tags) params.append('tag', t);
		if (from) params.set('from', from);
		if (to) params.set('to', to);
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
		tagCloud: await api.listTags()
	};
}) satisfies PageServerLoad;
