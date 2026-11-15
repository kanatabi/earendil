// The health door (2026-11-15): a static 200 with NO page load — the
// kubelet's probes used to hit `/`, which RENDERED THE HOMEPAGE (SSR) and
// fired getPosts + listTags at lumen every probe: a fake-traffic generator
// the metrics made visible (steady 15s/20s beats on /api/*, lumen-minted
// ids). The metrics hook skips this path (isProbe) — a probe never counts.
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () =>
	json({ ok: true, app: 'earendil' }, { headers: { 'cache-control': 'no-store' } });
