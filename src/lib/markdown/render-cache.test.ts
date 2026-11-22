import { describe, expect, it } from 'vitest';
import { renderMarkdownCached } from './render.ts';

// THE WHOLE-POST CACHE (the reader-side perf round): a published post's
// markdown is immutable between edits — the content hash IS the
// invalidation. The identity of the returned object is the observable:
// a hit returns the SAME instance (no re-render); new bytes = a new render.
describe('renderMarkdownCached — the content-addressed render cache', () => {
	it('the same markdown = the same object instance (the hit, no re-render)', async () => {
		const md = '# cache probe\n\n```go\nfmt.Println("hi")\n```\n';
		const a = await renderMarkdownCached(md);
		const b = await renderMarkdownCached(md);
		expect(b).toBe(a); // the identity — the render ran ONCE
	});

	it('new bytes = a new render (the edit path)', async () => {
		const a = await renderMarkdownCached('# v1\n');
		const b = await renderMarkdownCached('# v2\n');
		expect(b).not.toBe(a);
		expect(b.html).not.toBe(a.html);
	});

	it('the whitespace-only difference = different bytes = a re-render (the honest key)', async () => {
		const a = await renderMarkdownCached('# t\n\nbody\n');
		const b = await renderMarkdownCached('# t\n\n body \n');
		expect(b).not.toBe(a);
	});

	it('eviction: the cap is bounded (100 entries, FIFO)', async () => {
		// render 101 distinct docs — the first's entry must be evicted
		const first = await renderMarkdownCached('# the first\n\n```go\n0\n```\n');
		for (let i = 0; i < 101; i++) {
			await renderMarkdownCached(`# doc ${i}\n\nbody ${i}\n`);
		}
		const again = await renderMarkdownCached('# the first\n\n```go\n0\n```\n');
		expect(again).not.toBe(first); // evicted → re-rendered (a new object)
	});
});
