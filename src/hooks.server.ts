// The inbound RED pair (2026-11-15): ONE line per request keyed on the
// SvelteKit ROUTE ID (event.route.id — `/posts/[slug]`, never the raw
// path: flat cardinality by construction), status counter + duration
// histogram. The probes skip (they would flood every rate() with noise),
// mirroring lumen's middleware. The vocabulary lives in the ONE metrics
// registry (#lib/server/metrics.js) so the /metrics listener server.js
// serves sees exactly what the hooks recorded.
import type { Handle } from '@sveltejs/kit/hooks';
import { isProbe, observeInbound } from '#lib/server/metrics.js';

export const handle: Handle = async ({ event, resolve }) => {
	if (isProbe(event.url.pathname)) {
		return resolve(event);
	}
	const start = performance.now();
	const res = await resolve(event);
	observeInbound(
		event.route?.id ?? null,
		event.request.method,
		res.status,
		performance.now() - start
	);
	return res;
};

// THE BOOT WARM-UP (2026-11-22): the markdown engine's grammar build =
// the seconds of sync, event-loop-freezing CPU — pay it at the pod's
// STARTUP, never on the first reader's click (the cold-engine walk:
// the first post view after a deploy stalled the navigation). The route
// modules load lazily, so the hooks = the only eager touchpoint.
import('#lib/markdown/render.ts')
	.then((m) => m.warmup())
	.then(() => console.log('[boot] markdown engine warm'))
	.catch(() => {}); // the failure surfaces on the first render (the engine's own retry)
