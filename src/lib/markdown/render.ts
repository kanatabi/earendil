/**
 * Server-side Markdown pipeline (DESIGN.md §6): markdown-it + anchors + task
 * lists → Shiki dual-theme highlighting → TOC extraction → DOMPurify sanitize.
 * Imported only from `+page.server.ts` code — never bundle this on the client.
 */
import MarkdownIt, { type MarkdownIt as MarkdownItInstance, type Token } from 'markdown-it';
import anchor from 'markdown-it-anchor';
import container from 'markdown-it-container';
import taskLists from 'markdown-it-task-lists';
import markdownItShiki from '@shikijs/markdown-it';
import type { BuiltinLanguage } from 'shiki';
import DOMPurify from 'isomorphic-dompurify';

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
md.use(taskLists);
/**
 * Authoring directive `::: grid ... :::` — a masonry image grid inside articles,
 * styled to match /gallery. Unknown `:::name` blocks are left to render as plain
 * text, so old content degrades gracefully.
 */
md.use(container, 'grid', {
	render: (tokens, idx) =>
		tokens[idx].nesting === 1 ? '<div class="article-grid columns-2 md:columns-3">\n' : '</div>\n'
});

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
					const attrs = (token.attrs ?? []).map(([k, v]) => ` ${k}="${v}"`).join('');
					return `<pre class="mermaid-src"${attrs}><code>${escapeHtml(token.content)}</code></pre>\n`;
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

export async function renderMarkdown(markdown: string): Promise<{ html: string; toc: TocEntry[] }> {
	const instance = await markdownEngine();
	const env = {};
	const tokens = instance.parse(markdown, env);
	const toc = extractToc(tokens);
	const html = instance.renderer.render(tokens, instance.options, env);
	return { html: DOMPurify.sanitize(html), toc };
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
