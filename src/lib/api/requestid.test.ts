import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, createApi } from './client';
import { REQUEST_ID_HEADER, newRequestId, logAccess } from './requestid';

// The correlation seam's contract (2026-11-15): every outbound call mints
// and sends an id, failures log WITH it, and lumen's echo lands in the
// thrown error — one id chains both services.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('newRequestId', () => {
	it('mints a UUID v4', () => {
		expect(newRequestId()).toMatch(UUID);
	});

	it('mints a fresh one every call', () => {
		expect(newRequestId()).not.toBe(newRequestId());
	});
});

describe('the outbound seam (createApi against a stubbed fetch)', () => {
	it('sends x-request-id on every call — a fresh one each time', async () => {
		const seen: string[] = [];
		vi.stubGlobal(
			'fetch',
			vi.fn(async (_input: string | URL, init?: RequestInit) => {
				seen.push(new Headers(init?.headers).get(REQUEST_ID_HEADER) ?? '');
				return Response.json([]);
			})
		);
		const api = createApi('http://lumen.test');
		await api.listTags();
		await api.listTags();
		expect(seen).toHaveLength(2);
		expect(seen[0]).toMatch(UUID);
		expect(seen[1]).toMatch(UUID);
		expect(seen[0]).not.toBe(seen[1]);
	});

	it('captures the echoed id from lumen into ApiError', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(
				async () =>
					new Response('nope', { status: 500, headers: { [REQUEST_ID_HEADER]: 'lumen-minted-1' } })
			)
		);
		const api = createApi('http://lumen.test');
		const err = (await api.listTags().catch((e: unknown) => e)) as ApiError;
		expect(err).toBeInstanceOf(ApiError);
		expect(err.status).toBe(500);
		expect(err.requestId).toBe('lumen-minted-1');
	});

	it('a network failure is a 503 carrying the MINTED id', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => {
				throw new Error('ECONNREFUSED');
			})
		);
		const api = createApi('http://lumen.test');
		const err = (await api.listTags().catch((e: unknown) => e)) as ApiError;
		expect(err.status).toBe(503);
		expect(err.requestId).toMatch(UUID);
	});
});

describe('logAccess', () => {
	it('the failure line carries the id, hop, and path', () => {
		const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		logAccess('ssr', 'GET', '/api/posts', 500, 'req-42');
		expect(errSpy).toHaveBeenCalledOnce();
		const line = String(errSpy.mock.calls[0]?.[0]);
		expect(line).toContain('request_id=req-42');
		expect(line).toContain('hop=ssr');
		expect(line).toContain('path=/api/posts');
	});

	it('successes speak without error level', () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		logAccess('proxy', 'GET', '/api/tags', 200, 'req-7');
		expect(logSpy).toHaveBeenCalledOnce();
		expect(errSpy).not.toHaveBeenCalled();
	});

	it('the query string never logs (the path is the safe surface)', () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		logAccess('proxy', 'GET', '/api/search', 200, 'req-8');
		expect(String(logSpy.mock.calls[0]?.[0])).not.toContain('?');
	});
});

describe('the /api proxy (the browser hop)', () => {
	it('forwards the minted id upstream and echoes it back to the browser', async () => {
		let upstreamId = '';
		vi.stubGlobal(
			'fetch',
			vi.fn(async (_input: string | URL, init?: RequestInit) => {
				upstreamId = new Headers(init?.headers).get(REQUEST_ID_HEADER) ?? '';
				return Response.json(['tag-a'], {
					headers: { [REQUEST_ID_HEADER]: 'echoed-by-lumen' }
				});
			})
		);
		const { GET } = await import('../../routes/api/[...path]/+server.ts');
		const res = await GET({
			url: new URL('http://blog.test/api/tags?q=x'),
			params: { path: 'tags' }
		});
		expect(upstreamId).toMatch(UUID);
		expect(res.headers.get(REQUEST_ID_HEADER)).toBe('echoed-by-lumen');
		expect(res.status).toBe(200);
	});

	it('an unreachable lumen is a 503 carrying the minted id', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => {
				throw new Error('ECONNREFUSED');
			})
		);
		const { GET } = await import('../../routes/api/[...path]/+server.ts');
		const res = await GET({ url: new URL('http://blog.test/api/tags'), params: { path: 'tags' } });
		expect(res.status).toBe(503);
		expect(res.headers.get(REQUEST_ID_HEADER)).toMatch(UUID);
	});
});
