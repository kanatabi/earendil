import { describe, expect, it } from 'vitest';
import { colophon, education, elsewhere, experience, facts, research, stack } from './about.ts';

/**
 * Every keyed each-block in the templates keys by these labels/fields — a
 * duplicate renders a dev-mode `each_key_duplicate` crash (a real one shipped
 * once via a mis-deleted colophon row). The data file is hand-edited brand
 * copy, so uniqueness belongs in a test.
 */
const unique = (keys: string[]) => new Set(keys).size === keys.length;

describe('about content invariants', () => {
	it('facts rows have unique labels', () => {
		expect(unique(facts.map((r) => r.label))).toBe(true);
	});

	it('colophon rows have unique labels', () => {
		expect(unique(colophon.map((r) => r.label))).toBe(true);
	});

	it('stack groups have unique labels', () => {
		expect(unique(stack.groups.map((g) => g.label))).toBe(true);
	});

	it('social links have unique labels', () => {
		expect(unique(elsewhere.map((l) => l.label))).toBe(true);
	});

	it('experience entries key uniquely (period + company)', () => {
		expect(unique(experience.map((e) => e.period + e.company))).toBe(true);
	});

	it('research papers key uniquely by title', () => {
		expect(unique(research.map((p) => p.title))).toBe(true);
	});

	it('education highlights key uniquely by body', () => {
		expect(unique(education.highlights.map((h) => h.body))).toBe(true);
	});
});
