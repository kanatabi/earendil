import { describe, expect, it } from 'vitest';
import { ApiError } from './client';
import { mockApi } from './mock';

describe('getPosts', () => {
	it('returns all posts with correct total', async () => {
		const { total, items } = await mockApi.getPosts();
		expect(total).toBe(12);
		expect(items).toHaveLength(12);
		expect(items.map((p) => p.slug).slice(0, 5)).toEqual([
			'observability-is-a-contract',
			'shape-of-a-useful-queue',
			'when-latency-becomes-a-product-decision',
			'designing-for-the-failure-you-can-see',
			'a-small-field-guide-to-idempotency'
		]);
	});

	it('honors offset and limit', async () => {
		const { total, items } = await mockApi.getPosts({ offset: 1, limit: 2 });
		expect(total).toBe(12);
		expect(items.map((p) => p.slug)).toEqual([
			'shape-of-a-useful-queue',
			'when-latency-becomes-a-product-decision'
		]);
	});

	it('summaries do not carry detail fields', async () => {
		const { items } = await mockApi.getPosts({ limit: 1 });
		expect(items[0]).not.toHaveProperty('content');
		expect(items[0]).not.toHaveProperty('tags');
	});

	it('filters by tag(s), OR-matched', async () => {
		const { total, items } = await mockApi.getPosts({ tags: ['queues'] });
		expect(total).toBe(1);
		expect(items[0].slug).toBe('shape-of-a-useful-queue');
		const union = await mockApi.getPosts({ tags: ['queues', 'latency'] });
		expect(union.total).toBe(2);
		expect(union.items.map((p) => p.slug)).toEqual([
			'shape-of-a-useful-queue',
			'when-latency-becomes-a-product-decision'
		]);
		const none = await mockApi.getPosts({ tags: ['nope'] });
		expect(none.items).toEqual([]);
	});

	it('filters by inclusive date window', async () => {
		const { total, items } = await mockApi.getPosts({ from: '2024-01-09', to: '2024-06-02' });
		expect(total).toBe(5);
		expect(items.every((p) => p.date >= '2024-01-09' && p.date <= '2024-06-02')).toBe(true);
	});

	it('combines tags and dates', async () => {
		const { total, items } = await mockApi.getPosts({
			tags: ['distributed-systems'],
			from: '2023-12-01'
		});
		expect(total).toBe(2);
		expect(items.map((p) => p.slug)).toEqual([
			'shape-of-a-useful-queue',
			'the-day-the-clock-jumped'
		]);
	});

	it('sorts explicitly when asked, keeps curation otherwise', async () => {
		const { items } = await mockApi.getPosts();
		expect(items.map((p) => p.slug)[0]).toBe('observability-is-a-contract'); // curated, not sorted
		const quick = (await mockApi.getPosts({ sort: 'quickest' })).items.map((p) => p.readTime);
		expect([...quick].sort((a, b) => a - b)).toEqual(quick);
		const old = (await mockApi.getPosts({ sort: 'oldest' })).items.map((p) => p.date);
		expect([...old].sort()).toEqual(old);
	});

	it('filters by inclusive read-time window', async () => {
		const { items, total } = await mockApi.getPosts({ readMin: 10, readMax: 12 });
		expect(total).toBe(items.length);
		expect(items.every((p) => p.readTime >= 10 && p.readTime <= 12)).toBe(true);
	});

	it('search honors sort override over relevance', async () => {
		const relevance = await mockApi.searchPosts('observability');
		const newest = await mockApi.searchPosts('observability', { sort: 'newest' });
		expect(newest.total).toBe(relevance.total);
		const dates = newest.items.map((p) => p.date);
		expect([...dates].sort().reverse()).toEqual(dates);
	});

	it('narrows search results with tag facets', async () => {
		const all = await mockApi.searchPosts('observability');
		const scoped = await mockApi.searchPosts('observability', { tags: ['logging'] });
		expect(scoped.total).toBeGreaterThan(0);
		expect(scoped.total).toBeLessThanOrEqual(all.total);
	});

	it('searches with ranking, totals, and pagination', async () => {
		const { total, items } = await mockApi.searchPosts('queue');
		expect(total).toBeGreaterThanOrEqual(1);
		expect(items[0].slug).toBe('shape-of-a-useful-queue');
		expect((await mockApi.searchPosts('zzzz-nothing')).items).toEqual([]);
		const paged = await mockApi.searchPosts('a', { offset: 1, limit: 1 });
		expect(paged.items).toHaveLength(1);
	});
});

describe('getPost', () => {
	it('returns the queue article with markdown sections and code fences', async () => {
		const post = await mockApi.getPost('shape-of-a-useful-queue');
		expect(post.title).toBe('The shape of a useful queue');
		expect(post.readTime).toBe(8);
		expect(post.tags.length).toBeGreaterThan(0);
		expect(post.content).toContain('## The queue is a promise');
		expect(post.content).toContain('> A queue buys time');
		expect(post.content).toContain('```go');
		expect(post.content).toContain('```bash');
		expect(post.content).toMatch(/\[.+\]\(.+\)/);
	});

	it('rejects an unknown slug with ApiError 404', async () => {
		await expect(mockApi.getPost('no-such-post')).rejects.toThrow(ApiError);
		await expect(mockApi.getPost('no-such-post')).rejects.toMatchObject({ status: 404 });
	});
});

describe('suggestPosts', () => {
	it('finds the queue post first for "queue"', async () => {
		const { results } = await mockApi.suggestPosts('queue');
		expect(results.length).toBeGreaterThan(0);
		expect(results[0].slug).toBe('shape-of-a-useful-queue');
	});

	it('is case-insensitive over title and preview', async () => {
		const { results } = await mockApi.suggestPosts('BACKPRESSURE');
		expect(results.map((p) => p.slug)).toContain('shape-of-a-useful-queue');
	});

	it('returns empty results when nothing matches', async () => {
		const { results } = await mockApi.suggestPosts('zzz');
		expect(results).toEqual([]);
	});

	it('honors the limit', async () => {
		const { results } = await mockApi.suggestPosts('a', 2);
		expect(results.length).toBeLessThanOrEqual(2);
	});
});

describe('thumbnail handling', () => {
	it('posts may carry null thumbnails', async () => {
		const { items } = await mockApi.getPosts();
		const withThumb = items.filter((p) => p.thumbnail !== null);
		const withoutThumb = items.filter((p) => p.thumbnail === null);
		expect(withThumb.length).toBeGreaterThan(0);
		expect(withoutThumb.length).toBeGreaterThan(0);
	});
});

describe('getPhotos', () => {
	it('returns a non-empty list with consistent total', async () => {
		const { total, items } = await mockApi.getPhotos();
		expect(items.length).toBeGreaterThan(0);
		expect(total).toBe(items.length);
	});

	it('each photo has dimensions and varied aspect ratios', async () => {
		const { items } = await mockApi.getPhotos();
		expect(items.every((p) => p.width > 0 && p.height > 0)).toBe(true);
		const ratios = new Set(items.map((p) => (p.width / p.height).toFixed(2)));
		expect(ratios.size).toBeGreaterThan(3);
	});

	it('honors the limit while keeping the full total', async () => {
		const { total, items } = await mockApi.getPhotos({ limit: 6 });
		expect(items).toHaveLength(6);
		expect(total).toBeGreaterThan(6);
	});

	it('serves a featured photo with source and alt', async () => {
		const featured = await mockApi.getFeaturedPhoto();
		expect(featured).not.toBeNull();
		expect(featured?.src).toMatch(/^https:\/\//);
		expect(featured?.alt).not.toBe('');
	});
});

describe('listTags', () => {
	it('serves a non-empty, count-sorted cloud with sane entries', async () => {
		const tags = await mockApi.listTags();
		expect(tags.length).toBeGreaterThan(0);
		expect(tags.every((t) => t.name.length > 0 && t.posts >= 1)).toBe(true);
		const posts = tags.map((t) => t.posts);
		expect([...posts].sort((a, b) => b - a)).toEqual(posts);
	});

	it('every tag name resolves against the real corpus tags', async () => {
		const slugs = (await mockApi.getPosts()).items.map((p) => p.slug);
		const corpus = new Set(
			(await Promise.all(slugs.map((s) => mockApi.getPost(s)))).flatMap((p) => p.tags)
		);
		const tags = await mockApi.listTags();
		expect(tags.every((t) => corpus.has(t.name))).toBe(true);
	});
});
