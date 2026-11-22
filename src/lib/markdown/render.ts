/**
 * Server-side Markdown pipeline (DESIGN.md §6): markdown-it + anchors + task
 * lists → Shiki dual-theme highlighting → TOC extraction → DOMPurify sanitize.
 * Imported only from `+page.server.ts` code — never bundle this on the client.
 */
import MarkdownIt, { type MarkdownIt as MarkdownItInstance, type Token } from 'markdown-it';
import anchor from 'markdown-it-anchor';
import container from 'markdown-it-container';
import { taskListsPlugin } from './task-lists.ts';
// THE EXTENDED DIALECT (owner round 2026-11-21 — the markdownguide
// basic+extended coverage): footnotes, custom heading ids, definition
// lists, ==highlight==, sub/sup, emoji shortcodes — the mellon parity
// (the editor previews it; the blog publishes it).
import footnote from 'markdown-it-footnote';
import attrs from 'markdown-it-attrs';
import deflist from 'markdown-it-deflist';
import mark from 'markdown-it-mark';
import sub from 'markdown-it-sub';
import sup from 'markdown-it-sup';
import { full as emoji } from 'markdown-it-emoji';
import markdownItShiki from '@shikijs/markdown-it';
import type { BuiltinLanguage } from 'shiki';
import DOMPurify from 'isomorphic-dompurify';
import { createHash } from 'node:crypto';

export interface TocEntry {
	id: string;
	text: string;
	depth: 2 | 3;
}

/** Confirmed language set — DESIGN.md §6. K8s manifests use `yaml`, Terraform `hcl`. */
const SHIKI_LANGS: BuiltinLanguage[] = [
	'go',
	'rust',
	'clojure',
	'javascript',
	'typescript',
	'python',
	'bash',
	'yaml',
	'json',
	'dockerfile',
	'hcl'
];

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

const escapeHtml = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// `permalink` defaults to false in markdown-it-anchor v10 — heading ids only, no anchor icons.
md.use(anchor, { level: [2, 3] });
md.use(taskListsPlugin);
/**
 * Authoring directive `::: grid ... :::` — a masonry image grid inside articles,
 * styled to match /gallery. Unknown `:::name` blocks are left to render as plain
 * text, so old content degrades gracefully.
 */
md.use(container, 'grid', {
	render: (tokens, idx) =>
		tokens[idx].nesting === 1 ? '<div class="article-grid columns-2 md:columns-3">\n' : '</div>\n'
});
// THE EXTENDED DIALECT: attrs LAST among the id-touching plugins (anchor
// slugs first; {#custom-id} overrides) — the rest are order-insensitive.
md.use(footnote);
md.use(deflist);
md.use(mark);
md.use(sub);
md.use(sup);
md.use(emoji);
md.use(attrs);

// Tables ride a horizontal-scroll wrapper (`.prose .table-wrap` in layout.css):
// a wide table's min-content beats the article column and no wrap rule can
// shrink a table's intrinsic sizing — the scroll box is the only containment.
// DOMPurify keeps the div+class (the grid container above proves it).
// The attrs render through (the source-line anchor below lands on <table>).
md.renderer.rules.table_open = (tokens, idx) => {
	const token = tokens[idx];
	const attrs = (token.attrs ?? []).map(([k, v]) => ` ${k}="${v}"`).join('');
	return `<div class="table-wrap">\n<table${attrs}>\n`;
};
md.renderer.rules.table_close = () => '</table>\n</div>\n';

// SOURCE-LINE ANCHORS (synced scroll, 2026-11-21 — the mellon parity rule):
// block tokens carry token.map = the [startLine, endLine] they came from.
// INERT on the blog (nothing reads the attribute — mellon's editor maps its
// scroll through it); it rides here so the two pipelines stay byte-equivalent
// in shape (the preview's fidelity is a contract).
md.core.ruler.push('source_line_anchors', (state) => {
	for (const token of state.tokens) {
		// nesting -1 = the closing tag (covered by its opener); 0 = singletons
		// (fence, hr, code_block) — they anchor themselves
		if (token.map && token.level === 0 && token.nesting >= 0) {
			token.attrSet('data-source-lines', `${token.map[0] + 1}-${token.map[1]}`);
		}
	}
	return true;
});

/** Lazily build the Shiki-ready engine once per process (grammar loading is the slow part). */
let engine: Promise<MarkdownItInstance> | null = null;
function markdownEngine(): Promise<MarkdownItInstance> {
	if (!engine) {
		engine = markdownItShiki({
			themes: { light: 'github-light', dark: 'github-dark' },
			defaultColor: false, // emit --shiki-light/--shiki-dark CSS vars (mapped in layout.css)
			langs: SHIKI_LANGS,
			// `text` is Shiki's special plain-text language; option types lag behind the runtime.
			fallbackLanguage: 'text' as BuiltinLanguage
		}).then((shiki) => {
			md.use(shiki);
			// `mermaid` fences skip Shiki entirely: emit a placeholder the client
			// action hydrates. The escaped source doubles as the no-JS fallback.
			// Attrs render through (the source-line anchor — inert here, the
			// mellon parity rule).
			const shikiFence = md.renderer.rules.fence!;
			md.renderer.rules.fence = (tokens, idx, opts, env, self) => {
				if (tokens[idx].info.trim().split(/\s+/)[0] === 'mermaid') {
					const token = tokens[idx];
					const attrStr = (token.attrs ?? []).map(([k, v]) => ` ${k}="${v}"`).join('');
					return `<pre class="mermaid-src"${attrStr}><code>${escapeHtml(token.content)}</code></pre>\n`;
				}
				// the Shiki renderer builds its own <pre> and DROPS token attrs —
				// re-inject the source-line anchor
				const out = shikiFence(tokens, idx, opts, env, self);
				const token = tokens[idx];
				if (token.map && token.level === 0) {
					return out.replace(
						'<pre',
						`<pre data-source-lines="${token.map[0] + 1}-${token.map[1]}"`
					);
				}
				return out;
			};
			return md;
		});
	}
	return engine;
}

/** The boot warm-up: the Shiki grammar build = the seconds of SYNCHRONOUS,
 * event-loop-freezing CPU — paid at the pod's STARTUP (where the k8s
 * lifecycle expects it: the old pod serves, the readiness probe retries),
 * never on the first reader's click (the cold-engine walk, 2026-11-22:
 * the first post view after a deploy stalled the navigation while the
 * event loop built grammars). Fire-and-forget from hooks.server.ts. */
export function warmup(): Promise<MarkdownItInstance> {
	return markdownEngine();
}

export async function renderMarkdown(markdown: string): Promise<{ html: string; toc: TocEntry[] }> {
	const instance = await markdownEngine();
	const env = {};
	const tokens = instance.parse(markdown, env);
	const toc = extractToc(tokens);
	const html = instance.renderer.render(tokens, instance.options, env);
	return { html: DOMPurify.sanitize(html), toc };
}

// THE WHOLE-POST CACHE (the reader-side perf round, 2026-11-22): a published
// post's markdown is IMMUTABLE between edits — the same bytes always produce
// the same render — yet the SSR re-rendered the identical post per visitor
// request (the Shiki over every fence, for every reader). The key = the
// CONTENT HASH: the key IS the invalidation (an edit = new bytes = a new
// entry) — zero staleness possible, zero invalidation logic, zero
// cross-replica consistency concerns (each pod computes the same answer).
// Bounded LRU: 100 posts × ~100-300KB ≈ 10-30MB worst case.
const renderCache = new Map<string, { html: string; toc: TocEntry[] }>();
const RENDER_CACHE_CAP = 100;

export async function renderMarkdownCached(
	markdown: string
): Promise<{ html: string; toc: TocEntry[] }> {
	const key = createHash('sha256').update(markdown).digest('hex');
	const hit = renderCache.get(key);
	if (hit) return hit; // the same object instance — the callers read, never mutate
	const rendered = await renderMarkdown(markdown);
	if (renderCache.size >= RENDER_CACHE_CAP) {
		// FIFO trim over the insertion-ordered Map (a long-lived process
		// rotates many posts; the working set of any real blog never churns)
		const oldest = renderCache.keys().next();
		if (oldest.done !== true) renderCache.delete(oldest.value);
	}
	renderCache.set(key, rendered);
	return rendered;
}

/**
 * Anchor slugs are set by a markdown-it-anchor core rule, so heading_open
 * tokens already carry their `id` right after `parse()`.
 */
function extractToc(tokens: Token[]): TocEntry[] {
	const toc: TocEntry[] = [];
	for (const [index, token] of tokens.entries()) {
		if (token.type !== 'heading_open') continue;
		const depth = token.tag === 'h2' ? 2 : token.tag === 'h3' ? 3 : null;
		const id = token.attrGet('id');
		if (!depth || typeof id !== 'string' || id === '') continue;
		const inline = tokens[index + 1];
		const text =
			inline?.type === 'inline'
				? (inline.children ?? [])
						.filter((child) => child.type === 'text' || child.type === 'code_inline')
						.map((child) => child.content)
						.join('')
				: '';
		toc.push({ id, text, depth });
	}
	return toc;
}
