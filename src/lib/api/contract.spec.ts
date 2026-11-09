// contract.spec.ts — THE acceptance test of the whole program's first rule:
// "lumen serves BlogApi's exact shapes; the FE suite run against real lumen IS
// the acceptance test" (workspace AGENTS, lumen §1, mellon PLAN M1).
//
// Env-gated and SKIPPED by default so offline dev/CI never changes:
//   LUMEN_URL=http://localhost:8080 npx vitest run src/lib/api/contract.spec.ts
//
// Strategy: drive the SAME client the pages use (`createApi(LUMEN_URL)`) and
// compare against the mock — the contract twin — response-by-response. The
// mock IS the expected value; drift is a bug in whichever moved.
import { describe, expect, it } from 'vitest';
import { createApi } from './client';
import { mockApi } from './mock';

// '' when unset keeps the gate falsy AND the type honest (createApi: string)
const LUMEN_URL = process.env.LUMEN_URL ?? '';
const gated = LUMEN_URL ? describe : describe.skip;

if (!LUMEN_URL) {
	// one honest line of noise when someone runs the suite expecting this live
	console.log('[contract] LUMEN_URL unset — live-vs-mock contract suite SKIPPED');
}

gated('lumen serves the BlogApi contract (live vs mock twin)', () => {
	const lumen = createApi(LUMEN_URL);

	// Deep-equality against the mock, with the ONE documented tolerance: the
	// tag cloud's tie order is each BE's own stable choice (lumen: count DESC,
	// name ASC; the mock: its curated array) — §1 only pins count-desc.
	it('getPosts() matches the corpus exactly (curation order included)', async () => {
		expect(await lumen.getPosts()).toEqual(await mockApi.getPosts());
	});

	it('offset/limit pages match', async () => {
		for (const opts of [{ offset: 1, limit: 2 }, { offset: 10, limit: 5 }, { limit: 1 }]) {
			expect(await lumen.getPosts(opts)).toEqual(await mockApi.getPosts(opts));
		}
	});

	it('tag OR-filters match', async () => {
		for (const tags of [['queues'], ['queues', 'latency'], ['nope']]) {
			expect(await lumen.getPosts({ tags })).toEqual(await mockApi.getPosts({ tags }));
		}
	});

	it('date + read-time windows match', async () => {
		expect(await lumen.getPosts({ from: '2024-01-09', to: '2024-06-02' })).toEqual(
			await mockApi.getPosts({ from: '2024-01-09', to: '2024-06-02' })
		);
		expect(await lumen.getPosts({ readMin: 10, readMax: 12 })).toEqual(
			await mockApi.getPosts({ readMin: 10, readMax: 12 })
		);
	});

	it('explicit sorts match, curation default matches', async () => {
		for (const sort of ['newest', 'oldest', 'quickest', 'longest'] as const) {
			expect(await lumen.getPosts({ sort })).toEqual(await mockApi.getPosts({ sort }));
		}
	});

	it('every published post round-trips detail-for-detail', async () => {
		const { items } = await mockApi.getPosts();
		for (const s of items) {
			expect(await lumen.getPost(s.slug)).toEqual(await mockApi.getPost(s.slug));
		}
	});

	it('unknown slug throws ApiError 404', async () => {
		await expect(lumen.getPost('no-such-post')).rejects.toMatchObject({ status: 404 });
	});

	it('suggest obeys the contract: finds, respects cap, empty on miss', async () => {
		expect((await lumen.suggestPosts('queue')).results.map((p) => p.slug)).toContain(
			'shape-of-a-useful-queue'
		);
		expect((await lumen.suggestPosts('BACKPRESSURE')).results.length).toBeGreaterThan(0);
		expect((await lumen.suggestPosts('zzz')).results).toEqual([]);
		expect((await lumen.suggestPosts('a', 2)).results.length).toBeLessThanOrEqual(2);
	});

	// Search & suggest: RANKING IS ENGINE-OWNED (lumen §4 — Meilisearch's
	// relevance + typo tolerance is the product, the mock's naive scoring was
	// a fixture courtesy). Shape, filters, limits and leak rules stay hard;
	// ORDER and exact hit-sets do not get diffed against the mock.
	it('search obeys the contract: shape, facets narrow, limits hold, no drafts', async () => {
		const all = await lumen.searchPosts('observability');
		expect(all.total).toBeGreaterThanOrEqual(1);
		expect(all.items.every((p) => 'slug' in p && 'readTime' in p && 'thumbnail' in p)).toBe(true);
		const scoped = await lumen.searchPosts('observability', { tags: ['logging'] });
		expect(scoped.total).toBeLessThanOrEqual(all.total);
		const queue = await lumen.searchPosts('queue');
		expect(queue.items.map((p) => p.slug)).toContain('shape-of-a-useful-queue');
		expect((await lumen.searchPosts('zzzz-nothing')).items).toEqual([]);
		const paged = await lumen.searchPosts('a', { offset: 1, limit: 1 });
		expect(paged.items).toHaveLength(1);
		expect(paged.items[0].slug).not.toBe(
			(await lumen.searchPosts('a', { offset: 0, limit: 1 })).items[0].slug
		);
	});

	it('photos list matches, limit keeps total', async () => {
		expect(await lumen.getPhotos()).toEqual(await mockApi.getPhotos());
		const paged = await lumen.getPhotos({ limit: 6 });
		const mockPaged = await mockApi.getPhotos({ limit: 6 });
		expect(paged.total).toBe(mockPaged.total);
		expect(paged.items).toEqual(mockPaged.items);
	});

	it('featured photo matches', async () => {
		expect(await lumen.getFeaturedPhoto()).toEqual(await mockApi.getFeaturedPhoto());
	});

	it('tag cloud carries THE SAME curated set with count-desc order', async () => {
		const [live, mock] = await Promise.all([lumen.listTags(), mockApi.listTags()]);
		// membership + counts: exact
		expect([...live].sort((a, b) => a.name.localeCompare(b.name))).toEqual(
			[...mock].sort((a, b) => a.name.localeCompare(b.name))
		);
		// the §1-pinned invariant only: counts are non-increasing
		const counts = live.map((t) => t.posts);
		expect([...counts].sort((a, b) => b - a)).toEqual(counts);
	});

	// the hard rule of §1, end-to-end through the REAL client the pages use:
	it('drafts never leak — list, search, suggest, and detail all miss them', async () => {
		const all = await lumen.getPosts({ limit: 100 });
		expect(all.items.map((p) => p.slug)).not.toContain('drafts-are-fantasies');
		expect((await lumen.searchPosts('fantasies')).items.map((p) => p.slug)).not.toContain(
			'drafts-are-fantasies'
		);
		// the engine's typo tolerance may match published content on words
		// near the draft's title — the leak rule is about the DRAFT SLUG
		// never surfacing, not about emptiness:
		expect((await lumen.suggestPosts('must never leak')).results.map((p) => p.slug)).not.toContain(
			'drafts-are-fantasies'
		);
		await expect(lumen.getPost('drafts-are-fantasies')).rejects.toMatchObject({ status: 404 });
	});
});
