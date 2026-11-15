import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Metric } from 'prom-client';
import { OP } from '#lib/api/client.js';
import {
	DEP,
	SERVICE,
	TIMEOUT_TABLE,
	effectiveTimeout,
	httpRequestTotal,
	isProbe,
	observeInbound,
	outbound,
	outboundInflight,
	outboundTotal,
	register,
	timeoutEnvKeys,
	timeoutFor
} from './metrics.js';
// The observability registry's contract (2026-11-15): every outside call
// is counted with a result axis (ok|error|timeout — a hung lumen is a
// DIFFERENT series from a failed one), the wrapped fn receives the ABORT
// signal so the budget actually bounds it, the in-flight gauge moves up
// and back down, and the inbound pair keys on the ROUTE ID (never a raw
// path). The register is shared by the hooks and server.js — that's why
// this module is plain JS.

async function counterValue(vec: Metric<string>, labels: Record<string, string>) {
	const metric = await vec.get();
	const { values } = metric;
	for (const v of values) {
		if (Object.entries(labels).every(([k, want]) => v.labels[k] === want)) {
			return v.value;
		}
	}
	return null;
}

afterEach(() => {
	vi.unstubAllEnvs();
});

describe('the registry shape', () => {
	it('the timeout table op keys are a SUBSET of the client OP values (the drift guard)', () => {
		// the two spellings can't share one file (this module is plain JS;
		// client.ts is TS) — the guard is the single-source substitute
		const opValues: Set<string> = new Set(Object.values(OP));
		const tableOps = Object.keys(TIMEOUT_TABLE[DEP.Lumen].ops ?? {});
		expect(tableOps.length).toBeGreaterThan(0);
		for (const key of tableOps) expect(opValues.has(key)).toBe(true);
		expect(tableOps.includes(OP.ProxyRelay)).toBe(true);
		expect(tableOps.includes(OP.SuggestPosts)).toBe(true);
	});

	it('carries the static service label on every scraped series', async () => {
		const text = await register.metrics();
		expect(text).toContain('service="' + SERVICE + '"');
		expect(text).toContain('outbound_request_total');
		expect(text).toContain('http_request_total');
	});

	it('enumerates the ops and the one dependency', () => {
		expect(Object.values(OP)).toEqual([
			'list-posts',
			'read-post',
			'suggest-posts',
			'search-posts',
			'list-photos',
			'featured-photo',
			'list-tags',
			'proxy-relay'
		]);
		expect(DEP).toEqual({ Lumen: 'lumen' });
	});
});

describe('timeoutFor + effectiveTimeout (missing or empty env = default)', () => {
	it('the table: op override wins, dep default fills the rest', () => {
		expect(timeoutFor(DEP.Lumen, OP.SuggestPosts)).toBe(2000);
		expect(timeoutFor(DEP.Lumen, OP.ListPosts)).toBe(3000);
	});

	it('env override (dep level) wins over the table', () => {
		vi.stubEnv('EARENDIL_TIMEOUT_LUMEN', '700');
		expect(effectiveTimeout(DEP.Lumen, OP.ListPosts)).toBe(700);
	});

	it('the per-op env wins over the dep env', () => {
		vi.stubEnv('EARENDIL_TIMEOUT_LUMEN', '700');
		vi.stubEnv('EARENDIL_TIMEOUT_LUMEN_SUGGEST_POSTS', '150');
		expect(effectiveTimeout(DEP.Lumen, OP.SuggestPosts)).toBe(150);
		expect(effectiveTimeout(DEP.Lumen, OP.ListPosts)).toBe(700);
	});

	it('EMPTY or garbage env falls back — never a zero or a NaN budget', () => {
		vi.stubEnv('EARENDIL_TIMEOUT_LUMEN', '');
		expect(effectiveTimeout(DEP.Lumen, OP.ListPosts)).toBe(3000);
		vi.stubEnv('EARENDIL_TIMEOUT_LUMEN', 'not-a-number');
		expect(effectiveTimeout(DEP.Lumen, OP.ListPosts)).toBe(3000);
		vi.stubEnv('EARENDIL_TIMEOUT_LUMEN', '0');
		expect(effectiveTimeout(DEP.Lumen, OP.ListPosts)).toBe(3000);
	});

	it('the env keys derive from the table (the machine-readable pair)', () => {
		expect(timeoutEnvKeys(DEP.Lumen)).toEqual([
			'EARENDIL_TIMEOUT_LUMEN',
			'EARENDIL_TIMEOUT_LUMEN_SUGGEST_POSTS',
			'EARENDIL_TIMEOUT_LUMEN_PROXY_RELAY'
		]);
	});
});

describe('outbound — the wrapper', () => {
	it('a resolved response is ok even when it carries a 5xx (the transport succeeded)', async () => {
		const before = await counterValue(outboundTotal, {
			dependency: DEP.Lumen,
			operation: OP.ListPosts,
			result: 'ok'
		});
		const res = await outbound(
			DEP.Lumen,
			OP.ListPosts,
			async () => new Response('nope', { status: 500 })
		);
		expect(res.status).toBe(500);
		const after = await counterValue(outboundTotal, {
			dependency: DEP.Lumen,
			operation: OP.ListPosts,
			result: 'ok'
		});
		expect(after).toBe((before ?? 0) + 1);
	});

	it('a thrown error is error, and it RETHROWS (instrumentation never swallows)', async () => {
		const before = await counterValue(outboundTotal, {
			dependency: DEP.Lumen,
			operation: OP.ListPosts,
			result: 'error'
		});
		const boom = new Error('ECONNREFUSED');
		await expect(outbound(DEP.Lumen, OP.ListPosts, () => Promise.reject(boom))).rejects.toBe(boom);
		const after = await counterValue(outboundTotal, {
			dependency: DEP.Lumen,
			operation: OP.ListPosts,
			result: 'error'
		});
		expect(after).toBe((before ?? 0) + 1);
	});

	it('a hung call dies at the budget and classifies timeout', async () => {
		vi.stubEnv('EARENDIL_TIMEOUT_LUMEN_LIST_POSTS', '30'); // 30ms
		const before = await counterValue(outboundTotal, {
			dependency: DEP.Lumen,
			operation: OP.ListPosts,
			result: 'timeout'
		});
		await expect(
			outbound(DEP.Lumen, OP.ListPosts, (signal) => {
				// the defiant callee: ignores the signal, resolves past the
				// budget — the fetch the REAL code issues would reject with
				// the TimeoutError reason; simulate exactly that
				return new Promise((_resolve, reject) => {
					signal.addEventListener('abort', () => reject(signal.reason));
				});
			})
		).rejects.toMatchObject({ name: 'TimeoutError' });
		const after = await counterValue(outboundTotal, {
			dependency: DEP.Lumen,
			operation: OP.ListPosts,
			result: 'timeout'
		});
		expect(after).toBe((before ?? 0) + 1);
	});

	it('the wrapped fn RECEIVES the signal carrying the budget', async () => {
		let received: AbortSignal | undefined;
		await outbound(DEP.Lumen, OP.ListTags, (signal) => {
			received = signal;
			return Promise.resolve('x');
		});
		expect(received instanceof AbortSignal).toBe(true);
		expect(received?.aborted).toBe(false);
	});

	it('the in-flight gauge moves up and settles back', async () => {
		const before = await counterValue(outboundInflight, { dependency: DEP.Lumen });
		let during;
		await outbound(DEP.Lumen, OP.ListTags, async () => {
			during = await counterValue(outboundInflight, { dependency: DEP.Lumen });
			return 'x';
		});
		const after = await counterValue(outboundInflight, { dependency: DEP.Lumen });
		expect(during).toBe((before ?? 0) + 1);
		expect(after).toBe(before ?? 0);
	});
});

describe('the inbound pair', () => {
	it('a null route id records the honest unmatched series', async () => {
		const before = await counterValue(httpRequestTotal, {
			method: 'GET',
			route: 'unmatched',
			status: '404'
		});
		observeInbound(null, 'GET', 404, 1.5);
		const after = await counterValue(httpRequestTotal, {
			method: 'GET',
			route: 'unmatched',
			status: '404'
		});
		expect(after).toBe((before ?? 0) + 1);
	});
});

describe('probes', () => {
	it('the health doors skip', () => {
		expect(isProbe('/healthz')).toBe(true);
		expect(isProbe('/readyz')).toBe(true);
		expect(isProbe('/posts/observability-is-a-contract')).toBe(false);
	});
});
