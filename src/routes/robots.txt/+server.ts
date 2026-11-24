import { resolveOrigin, robotsTxt } from '#lib/site.ts';

/** The robots contract: everything crawlable, the sitemap advertised. */
export const GET = () => {
	return new Response(robotsTxt(resolveOrigin(process.env.ORIGIN)), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' }
	});
};
