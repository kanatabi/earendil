// The correlation seam (2026-11-15): every outbound lumen call mints a
// request-id and sends it as X-Request-Id — lumen's chi middleware adopts it
// verbatim, so the blog's hop and the backend's hop share ONE id. Every
// failure log carries it, so one grep (or one Loki query) pulls the whole
// chain: this hop's line, lumen's access line, its error line, the queue
// job it spawned.
//
// Naming doctrine (mock.ts:145): `request_id` in log fields, the
// `X-Request-Id` header on the wire — never `rid`, never a second spelling.
//
// Browser-safe by construction: these helpers only RUN on the server paths
// (the SSR client and the /api proxy), but nothing here breaks if a browser
// bundle ever imports them — crypto.randomUUID is universal.

export const REQUEST_ID_HEADER = 'x-request-id';

export function newRequestId(): string {
	return crypto.randomUUID();
}

/** The response's echoed id wins (lumen echoes whatever it adopted); the
 * minted one is the fallback for a caller that predates the echo. */
export function echoedRequestId(res: Response, fallback: string): string {
	return res.headers.get(REQUEST_ID_HEADER) ?? fallback;
}

/** The access line — one line per outbound call, lumen-vocabulary-shaped
 * (`http.access hop=…`). The query string deliberately never logs (URLs can
 * carry secrets): callers pass the PATH only. Level follows lumen's rule:
 * 5xx/unreachable = error, 4xx = warn, success = plain log. */
export function logAccess(
	hop: string,
	method: string,
	path: string,
	status: number | 'unreachable',
	requestId: string
): void {
	const line = `http.access hop=${hop} method=${method} path=${path} status=${status} request_id=${requestId}`;
	if (status === 'unreachable' || status >= 500) console.error(line);
	else if (status >= 400) console.warn(line);
	else console.log(line);
}
