/** Canonical origin of THIS deployment — see DESIGN §9 (two-env contract). */
import type { PostSummary } from './api/types.ts';

/** Production identity anchor used when ORIGIN is unset (current prod behavior). */
export const DEFAULT_ORIGIN = 'https://gofar.id';

/**
 * Normalize a canonical origin (scheme + host, optional port): trim, drop
 * trailing slashes so consumers can append paths safely, fall back to the
 * production default when unset/blank. Pure + server-only by contract —
 * callers live in +layout.server.ts (reads process.env.ORIGIN) and tests.
 */
export function resolveOrigin(raw?: string): string {
	const value = (raw ?? '').trim().replace(/\/+$/, '');
	return value === '' ? DEFAULT_ORIGIN : value;
}

/** XML text escaping (the syndication round): the five characters that
 *  break element/attribute content — titles and previews arrive from
 *  lumen verbatim and MUST go out escaped. */
export function xmlEscape(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

/**
 * The RSS 2.0 channel — the blog's syndication contract: the SAME
 * curation order the homepage shows, absolute links (origin from the
 * deployment's identity anchor), description = the BE-owned preview,
 * guid = the canonical post URL. Pure — the route supplies the posts.
 */
export function rssXml(posts: PostSummary[], origin: string, channelTitle: string): string {
	const items = posts
		.map((p) => {
			const link = `${origin}/posts/${p.slug}`;
			return [
				'\t<item>',
				`\t\t<title>${xmlEscape(p.title)}</title>`,
				`\t\t<link>${link}</link>`,
				`\t\t<guid isPermaLink="true">${link}</guid>`,
				`\t\t<pubDate>${new Date(p.date).toUTCString()}</pubDate>`,
				`\t\t<description>${xmlEscape(p.preview)}</description>`,
				'\t</item>'
			].join('\n');
		})
		.join('\n');
	const lastBuild = posts.length
		? new Date(Math.max(...posts.map((p) => new Date(p.date).getTime()))).toUTCString()
		: new Date().toUTCString();
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
		'\t<channel>',
		`\t\t<title>${xmlEscape(channelTitle)}</title>`,
		`\t\t<link>${origin}</link>`,
		`\t\t<description>${xmlEscape('the blog of gofar.id')}</description>`,
		`\t\t<lastBuildDate>${lastBuild}</lastBuildDate>`,
		`\t\t<atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml" />`,
		items,
		'\t</channel>',
		'</rss>'
	].join('\n');
}

/** The sitemap: home, every published post (lastmod = its date), and the
 *  static doors (gallery, about). Pure — the route supplies the posts. */
export function sitemapXml(posts: PostSummary[], origin: string): string {
	const url = (path: string, lastmod?: string) =>
		[
			'\t<url>',
			`\t\t<loc>${origin}${path}</loc>`,
			lastmod ? `\t\t<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : null,
			'\t</url>'
		]
			.filter((line) => line !== null)
			.join('\n');
	const urls = [
		url(
			'/',
			posts.length
				? posts
						.map((p) => p.date)
						.sort()
						.at(-1)
				: undefined
		),
		url('/gallery'),
		url('/about'),
		...posts.map((p) => url(`/posts/${p.slug}`, p.date))
	];
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		urls.join('\n'),
		'</urlset>'
	].join('\n');
}

/** The robots contract: everything crawlable, the sitemap advertised. */
export function robotsTxt(origin: string): string {
	return ['User-agent: *', 'Allow: /', `Sitemap: ${origin}/sitemap.xml`, ''].join('\n');
}
