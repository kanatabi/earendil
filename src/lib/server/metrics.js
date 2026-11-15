/**
 * The observability registry (2026-11-15) — earendil's ONE file for every
 * dependency name, every operation, every timeout budget, and the metric
 * families. Plain JavaScript on purpose: the custom server (server.js) and
 * the SvelteKit hooks BOTH import it, so the /metrics listener and the
 * instrumentation share ONE prom-client Register (two copies would record
 * inbound series into a register nobody scrapes).
 *
 * Vocabulary mirrors lumen's internal/obs exactly — the estate's panels
 * sum by (service, dependency) across apps without regexes:
 *
 *   outbound_request_total{service,dependency,operation,result}
 *   outbound_request_duration_seconds{service,dependency,operation}
 *   outbound_inflight{service,dependency}
 *   http_request_total{service,method,route,status}
 *   http_request_duration_seconds{service,method,route}
 *
 * Label doctrine (the owner ruling, same as lumen): the axes are
 * `dependency` (which outside system), `operation` (an ENUMERATED verb —
 * never a slug, id, or query value; the proxy relays paths that are USER
 * INPUT, so its op is the constant `proxy-relay` and the path stays in
 * the access line where it belongs), and `result` (ok|error|timeout).
 * `route` on the inbound pair is SvelteKit's ROUTE ID (`/posts/[slug]`) —
 * flat cardinality by construction.
 */

import { Counter, Gauge, Histogram, collectDefaultMetrics, Registry } from 'prom-client';

export const SERVICE = 'earendil';

/** The dependency names — earendil dials exactly one outside system: the
 * lumen cms plane (the SSR pod's API_BASE). The name matches the estate's
 * system vocabulary, not a URL (URLs are config, labels are identity).
 * The OPERATION vocabulary lives in `#lib/api/client.ts` (the call sites'
 * home — this module is server-only and must not import client code);
 * the parity guard test proves this table's op keys are a subset of the
 * client's OP values, so the two can never silently drift. */
export const DEP = {
	Lumen: 'lumen'
};

/**
 * The timeout table — the budgets that bound every outbound call
 * (AbortSignal.timeout; a hung lumen dies at the deadline instead of
 * hanging the reader's page). Env overrides read `EARENDIL_TIMEOUT_LUMEN`
 * (dep default) and `EARENDIL_TIMEOUT_LUMEN_<OP_PIECE>` (per-op), in
 * MILLISECONDS. Missing, empty, or garbage value = the table default —
 * the same missing-or-empty-means-default rule lumen's viper config
 * follows natively.
 */
// the budgets reference the ops by their literal wire values (this
// module is plain JS — client.ts's OP constant can't be imported by a
// raw node process); the parity guard test proves the subset relation,
// so the two spellings cannot silently drift
/** @type {Record<string, { default: number, ops?: Record<string, number> }>} */
export const TIMEOUT_TABLE = {
	[DEP.Lumen]: { default: 3000, ops: { 'suggest-posts': 2000, 'proxy-relay': 2000 } }
};

/** op name → the env piece: `suggest-posts` → `SUGGEST_POSTS`.
 *
 * @param {string} op
 * @returns {string}
 */
function opPiece(op) {
	return op.toUpperCase().replaceAll('-', '_');
}

/** The resolved budget for one call: op override > dep default. Exported
 * for the guard test that proves the env chain.
 *
 * @param {string} dependency
 * @param {string} operation
 * @returns {number}
 */
export function timeoutFor(dependency, operation) {
	const entry = TIMEOUT_TABLE[dependency];
	if (!entry) return 5000; // an unregistered dep still gets a sane bound
	const override = entry.ops?.[operation];
	if (override !== undefined) return override;
	return entry.default;
}

/**
 * @param {string} dependency
 * @returns {string[]}
 */
export function timeoutEnvKeys(dependency) {
	const entry = TIMEOUT_TABLE[dependency];
	if (!entry) return [];
	const depKey = `EARENDIL_TIMEOUT_${dependency.toUpperCase().replaceAll('-', '_')}`;
	return [depKey, ...Object.keys(entry.ops ?? {}).map((op) => `${depKey}_${opPiece(op)}`)];
}

/**
 * @param {string} name
 * @param {number} fallback
 * @returns {number}
 */
function envTimeout(name, fallback) {
	const raw = process.env[name];
	if (raw === undefined || raw === '') return fallback;
	const parsed = Number.parseInt(raw, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** The effective budget AFTER env overrides — what outbound() actually
 * applies. Exported for tests. */
/**
 * @param {string} dependency
 * @param {string} operation
 * @returns {number}
 */
export function effectiveTimeout(dependency, operation) {
	const depKey = `EARENDIL_TIMEOUT_${dependency.toUpperCase().replaceAll('-', '_')}`;
	const opKey = `${depKey}_${opPiece(operation)}`;
	// precedence: the per-op env wins, then the dep env, then the table
	const opRaw = process.env[opKey];
	if (opRaw !== undefined && opRaw !== '') {
		const parsed = Number.parseInt(opRaw, 10);
		if (Number.isFinite(parsed) && parsed > 0) return parsed;
	}
	const depRaw = process.env[depKey];
	if (depRaw !== undefined && depRaw !== '') {
		const parsed = Number.parseInt(depRaw, 10);
		if (Number.isFinite(parsed) && parsed > 0) return parsed;
	}
	return timeoutFor(dependency, operation);
}

/** The ONE register: prom-client resolves from node_modules at runtime for
 * BOTH importers (the SSR build externalizes real dependencies), so the
 * hook-side observations and the server-side scrape see the same series. */
export const register = new Registry();
register.setDefaultLabels({ service: SERVICE });
collectDefaultMetrics({ register });

const OUTBOUND_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30];
const INBOUND_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

export const outboundTotal = new Counter({
	name: 'outbound_request_total',
	help: 'Outbound call outcomes (result=ok|error|timeout).',
	labelNames: ['dependency', 'operation', 'result'],
	registers: [register]
});
export const outboundDuration = new Histogram({
	name: 'outbound_request_duration_seconds',
	help: 'Latency of outbound calls, by dependency and operation.',
	labelNames: ['dependency', 'operation'],
	buckets: OUTBOUND_BUCKETS,
	registers: [register]
});
export const outboundInflight = new Gauge({
	name: 'outbound_inflight',
	help: 'Outbound calls currently in flight, by dependency.',
	labelNames: ['dependency'],
	registers: [register]
});

export const httpRequestTotal = new Counter({
	name: 'http_request_total',
	help: 'Inbound requests by SvelteKit route ID (never raw paths).',
	labelNames: ['method', 'route', 'status'],
	registers: [register]
});
export const httpRequestDuration = new Histogram({
	name: 'http_request_duration_seconds',
	help: 'Inbound request latency by route ID.',
	labelNames: ['method', 'route'],
	buckets: INBOUND_BUCKETS,
	registers: [register]
});

/**
 * The outbound wrapper — the seam every outside call rides: the budget
 * comes from the timeout table (env overridable), the latency histogram +
 * outcome counter + in-flight gauge record the call, and the wrapped fn
 * receives the ABORT signal so a hung lumen dies at the deadline instead
 * of hanging the SSR render.
 *
 * Outcome semantics mirror lumen exactly: a RESOLVED response is `ok`
 * even when it carries a 5xx (the transport succeeded; the status is the
 * caller's story — the access line + ApiError carry it); a thrown error
 * while the budget expired is `timeout`; any other throw is `error`. The
 * error ALWAYS rethrows — instrumentation never swallows.
 *
 * @template T
 * @param {string} dependency
 * @param {string} operation
 * @param {(signal: AbortSignal) => Promise<T>} run
 * @returns {Promise<T>}
 */
export async function outbound(dependency, operation, run) {
	const budgetMs = effectiveTimeout(dependency, operation);
	const signal = AbortSignal.timeout(budgetMs);

	const start = performance.now();
	outboundInflight.inc({ dependency });
	let result = 'ok';
	try {
		return await run(signal);
	} catch (err) {
		result = classify(signal, err);
		throw err;
	} finally {
		outboundInflight.dec({ dependency });
		outboundDuration.observe({ dependency, operation }, secondsSince(start));
		outboundTotal.inc({ dependency, operation, result });
	}
}

/**
 * @param {number} startMs
 * @returns {number}
 */
function secondsSince(startMs) {
	return (performance.now() - startMs) / 1000;
}

/** timeout iff MY budget expired: my signal aborted with a TimeoutError
 * reason, or the thrown error IS the deadline surfacing. Everything else
 * that throws (ECONNREFUSED, JSON parse, a caller bug) is plain error. */
/**
 * @param {AbortSignal} signal
 * @param {unknown} err
 * @returns {'ok' | 'error' | 'timeout'}
 */
function classify(signal, err) {
	const timeoutReason =
		signal.aborted &&
		signal.reason &&
		/** @type {{ name?: string }} */ (signal.reason).name === 'TimeoutError';
	const errIsTimeout = err && /** @type {{ name?: string }} */ (err).name === 'TimeoutError';
	return timeoutReason || errIsTimeout ? 'timeout' : 'error';
}

/** The probe paths — the hook skips them (they would flood every rate()
 * with noise), mirroring lumen's middleware. */
const PROBES = new Set(['/healthz', '/readyz']);

/** @param {string} pathname */
export function isProbe(pathname) {
	return PROBES.has(pathname);
}

/**
 * The inbound RED pair — called from the SvelteKit `handle` hook after
 * the response resolves. `route` is event.route.id (SvelteKit's pattern,
 * e.g. `/posts/[slug]`); null route (no page matched) records `unmatched`
 * — the honest series, never a raw path.
 *
 * @param {string | null} routeId
 * @param {string} method
 * @param {number} status
 * @param {number} durationMs
 */
export function observeInbound(routeId, method, status, durationMs) {
	const route = routeId ?? 'unmatched';
	httpRequestDuration.observe({ method, route }, durationMs / 1000);
	httpRequestTotal.inc({ method, route, status: String(status) });
}
