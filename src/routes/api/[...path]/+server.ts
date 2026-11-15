// Same-origin proxy for the handful of browser-side API calls (search suggestions
// in SearchDialog). The backend has NO public ingress, so the browser can only
// reach it through this SSR pod: GET /api/... -> API_BASE/api/... on the internal
// network. Server-side load functions skip this hop and call API_BASE directly.
//
// The correlation seam (2026-11-15): the proxy MINTS the id for each browser
// request, forwards it (lumen adopts it), echoes lumen's response id back to
// the browser, and logs the relay outcome — the browser hop joins the same
// chain the SSR loads ride, and the response header lets a user report the id
// behind any visible error.
import { DEV_DEFAULT_API_BASE } from '#lib/api/client.ts';
import { REQUEST_ID_HEADER, newRequestId, echoedRequestId, logAccess } from '#lib/api/requestid.ts';

export const GET = async ({ url, params }: { url: URL; params: { path?: string } }) => {
	// real-by-default (owner ruling 2026-11-09): unset env means the dev
	// fallback, matching server.ts — a page whose browser suggest hits the
	// proxy must talk to the SAME backend as its SSR load
	const base = process.env.API_BASE || DEV_DEFAULT_API_BASE;
	const requestId = newRequestId();
	const proxiedPath = `/api/${params.path ?? ''}`;

	let res: Response;
	try {
		res = await fetch(new URL(`${proxiedPath}${url.search}`, base), {
			headers: { [REQUEST_ID_HEADER]: requestId }
		});
	} catch {
		logAccess('proxy', 'GET', proxiedPath, 'unreachable', requestId);
		return new Response(JSON.stringify({ error: 'lumen unreachable' }), {
			status: 503,
			headers: { 'content-type': 'application/json', [REQUEST_ID_HEADER]: requestId }
		});
	}
	logAccess('proxy', 'GET', proxiedPath, res.status, echoedRequestId(res, requestId));

	return new Response(await res.arrayBuffer(), {
		status: res.status,
		headers: {
			'content-type': res.headers.get('content-type') ?? 'application/json',
			[REQUEST_ID_HEADER]: echoedRequestId(res, requestId)
		}
	});
};
