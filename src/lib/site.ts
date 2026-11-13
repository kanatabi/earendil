/** Canonical origin of THIS deployment — see DESIGN §9 (two-env contract). */

/** Production identity anchor used when ORIGIN is unset (current prod behavior). */
export const DEFAULT_ORIGIN = 'https://gofar.id';

/**
 * Normalize a canonical origin (scheme + host, optional port): trim, drop
 * trailing slashes so consumers can append paths safely, fall back to the
 * production default when unset/blank. Pure + server-only by contract —
 * callers live in +layout.server.ts (reads process.env.ORIGIN) and tests.
 */
export function resolveOrigin(raw?: string): string {
	const value = (raw ?? '').trim().replace(/\/+$/, '');
	return value === '' ? DEFAULT_ORIGIN : value;
}
