import { describe, expect, it } from 'vitest';
import { mockApi } from '../api/mock';
import { renderMarkdown } from './render';

/** Extra markdown covering what the queue fixture lacks: h3, table, strikethrough, tasks. */
const richFixture = `## Hidden Costs

~~Old default~~ New default.

### Buffer sizing

| Queue | Bound |
| --- | --- |
| In-memory | 1000 |

- [x] Measure depth
- [ ] Wire alerts
`;

describe('renderMarkdown — headings and anchors', () => {
	it('gives H2/H3 headings stable slug ids', async () => {
		const post = await mockApi.getPost('shape-of-a-useful-queue');
		const { html } = await renderMarkdown(post.content);
		expect(html).toContain('<h2 id="the-queue-is-a-promise"');
		expect(html).toContain('<h2 id="further-reading"');

		const rich = await renderMarkdown(richFixture);
		expect(rich.html).toContain('<h2 id="hidden-costs"');
		expect(rich.html).toContain('<h3 id="buffer-sizing"');
	});
});

describe('renderMarkdown — TOC', () => {
	it('collects ordered h2/h3 entries matching heading ids, text without markdown', async () => {
		const post = await mockApi.getPost('shape-of-a-useful-queue');
		const { html, toc } = await renderMarkdown(post.content);
		expect(toc.map((entry) => entry.depth)).toEqual([2, 2, 2, 2, 2]);
		expect(toc.map((entry) => entry.text)).toEqual([
			'The queue is a promise',
			'Backpressure is the feature',
			'Fairness has a cost',
			'A practical checklist',
			'Further reading'
		]);
		// Every TOC id must exist as a heading id in the rendered HTML.
		for (const entry of toc) {
			expect(html).toContain(`id="${entry.id}"`);
		}

		const rich = await renderMarkdown(
			'## Hidden *Costs*\n\n### Buffer ~~sizing~~\n\n#### ignored\n'
		);
		expect(rich.toc).toEqual([
			{ id: 'hidden-costs', text: 'Hidden Costs', depth: 2 },
			{ id: 'buffer-sizing', text: 'Buffer sizing', depth: 3 }
		]);
	});
});

describe('renderMarkdown — Shiki code blocks', () => {
	it('highlights go fences with dual-theme CSS vars that survive sanitization', async () => {
		const post = await mockApi.getPost('shape-of-a-useful-queue');
		const { html } = await renderMarkdown(post.content);
		expect(html).toMatch(/<pre[^>]*class="shiki[^"]*"[^>]*--shiki-light/); // attrs may precede class (the source-line anchor)
		expect(html).toContain('--shiki-dark');
		expect(html).toContain('language-go');
		// class on pre/code preserved by DOMPurify
		expect(html).toMatch(/<code class="language-(go|bash)">/);
	});

	it('falls back to plain pre/code for unknown languages without throwing', async () => {
		const { html } = await renderMarkdown('```wasm\n(local $x i32)\n```\n');
		expect(html).toContain('<pre');
		expect(html).toContain('(local $x i32)');
		expect(html).not.toContain('language-wasm');
	});
});

describe('renderMarkdown — rich blocks', () => {
	it('renders blockquotes, tables, strikethrough, and task lists', async () => {
		const post = await mockApi.getPost('shape-of-a-useful-queue');
		const { html } = await renderMarkdown(post.content);
		expect(html).toContain('<blockquote'); // attrs may follow (the source-line anchor)

		const rich = await renderMarkdown(richFixture);
		// Tables ride a horizontal-scroll wrapper (`.prose .table-wrap`): a wide
		// table's min-content beats the column and no wrap rule can shrink it.
		expect(rich.html).toContain('<div class="table-wrap">');
		expect(rich.html).toContain('<table '); // attrs may follow (the source-line anchor)
		expect(rich.html).toContain('</table>\n</div>');
		expect(rich.html).toContain('<s>Old default</s>');
		expect(rich.html).toMatch(/<input[^>]*checked[^>]*type="checkbox"/);
		expect(rich.html).toMatch(/<input[^>]*type="checkbox"/);
	});
});

describe('renderMarkdown — sanitization', () => {
	it('strips raw script tags and event-handler attributes', async () => {
		const { html } = await renderMarkdown(
			'<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n'
		);
		// No live markup survives: html:false escapes, DOMPurify sanitizes.
		expect(html).not.toContain('<script');
		expect(html).not.toMatch(/<img[^>]+onerror/i);
		expect(html).toContain('&lt;script&gt;');
	});
});

describe('renderMarkdown — ::: grid container', () => {
	it('wraps contained images in the masonry grid div', async () => {
		const { html } = await renderMarkdown(
			'::: grid\n![a](https://example.com/a.jpg)\n![b](https://example.com/b.jpg)\n:::\n'
		);
		expect(html).toContain('<div class="article-grid columns-2 md:columns-3">');
		expect(html.match(/<img/g)).toHaveLength(2);
	});

	it('leaves unknown directives as plain text', async () => {
		const { html } = await renderMarkdown('::: nonsense\nhello\n:::\n');
		expect(html).not.toContain('article-grid');
		expect(html).toContain('::: nonsense');
	});
});

describe('renderMarkdown — mermaid fences (Route B)', () => {
	it('renders mermaid as a hydrating placeholder, never as Shiki output', async () => {
		const { html } = await renderMarkdown('```mermaid\nflowchart LR\n  A --> B\n```\n');
		expect(html).toContain('<pre class="mermaid-src"');
		expect(html).not.toContain('shiki');
		// Escaped source survives as the honest no-JS/failure fallback.
		expect(html).toContain('A --&gt; B');
	});

	it('placeholder is diagram-type-agnostic — exotic types flow through the same rule', async () => {
		// The fence rule keys on the `mermaid` info string only; mermaid.render()
		// dispatches by the source's first line. Official types need no FE change —
		// the placeholder is plumbing, the parsing is mermaid's.
		for (const src of [
			'mindmap\n  root((blog))\n  drafts\n  published',
			'xychart-beta\n  bar [1, 2, 3]'
		]) {
			const { html } = await renderMarkdown('```mermaid\n' + src + '\n```\n');
			expect(html, src.split('\n')[0]).toContain('<pre class="mermaid-src"');
			expect(html).not.toContain('shiki');
		}
	});
});

// SOURCE-LINE ANCHORS (synced scroll — the mellon parity rule): inert on the
// blog, but the pipelines must stay shape-equivalent; these pin the attribute.
describe('renderMarkdown — source-line anchors', () => {
	it('stamps top-level blocks with data-source-lines (1-based ranges)', async () => {
		const { html } = await renderMarkdown('# Hi\n\npara one\n\n```go\nx()\n```\n');
		expect(html).toMatch(/<h1[^>]*data-source-lines="1-1"/);
		expect(html).toMatch(/<p[^>]*data-source-lines="3-3"/);
		// the fence's range INCLUDES the closing fence line (4 lines total);
		// the Shiki renderer drops token attrs — the anchor is re-injected
		expect(html).toMatch(/<pre[^>]*data-source-lines="5-7"/);
	});
	it('anchors tables through the .table-wrap override + mermaid placeholders', async () => {
		const { html } = await renderMarkdown(
			'| a | b |\n|---|---|\n| 1 | 2 |\n\n```mermaid\nflowchart LR\n  a --> b\n```\n'
		);
		expect(html).toMatch(/<table[^>]*data-source-lines="1-3"/);
		expect(html).toMatch(/<pre class="mermaid-src"[^>]*data-source-lines="5-8"/);
	});
});

// THE EXTENDED DIALECT (the markdownguide basic+extended coverage) — the
// publishing contract: what the editor previews, the blog renders. Each
// component + its source-line anchor.
describe('renderMarkdown — the extended dialect', () => {
	it('task lists render checkboxes (the vendored renderer)', async () => {
		const { html } = await renderMarkdown('- [x] done\n- [ ] todo\n');
		expect(html).toContain('contains-task-list');
		expect(html).toContain('task-list-item');
		expect(html).toMatch(/<input[^>]*checked[^>]*type="checkbox"/);
		expect(html).not.toContain('[x]');
		expect(html).toMatch(/<ul[^>]*data-source-lines="1-2"/);
	});

	it('footnotes render refs + the section', async () => {
		const { html } = await renderMarkdown('ref[^1].\n\n[^1]: the note\n');
		expect(html).toContain('footnote-ref');
		expect(html).toContain('footnotes');
	});

	it('definition lists render dl/dt/dd', async () => {
		const { html } = await renderMarkdown('term\n: the definition\n');
		expect(html).toContain('<dt>term</dt>');
		expect(html).toContain('<dd>the definition</dd>');
		expect(html).toMatch(/<dl[^>]*data-source-lines="/);
	});

	it('==highlight== renders <mark>; sub/sup render their tags; emoji shortcodes resolve', async () => {
		const { html } = await renderMarkdown('==marked== H~2~O X^2^ :tent:\n');
		expect(html).toContain('<mark>marked</mark>');
		expect(html).toContain('<sub>2</sub>');
		expect(html).toContain('<sup>2</sup>');
		expect(html).toContain('⛺');
	});

	it('custom heading ids via {#id} override the slug', async () => {
		const { html } = await renderMarkdown('### My Heading {#custom-id}\n');
		expect(html).toContain('id="custom-id"');
	});
});
