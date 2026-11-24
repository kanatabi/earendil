import { api } from '#lib/api/server.ts';
import { resolveOrigin, sitemapXml } from '#lib/site.ts';

/** The sitemap: home, gallery, about, every published post. */
export const GET = async () => {
	const feed = await api.getPosts({ limit: 500 });
	const xml = sitemapXml(feed.items, resolveOrigin(process.env.ORIGIN));
	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
