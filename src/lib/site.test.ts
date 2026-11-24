import { describe, expect, it } from 'vitest';
import { robotsTxt, rssXml, sitemapXml, xmlEscape } from './site.ts';
import type { PostSummary } from './api/types.ts';

/**
 * The syndication round: the feed/sitemap/robots assembly is PURE —
 * routes supply posts + origin, these functions own the escaping and
 * the shape. The twin corpus here is two posts with adversarial text.
 */
const post = (slug: string, title: string, date: string): PostSummary => ({
	slug,
	title,
	subtitle: '',
	preview: 'the opening',
	date,
	readTime: 4,
	thumbnail: null
});

describe('xmlEscape', () => {
	it('escapes the five characters that break XML', () => {
		expect(xmlEscape(`a & b < c > d " e ' f`)).toBe('a &amp; b &lt; c &gt; d &quot; e &apos; f');
	});
});

describe('rssXml', () => {
	it('the channel carries the curation order, absolute links, RFC-822 dates', () => {
		const xml = rssXml(
			[
				post('first', 'First', '2026-11-01T10:00:00Z'),
				post('second', 'Second', '2026-11-20T10:00:00Z')
			],
			'https://gofar.id',
			'gofar;'
		);
		expect(xml).toContain('<rss version="2.0"');
		expect(xml).toContain('<title>gofar;</title>');
		// the FIRST post is the channel's newest — curation order preserved
		expect(xml.indexOf('posts/first')).toBeLessThan(xml.indexOf('posts/second'));
		expect(xml).toContain('<link>https://gofar.id/posts/first</link>');
		expect(xml).toContain('<guid isPermaLink="true">https://gofar.id/posts/first</guid>');
		expect(xml).toContain(`<pubDate>${new Date('2026-11-01T10:00:00Z').toUTCString()}</pubDate>`);
		expect(xml).toContain(
			`<lastBuildDate>${new Date('2026-11-20T10:00:00Z').toUTCString()}</lastBuildDate>`
		);
		expect(xml).toContain('<atom:link href="https://gofar.id/rss.xml"');
	});

	it('escapes adversarial titles/previews', () => {
		const xml = rssXml(
			[post('x', 'a & b < c > d " e', '2026-11-01T10:00:00Z')],
			'https://gofar.id',
			'gofar;'
		);
		expect(xml).toContain('<title>a &amp; b &lt; c &gt; d &quot; e</title>');
		expect(xml).not.toContain('a & b < c');
	});

	it('an empty corpus still renders a valid channel', () => {
		const xml = rssXml([], 'https://gofar.id', 'gofar;');
		expect(xml).toContain('</channel>');
		expect(xml).not.toContain('<item>');
	});
});

describe('sitemapXml', () => {
	it('home (lastmod = the newest post), the static doors, then every post', () => {
		const xml = sitemapXml(
			[post('a', 'A', '2026-11-01T10:00:00Z'), post('b', 'B', '2026-11-20T10:00:00Z')],
			'https://gofar.id'
		);
		expect(xml).toContain('<urlset');
		expect(xml.indexOf('https://gofar.id/</loc>')).toBeGreaterThan(-1);
		expect(xml).toContain('<lastmod>2026-11-20T10:00:00.000Z</lastmod>'); // home's lastmod
		expect(xml.indexOf('gallery')).toBeLessThan(xml.indexOf('posts/a'));
		expect(xml).toContain('<loc>https://gofar.id/posts/a</loc>');
	});

	it('the static doors carry no lastmod', () => {
		const xml = sitemapXml([], 'https://gofar.id');
		expect(xml).toContain('<loc>https://gofar.id/about</loc>');
		expect(xml).not.toContain('<lastmod>');
	});
});

describe('robotsTxt', () => {
	it('allows everything and advertises the sitemap', () => {
		expect(robotsTxt('https://gofar.id')).toBe(
			'User-agent: *\nAllow: /\nSitemap: https://gofar.id/sitemap.xml\n'
		);
	});
});
