import { describe, expect, it } from 'vitest';
import { DEFAULT_ORIGIN, resolveOrigin } from './site';

describe('resolveOrigin (two-env config contract, DESIGN §9)', () => {
	it('falls back to the production default when ORIGIN is unset or blank', () => {
		expect(resolveOrigin(undefined)).toBe(DEFAULT_ORIGIN);
		expect(resolveOrigin('')).toBe(DEFAULT_ORIGIN);
		expect(resolveOrigin('   ')).toBe(DEFAULT_ORIGIN);
	});

	it('passes a staging origin through untouched (same image, different env value)', () => {
		expect(resolveOrigin('https://staging.gofar.id')).toBe('https://staging.gofar.id');
	});

	it('strips surrounding whitespace and trailing slashes (no // when appending paths)', () => {
		expect(resolveOrigin('  https://gofar.id/  ')).toBe('https://gofar.id');
		expect(resolveOrigin('https://staging.gofar.id///')).toBe('https://staging.gofar.id');
	});

	it('keeps ports (cluster rehearsals run on non-443 origins)', () => {
		expect(resolveOrigin('http://localhost:4173')).toBe('http://localhost:4173');
	});
});
