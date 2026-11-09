// Same-origin proxy for the handful of browser-side API calls (search suggestions
// in SearchDialog). The backend has NO public ingress, so the browser can only
// reach it through this SSR pod: GET /api/... -> API_BASE/api/... on the internal
// network. Server-side load functions skip this hop and call API_BASE directly.
import { DEV_DEFAULT_API_BASE } from '#lib/api/client.ts';

export const GET = async ({ url, params }: { url: URL; params: { path?: string } }) => {
	// real-by-default (owner ruling 2026-11-09): unset env means the dev
	// fallback, matching server.ts — a page whose browser suggest hits the
	// proxy must talk to the SAME backend as its SSR load
	const base = process.env.API_BASE || DEV_DEFAULT_API_BASE;

	const target = new URL(`/api/${params.path ?? ''}${url.search}`, base);
	const res = await fetch(target);

	return new Response(await res.arrayBuffer(), {
		status: res.status,
		headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' }
	});
};
