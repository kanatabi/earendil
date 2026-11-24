import { api } from '#lib/api/server.ts';
import { resolveOrigin, rssXml } from '#lib/site.ts';

/**
 * The RSS 2.0 feed (the syndication round): the SAME curation order the
 * homepage shows, the newest 50 posts, absolute links from the
 * deployment's identity anchor. Readers poll this; per-request assembly
 * is a listPosts + string join — no cache needed.
 */
export const GET = async () => {
	const feed = await api.getPosts({ limit: 50 });
	const xml = rssXml(feed.items, resolveOrigin(process.env.ORIGIN), 'gofar;');
	return new Response(xml, {
		headers: {
			'Content-Type': 'application/rss+xml; charset=utf-8',
			'Cache-Control': 'public, max-age=600'
		}
	});
};
