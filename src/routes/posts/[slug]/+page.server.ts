import { error } from '@sveltejs/kit';
import { ApiError, api } from '#lib/api/server.ts';
import { renderMarkdownCached } from '#lib/markdown/render.ts';
import { profile } from '#lib/content/about.ts';
import { resolveOrigin } from '#lib/site.ts';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	let post;
	try {
		post = await api.getPost(params.slug);
	} catch (e) {
		if (e instanceof ApiError && e.status === 404) error(404, 'Post not found');
		throw e;
	}

	// The raw Markdown stays server-side; only the rendered HTML travels to the client.
	// THE STREAM (the long-post perf round, 2026-11-22): only the post's
	// metadata is awaited — the route completes (the navigation leaves the
	// homepage) the moment the fetch lands, and the rendered article STREAMS
	// in behind the shimmer. The whole-post cache makes the streamed wait
	// ~1-5ms in the steady state; a cold post (the first view after an edit)
	// paints the shell + the skeleton instead of stalling the navigation.
	// Both promises ride the SAME render — they resolve together.
	const { content: markdown, ...summary } = post;
	const rendered = renderMarkdownCached(markdown);

	// THE SYNDICATION ROUND: per-post OG tags + the Article JSON-LD —
	// shared links become cards, and machines get the canonical facts.
	// Built server-side (it embeds into <svelte:head> via @html); the
	// origin is the deployment's identity anchor (ORIGIN env). The JSON
	// escapes `<` so a title can never close the script early.
	const origin = resolveOrigin(process.env.ORIGIN);
	const jsonLd = `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: post.title,
		description: post.preview,
		datePublished: post.date,
		dateModified: post.date,
		author: { '@type': 'Person', name: profile.name },
		mainEntityOfPage: { '@type': 'WebPage', '@id': `${origin}/posts/${post.slug}` },
		...(post.thumbnail ? { image: [post.thumbnail] } : {})
	}).replace(/</g, '\\u003c')}</script>`;

	return {
		post: summary,
		origin,
		jsonLd,
		html: rendered.then((r) => r.html),
		toc: rendered.then((r) => r.toc)
	};
}) satisfies PageServerLoad;
