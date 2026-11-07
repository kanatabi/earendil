# Personal Blog FE — Step-by-Step Milestone Plan

Companion to `DESIGN.md` in this directory. Each milestone ends with a verifiable outcome.

**Status (2026-10-17):** M1–M6 shipped and merged (M4 also gained the `::: grid` container directive); M7 (responsive/a11y polish) and M8 (deploy/BE swap) remain. Post-milestone rounds below (3.6/3.7) are delivered as separate merged branches.

---

---

## Milestone 1 — Scaffold + Tailwind + Theme system

**Goal:** running app with design tokens, theme toggle, layout shell.

1. `npx sv create` → SvelteKit, Svelte 5, TypeScript, ESLint + Prettier.
2. Install Tailwind v4: `@tailwindcss/vite` (add plugin to `vite.config.ts`); `src/app.css` = `@import "tailwindcss"`.
3. Install `@tailwindcss/typography`, `prettier-plugin-tailwindcss`, and fonts: `@fontsource-variable/inter` + `@fontsource/jetbrains-mono` (self-hosted, imported in `src/app.css`).
4. Extract exact tokens from Flowstep screens (`get-screen-jsx`): surface/surface-dark, ink/ink-muted, border-subtle, radii → fill `@theme` block (`--container-page: 1120px`, `--font-sans: "Inter Variable", …`, `--font-mono: "JetBrains Mono", …`).
5. Add `@custom-variant dark` (data-theme based).
6. Theme store: cookie-based (`+layout.server.ts` reads `theme` cookie → `data-theme` on `<html>`; `+layout.svelte` handles toggle → optimistic flip + cookie set; default = `prefers-color-scheme`).
7. Build layout shell components (Tailwind utilities only):
   - `Navbar.svelte`: wordmark + nav + `SearchPill` (desktop) / icon button (mobile, same styling per §8 of DESIGN.md) + `ThemeToggle` (sun/moon).
   - `Footer.svelte`: `© 2026 Faiz Ainur Rofiq` + social links (owner-editable) + builder line.
   - Page container: `mx-auto max-w-page px-4 md:px-6`.
8. Placeholder `/` page to verify chrome.

**Verify:** app renders shell; toggle flips light/dark with no FOUC on reload; 1120px container respected; navbar collapses correctly at mobile widths.

---

## Milestone 2 — API client + mock layer

**Goal:** typed data layer, swappable mock↔real.

1. `src/lib/api/types.ts`: `PostSummary`, `PostDetail`, list/suggest response shapes (per DESIGN.md §4).
2. `src/lib/api/client.ts`: interface + `fetch`-based implementation reading `PUBLIC_API_BASE`.
3. `src/lib/api/mock.ts`: fixtures mirroring the screens (Selected writing list; "queue" results with unsplash `d55a2c14`/`d24cecb6`; sample article).
4. Adapter selection: mock used when `PUBLIC_API_BASE` unset.

**Verify:** unit-test the client against mock fixtures; types compile with no `any`.

---

## Milestone 3 — Homepage (SSR)

**Goal:** Screen 1/5 parity.

1. `routes/+page.server.ts`: SSR fetch curated "Selected writing" list from BE — **render payload as-is** (no FE sorting/limiting; curation is BE's job).
2. `PostCard.svelte` / list rows: title, preview, date, read time (+ thumbnail treatment per design).
3. Greeting + headline per mockup.
4. Light/dark + responsive QA (stacked mobile cards).

**Review pass (2026-10-16):** footer sticks to bottom on short pages (flex-grow main); optional post thumbnails in list (null ⇒ title + preview only); hero gains decorative SVG on the right (desktop); new "Photography" section — CSS-columns masonry for mixed aspect ratios (`GET /api/photos`); homepage footer gains a contact form (`POST /api/contact` via SvelteKit form action) — superseded by Milestone 3.5.

**Verify:** view-source shows SSR'd content; matches Screens 1 & 5.

---

## Milestone 3.5 — Home curation + pages

**Goal:** writing-first homepage; nav = Home · Articles · Gallery · About; `/articles`, `/gallery`, `/about` exist; contact form removed. One commit, stacked on `milestone/3-homepage`.

1. **Navbar:** exactly 4 links — Home `/`, Articles `/articles`, Gallery `/gallery`, About `/about`; drop "Now"; active link emphasized via `$app/state` pathname (`font-medium text-foreground` vs `text-muted-foreground`).
2. **Mobile nav = hamburger:** `md:hidden` icon button opens a dropdown panel under the header with stacked links; closes on link click, `Esc`, and outside tap; `aria-expanded`/`aria-controls`; auto-closes on `page.url` change. No drawer/portal.
3. **Home photography → teaser strip:** one row of `h-28 md:h-32` fixed-height `object-cover` crops, `overflow-x-auto` + scroll-snap, fed by `getPhotos({ limit: 6 })`; ends with "Full gallery →" link. The full mixed-aspect masonry moves to `/gallery` — homepage stays calm, writing leads.
4. **Remove the contact form:** delete `ContactForm.svelte`, the `contact` form action, `sendContact()` (client/mock/types), and the `destructive` color token. Footer minimal (© + links) on every page.
5. **`/articles`:** SSR pagination — `?page=N` → `getPosts({ offset: (N-1)*10, limit: 10 })`; reuses `PostCard`; Newer/Older plain links + "Page X of Y" (page size 10).
6. **`/gallery`:** full masonry (`columns-2 md:columns-3`, `break-inside-avoid`), lazy images with reserved dimensions.
7. **`/about`:** static FE page using the existing hero bio copy; trivially movable to BE-driven later.

**Verify:** new unit test — mock `getPhotos` honors `limit`; `svelte-check` 0/0, lint, unit, build green; curl-SSR `/articles` (`?page=2` slicing + pagination links) and `/gallery` (masonry images); hamburger closes on Esc/outside-tap/navigate; nav active-state correct on all 4 routes.

**Contract delta (reflect in DESIGN.md when implementing):** `GET /api/photos?limit=6` (optional `limit`; gallery calls without) — **`POST /api/contact` REMOVED**.

---

## Milestone 3.6 — Listing consolidation (2026-10-17) · `milestone/search-consolidation` ✅

**Goal:** one listing surface instead of two.

1. `/articles` **removed**; home now lists ALL posts, SSR-paginated (`?page=N`, size 10, Newer/Older + "Page X of N"). Out-of-range pages 307-clamp, preserving filters.
2. New `/search` route: query (`?q=`) **or** tag (`?tag=`) results page — ranked via new `GET /api/search?q&offset&limit`, paginated with filter preserved, on-page GET search form, `noindex` on query views, Clear link. Tags everywhere now link here.
3. Palette gains the **see-all hand-off**: trailing `→ See all results for "…"` row in the arrow-key range; Enter with no match routes to `/search?q=`. Launcher stays capped at 8.
4. Nav drops to **3 links** (Home · Gallery · About); breadcrumb middle crumb `Articles` → `Writing` (`/#writing`).
5. `ArticleCard.svelte` **kept** in the codebase per owner's choice (unused); mock corpus grown to 12 posts so pagination is exercisable.
6. `BlogApi.searchPosts` added (interface + fetch + mock ranking: occurrence score over title/subtitle/preview/tags).

**Verify:** home spans 2 pages (`Page 1 of 2`, `?page=99`→307); `/search?tag=postgres` + `?q=queue` SSR correctly; palette keyboard flow; all tests updated (24).

---

## Milestone 3.7 — Brand identity & micro-motion (2026-10-17) · `milestone/home-identity` ✅

1. **Hero:** Fraunces display headline (`md:text-5xl`, wonk-italic accent word, violet `;`), `currently —` micro-line, **featured photograph** right (`getFeaturedPhoto` → `GET /api/photos/featured`; grayscale→color bloom on hover, links to `/gallery`; line-art SVG fallback).
2. **Listings redesign:** dropped the `01;` curation index (read as listicle); row = mono date·read-time masthead **above** a Fraunces serif title with violet underline-grow on hover; section headers became serif `Writing`/`Photography` headings (SectionLabel v2).
3. **Motion:** staggered `fade-up` entrance on all pages; `fade-in` (400ms) + `{#key}` re-mount on pagination/filter swaps; hamburger menu now slides (180ms cubic-out) over a dim+blur scrim; all reduced-motion-guarded.
4. **Brand system:** Fraunces italic woff2 self-hosted; `fzr;` = stylized initials of Faiz Ainur Rofiq; violet `--brand` is the single accent (wordmark, underlines, progress bar).

**Verify:** lint/check/tests green; hero + serif titles + fade wrappers confirmed in SSR & compiled CSS.

---

## Milestone 4 — Markdown engine

**Goal:** `render.ts` pipeline, tested standalone before UI.

1. Install: `markdown-it`, `markdown-it-anchor`, `isomorphic-dompurify`, `shiki`.
2. `src/lib/markdown/render.ts`:
   - markdown-it + anchor (slugify) + tables/strikethrough/task-lists.
   - Shiki fence highlighter, `themes: { light, dark }`, bundle only: `go, rust, clojure, javascript, typescript, python, bash, yaml, json, dockerfile, hcl`.
   - TOC extraction from tokens (h2/h3 + ids) → structured JSON.
   - DOMPurify sanitize of final HTML.
3. Shiki CSS-var mapping block (raw-CSS exception #2).
4. Unit tests on fixtures: headings/anchors, code blocks dual-theme output, TOC shape, sanitization strips `<script>`.

**Verify:** tests green; sample article HTML renders correct with anchors + highlighted code.

---

## Milestone 5 — Article page

**Goal:** Screens 2 & 6 parity.

1. `posts/[slug]/+page.server.ts`: fetch post, run `render.ts` server-side → `{ html, toc, meta }`.
2. Layout: `lg:grid` three zones — left metadata rail / main `.prose` column / right sticky TOC (`sticky top-x`, hidden `<lg`).
3. **Breadcrumb** `Home / Writing / <article title>` rendered below title + description (M3.6 renamed the middle crumb; links `/#writing`) — `text-xs text-muted-foreground`, links `hover:text-foreground`, current crumb not a link (M3.5 review decision).
4. Inline TOC under title (mobile path), body sections, blockquote style, "Further reading" — **no comments section**.
5. Client enhancement action on content container: hover-revealed Wrap | Copy icon toolbar on code blocks, `loading=lazy` images, IntersectionObserver active-TOC highlight.

**Verify:** matches Screens 2/6; mobile collapses correctly; TOC scroll-sync works.

---

## Milestone 6 — Search palette

**Goal:** Screens 1/5 dialog + mobile triggers.

1. `SearchDialog.svelte`: centered rounded dialog (`max-w-2xl`), dim + `backdrop-filter: blur`, symmetric svelte `fade`+`scale` open/close transitions; mobile sheet via padding; input focused at mount (the `autofocus` attribute no-ops on dynamic dialogs).
2. Global `Mod+K`/`Ctrl+K` keybind; pill click; mobile icon-button tap.
3. Debounced (200ms) suggest calls guarded by a monotonic request-sequence counter (no AbortSignal in `suggestPosts`); result rows (optional thumbnail/title/preview/date+readTime); Enter/click → navigate; loading skeletons; empty state; see-all hand-off to `/search` (M3.6).
4. A11y: focus trap, `role="dialog"`, Esc closes, focus restore.

**Verify:** keyboard-only flow works; matches mockup states; abort race test.

---

## Milestone 6.5b — Route B: client-rendered diagrams (2026-10-17) · branch `feature/mermaid-client-render` ✅ (comparison build)

**Goal:** render mermaid in the visitor's browser — deleting the whole BE render pipeline (jobs, S3, visible-gate, id allowlists).

> **Decision (2026-10-18):** adopted after the side-by-side comparison with `feature/a-inline-diagrams`; merged to `master` as the shipped design. The Route A branch stays unmerged for reference.

1. `render.ts`: `mermaid` fences bypass Shiki → `pre.mermaid-src` + escaped source (= SSR content, no-JS state, failure fallback — one thing does all three).
2. `mermaidDiagrams` action: lazy `import('mermaid')` (separate chunk; only diagram pages pay ~1.4MB raw), init `theme: 'base'` + `securityLevel: 'strict'` with `themeVariables` read from `--diagram-*` tokens, render→swap, `animate-pulse` shimmer during the chunk gap, MutationObserver on `data-theme` re-renders live.
3. Queue fixture gained a real ` ```mermaid ` flowchart; +1 pipeline test (25 total); SSR placeholder verified; chunks dir shows lazy split.
4. Deliberately diverges from "FE renders payload as-is": mermaid is treated as a _renderer_ (like Shiki/TOC), not post-processing.

**Compare against** `feature/a-inline-diagrams` (SSR inline, zero JS, needs the BE pipeline) — both share the `--diagram-bg/surface/ink/muted/line` neutral contract (A-inline additionally paints with its own accent token); decision after side-by-side eyeball: TTFB & layout shift (A) vs chunk fetch & post-hydration pop-in (B).

**Refined (2026-10-18):**

1. **Shimmer skeleton (revised)**: the skeleton moved from a hydration-time JS swap to **pure CSS on the SSR placeholder** — `.mermaid-src` itself paints the shimmer (code `visibility: hidden`, sweep via `::after`, reduced-motion safe), so mobile users never see raw source during the multi-second pre-hydration window. The source stays in the DOM: `<noscript>` (app.html) restores it when JS is off, `.mermaid-failed` when a render fails; the action only flags `aria-busy` and swaps the outcome.
2. **Click-to-zoom**: rendered diagrams get `cursor-zoom-in` + a click handler feeding the existing `ImageLightbox` a `data:image/svg+xml` snapshot of the current SVG (works because mermaid bakes hex colors — unlike var()-based A-inline SVGs). Snapshot built on click ⇒ always shows the live theme. Fix post-review: mermaid's `viewBox` + `max-width` sizing is inline-only — as an `<img>` the snapshot had no intrinsic size and rendered tiny; `svgForZoom` bakes px width/height from the viewBox (3 regression tests).
3. **Theming maintenance contract**: neutrals (background, text, lines) + chart-series ramps live ONLY as `--diagram-*` tokens in layout.css; the JS mapping is the `MERMAID_VARS`/`RAMP` table in actions.ts (zero hardcoded colors, no scattered fallbacks; missing token ⇒ dev console warning). `darkMode` derived from `data-theme` (fixes derived-tone direction in dark). **Adopted v12's categorical themes** (`redux-color` / `redux-dark-color`, picked by mode): entities/actors cycle the theme's built-in 12-hue `borderColorArray`/`bkgColorArray` — the per-box variance, deliberately not token-mapped (overriding the primary/secondary/tertiary trio would flatten it; the dark counterpart intentionally ships an empty fill array for contrast, and `updateColors()`'s `x = x || derived` guards let neutrals win without touching the palette). `themeCSSVariables` checked — NOT in the installed 12.2.0 build, so re-render stays the sync mechanism. The earlier `theme: base` + `look: 'classic'` pin (determinism against v12's split-brain per-type defaults) was traded away once the categorical look won the eyeball test — each type family stays internally consistent with its own palette.
4. **Guardrail tests**: `theming.contract.test.ts` couples the two files — every `--diagram-*` value hex-only, light/dark token parity, every mapped token exists in CSS (+1 pipeline test → 28 total).
5. **Test garden**: queue → flowchart (redux-default family), latency → sequenceDiagram (same family), observability → pie (classic-default family) — both v12 default paths exercised with topically honest content. The placeholder rule is diagram-type-agnostic (keys on the `mermaid` info string; mermaid dispatches on the source's first line), proven by a test with mindmap/xychart fences, and the `cScale` categorical family was mapped for quadrantChart/radar/xyChart — all other v12 types inherit the base-palette derivation. (+2 tests → 29 total.)
6. **Lightbox pinch-zoom** (2026-10-18): new `pinchZoom` action on the lightbox `<img>` — two-finger pinch scales around the pinch midpoint (rubber-band below 1×, spring-back on release, hard clamp at 5×), one-finger drag pans while zoomed, double-tap/double-click resets, trackpad ctrl+wheel zooms at the cursor. Safe by construction: the gesture transform lives on the img while the figure's enter/exit transition animates on a separate element, and the backdrop's tap-away reacts only to direct targets — so zooming gestures can never close the dialog. Diagram snapshots zoom vector-sharp; gallery photos get it for free.

---

## Hero identity — ASCII profile reveal (2026-11-07)

1. **The hero image became brand, not content**: the `/gallery`-linked BE-sourced "featured
   photograph" is replaced by a static identity asset — the author portrait shown as ASCII
   art, revealing the original BW photograph on hover/focus/tap. New `ProfileVisual`
   component + `static/profile/` derivatives. Rationale: the profile picture is inseparable
   from the FE's identity (like the `gofar;` wordmark), so it must not 404 with the API, and
   the home load loses a fetch. `BlogApi.getFeaturedPhoto()` **stays** in the contract/mock
   (mirror of `GET /api/photos/featured` for lumen) — no FE consumer for now.
2. **Reveal mechanics**: two stacked `<picture>` layers (AVIF→WebP, 512² square crops of the
   3:4 masters, Lanczos-scaled — point-sampling moiré'd the glyph grid); only `opacity`
   transitions (500ms, composited per the mobile budget), `prefers-reduced-motion` ⇒ instant.
   Hover is CSS-only (`group-hover` — Tailwind v4 gates it to hover-capable devices); the
   block is a `type="button"` — keyboard focus reveals (`group-focus-visible`, the
   `aria-label` carries the single portrait description) and on touch a tap toggles it,
   same `(hover: none)`-gated pattern as the code-tools tap-reveal; the toggle state sticks
   until tapped again (the handler blurs so focus can't pin it open).
   Light/dark: the terminal-green ASCII tile is intentionally theme-agnostic; `border-border`
   frames it on either canvas.
3. **Responsive**: the portrait was desktop-only before — now visible everywhere:
   `w-40` above the greeting on mobile (`order-first`), `md:w-60` in the right grid column
   (`md:order-last`), square with the same `rounded-lg` corner treatment. The SVG fallback
   branch is gone (static asset ⇒ always present).

**Verify:** hover/keyboard/tap reveal in both themes; no `data.featured` references left on
home; gate clean (`lint`/`check`/`test:unit`/`build`).

**Refined (same round) — theme-following blend:** the opaque terminal-green tile was traded
for canvas unity. The ASCII layer is now a **luminance-baked alpha mask**
(`ascii-glyphs-512.webp`, lossless 22KB — 45% black cutoff kills the downscale wash; alpha
carries the glyph density) painted via `background-color: var(--ascii-ink)` — `--foreground`
in light (true monochrome), sampled sage `#d8e0d6` in dark. Chosen over two baked theme-assets
so the color stays a CSS token (the diagram-subsystem rule: art carries no palette) and the
theme flip is pure CSS — correct pre-paint (`data-theme` from the cookie), on toggle, and
with JS off. Consequence accepted: dark-mode glyphs are one hue modulated by opacity
(per-glyph _hue_ variance flattens; density depth survives). The `border-border` frame is
gone — frameless ASCII merges with the hero text; `rounded-lg` remains as the clip for the
opaque photo reveal. **Post-check fix**: the transparent glyphs exposed the one-way fade —
an always-opaque photo under the ASCII double-exposed the resting state (loud in light mode,
invisible in dark). The reveal is now a proper **two-way crossfade** (photo
`opacity-0 → group-hover/tap → 100`, ASCII the inverse, shared `.fade` reduced-motion
selector).

**Re-tuned after visual QA:** the first mask was too timid and the frame too small against
the headline block. Alpha recipe went from `-level 45%` (sparse, washed) to
`-level 15%,80% -gamma 2.4` — note ImageMagick gamma is `1/g`, so gamma>1 LIFTS (an early
`gamma 0.45` darkened the alpha to blank). Coverage ~7x; the figure now reads as a portrait.
Explored hard for a smaller encoding (lossy WebP grew on alpha noise; AVIF q10 = 14KB but
banding plus a no-`<picture>`-fallback story for `mask-image`; posterize/blur all lost) —
shipped the honest **lossless WebP at 640px (~96KB, cached forever)**; 512 would land under
1:1 device pixels at 320 CSS px. Frame: `w-40→w-48` mobile, `md:w-72 lg:w-80` desktop, grid
columns `240→288/320` so the square holds proportion with the Fraunces headline. Headline
and intro type untouched by request.

**Grid alignment follow-up:** growing the image column inside a 768px container had squeezed
the headline to five lines. The home hero, the Writing feed and `/search` now ride the
documented page grid (`max-w-page` 1120, DESIGN §4 — the 3xl blocks were the deviation, the
gallery masonry never had one), so nav = content = footer edges align and the headline
settles back to ~3 lines at a ~736px column. The wide rail keeps an editorial measure:
`PostCard` text caps at `72ch` (thumbnail pinned right with `ml-auto`), hero intro/currently
at `max-w-2xl`. The article body deliberately keeps its 3xl reading measure. Rendering
typography, not data shaping — the no-FE-processing rule stands. Note: the Flowstep screens
(1/5) predate this and now show the old narrow feed; re-cut when the screens get revisited.

**The writing rail:** the wide feed left a dead right margin (most visible in dark mode),
so `#writing` became `lg:grid-cols-[minmax(0,1fr)_272px]` with a sticky `HomeRail` —
identity card (the hero ASCII mask at 64px postage, static), a search pill (dispatches
`gofar:open-search`; the Navbar keeps palette ownership and focus return), and the
`topics;` cloud. The cloud rides a real contract addition, not FE counting:
`BlogApi.listTags()` ↔ `GET /api/tags` returning `Tag[] = { name, posts }`, BE-sorted and
BE-curated (the mock fixture is hand-authored, mirroring the corpus the way the feed order
does); rows link to `/search?tag=…`. Rail hidden below `lg`; the hero's `currently;` line
stays put. Mirror updated in `../lumen/DESIGN.md` as its own commit (+2 tests → 34 total).

**Rail kit, sticky fix, and search facets (2026-11-07):** the first rail never stuck — a
`position: sticky` grid child is stretched to row height by default, so it had no scroll
room; `lg:self-start` is the whole fix. The kit answer to plug-and-play: `rail/Sidebar`
(shell, knows nothing about content) + `IdentityCard` / `SearchPill` / `TopicCloud` /
`TopicFilter` / `DateRange` / `RevealPast` / `FilterPanel` — pages compose cards in one line
each; `HomeRail` retired. `RevealPast` gates identity+search by an IntersectionObserver on
`#hero`: children hide while the hero is in view, reversibly; server-rendered VISIBLE so
JS-off shows everything (accepted: one soft fade-out at hydration on fresh loads). The
search page rides the same grid: facets are repeatable `?tag=` (OR) + inclusive
`from`/`to`, all URL-truth; `FilterPanel` buffers checkbox/date picks locally and commits
with an `apply;` button (page `key`-remounts it on navigation so the buffer always reseeds
from applied truth); applied facets echo as removable chips above the results; mobile gets
the same panel in a native `<details>` disclosure. The date control is fully custom —
mono-chip presets (7/30/90/all) + a popover calendar (Fraunces month header, JetBrains
digits, Monday-first, brand-violet endpoints, in-range tint, Esc/outside-click close with
focus return; non-modal by choice: the feed stays browsable, so no focus trap).
Multi-tag/dates/combined-search is a contract change, done properly: `getPosts`/
`searchPosts` opts gained `tags: string[]` (OR) + `from`/`to` — mock filters via one shared
`matches()` predicate, `+page.server.ts` validates dates by regex and dedupes tags,
kit-v3 `goto` uses `{ replace: true, reset: false }` (noScroll/replaceState are gone),
lumen mirror carries the params (+3 tests → 37; gates green; preview curls proved the OR
union, the date-window slice, chips and the disclosure).

**Rail round 2 — honest collapse, ordering, archive, sort + length facets:**
`RevealPast` stopped reserving space (the hidden cards left a hole above `topics;`): the
wrapper is now a `grid-template-rows: 1fr ↔ 0fr` transition around an `overflow-hidden`
inner — real collapse, still reversible, reduced-motion snaps. Home rail order: search →
topics → identity (the two gated cards now collapse at the rail's top and bottom).
DateRange's trigger went compact-mono (`2026-11-09 → 11-14`, year once; long-form stays in
the popover footer + day labels) because `Nov 14, 2026` truncated at 272px. `/search` with
no params is now **the archive** — the redirect to home is gone (removing the last chip or
reset+apply stays put; title `archive · gofar;`). Sort + reading-time arrived as contract
params: `sort=newest|oldest|quickest|longest|relevance` (absent = curation; relevance is
the implicit q-default — its chip lights without shipping the param) and inclusive
`readMin`/`readMax` minutes; mock grew a shared `sorted()` step (relevance overridden on
demand). New kit cards `SortPicker` (chip rows, `aria-pressed`) and `ReadRange` (dual
handles = two stacked native range inputs over one custom violet track — keyboard and
screen-reader semantics for free, cross-clamped, bounds 0–30 with both ends meaning
"any"); both join the `FilterPanel` buffer under the same `apply;`. Chips row gained
removable `10–12 min` and `newest` entries; pagination links carry the whole `current`
selection. The server validates (`sort` whitelist, ints 1–29 survive, regex dates) and
never bounces (`page>` clamp only). Kit stays plug-and-play: four cards in, one line each.
(+3 tests → 40; preview curls: rail order byte-offsets, 2× collapse wrappers, archive
title/header, `sort=quickest` ascending read-times, read+sort chips, order/length cards in
both rail instances.)

**Rail round 3 — bug fixes + the signature goes everywhere:** (a) the read-time fill never
painted — `width: {pct()}%` double-percented into invalid CSS; one stray `%` removed and the
violet line now spans between the handles. (b) the mobile `filter;` summary had the
semicolon orphaned mid-pill — the bare text and `;` span were two flex items under
`justify-between`; bound into one span, chevron `flex-1`-pushed (the wordmark already taught
this pattern). (c) mobile hero re-composed into a micro two-column: `w-24` portrait beside
the greeting (`md:contents` dissolves the row at `md`, the portrait takes the right column
via explicit `row-span-4 self-center` placement, and the `order-first/last` dance dies with
it). (d) `rail/IdentityCard` auto-mounts on EVERY article from the page template — right
rail under the TOC (`lg+`, hairline divider, TOC capped at `50svh` scroll so the sticky
stack can't overflow the viewport) and end-of-body `lg:hidden` on mobile/tablet; the
markdown pipeline never sees it, so no post can forget it. Same component, dual mount —
the kit proving its plug-and-play claim.

**Round 4 — the phone is the customer:** (a) The 360px article clipping was grid math:
a 12-column grid with `gap-8` spends 352px on gaps _before_ any track — wider than the
viewport itself, so every spanning child ran past the right padding. The 12-column
machinery now exists only at `lg` (`grid-cols-1 lg:grid-cols-12`, same for the article
aside). (b) `Clear` stays in search context → `/search` (the archive), never home.
(c) The hamburger retires for an **icon-only `BottomNav`**: Home · Gallery · ⟨elevated
center Search FAB, phone-only⟩ · About · theme slot — glassy bar (z-20, h-14 +
safe-area), active tab = brand-violet icon + `aria-current`; mobile header is now
wordmark-only; the page container gains `pb-24 lg:pb-12` clearance; the FAB and its center
slot disappear at md where the header pill takes over; `ThemeToggle` dual-mounts
(`hidden lg:flex` header + bar slot). (d) `rail/RailDrawer`: assistant-style floating
trigger (z-20, `bottom-[calc(4.5rem+env(safe-area-inset-bottom))]` clears the bar) opening
a modal bottom sheet (z-25 — grab handle, the established dim+blur scrim, slide-up,
Esc/backdrop/X close with `focusOnMount` + focus return, closes on navigation,
reduced-motion instant). Home mounts identity+search+topics ungated (a sheet has no hero to
gate against); the search page moves its keyed `FilterPanel` into the drawer and the
`<details>` bar retires. Fixed z ladder: bar/FAB 20 → sheet 25 → palette & lightbox 30.
40 tests, gates green; preview curls proved the nav markup, drawer trigger, Clear target,
single-col article grid, generated z-25/size-13/safe-area utilities. Flowstep debt grew —
screens 1/5/2/6 still show hamburger-era chrome.

**Round 5 — bar balance + scroll manners:** the BottomNav leaned off-center because its
five cells had three different sizing rules (tabs `grow`, FAB slot fixed `w-14`, theme
wrapper intrinsic ~36px) — unequal boxes shifted the center cell left of true center and
gave three different icon gaps. All cells are `flex-1` now: exact 10/30/50/70/90 rhythm,
the elevated FAB mathematically centered, `justify-around` deleted (it was doing nothing
once grow ate the free space). Added scroll auto-hide via a singleton rune store
(`#lib/scroll-chrome.svelte.ts`, one passive listener started from the root layout): hide
on deliberate scroll-down (8px hysteresis), instant reveal on scroll-up, 600ms idle
re-reveal when stopping anywhere, always visible near the top, `focusin` forces shown
(no stranded keyboard focus), composited translate+fade 200ms, reduced-motion instant.
Per the owner's call only the bar participates — the floating drawer FAB keeps its post.
Drag-to-dismiss for the sheet followed the same day: pointer events on the grab band
(touch-action:none so page scroll never fights the gesture), the panel follows the finger
1:1 downward with 15% rubber-band upward, and release decides by distance (≥ min(140px,
40% height)) or fling velocity (>0.45 px/ms) — glide off + close on transitionend, else
spring back. The svelte slide outro still runs on a panel already translated out of view,
so the sheet vanishes under the fading scrim with no double motion; reduced-motion closes
instantly. No per-page wiring needed — the behavior lives inside RailDrawer itself.

**FAB/pill consistency:** the mobile search entry point had two personalities — the nav FAB
navigated to `/search`, the home sheet's pill opened the palette. Resolved per the owner's
rule: the FAB is now a context-aware button (no link) — on `/search` it focuses + selects
`#search-input` (and the browser scrolls you back to it), everywhere else it dispatches the
same `gofar:open-search` event the desktop rail pill uses; `aria-haspopup="dialog"` only
when it actually opens a dialog. The sheet's SearchPill retired as redundant (identity +
topics only; the desktop rail keeps its pill since there is no FAB at lg). `/search` stays
reachable/shareable as before — the palette's "see all" is the deep-link path.

**Scroll-top pill (all views):** the chrome store grew a second, position-based signal
(`scrolled: y > 400`) — deliberately independent of the bar's direction/idle choreography.
`ScrollTopButton` mounts once in the layout, so every page gets it automatically. Same
round glassy family as the drawer trigger, z-20 (the sheet still covers it), parked
directly above the drawer-FAB slot on phones (right-edge column; identical spot on
pages without a drawer for muscle memory) and at a plain bottom-right from lg. Hidden
state is `inert` + pointer-events-none, fades/slides 200ms (reduced-motion instant), and
the smooth scroll itself makes it fade away mid-flight — the threshold flips before the
top lands.

**Floating-column rhythm:** the first pill position (9.5rem everywhere) read wrong twice
over — a dead gap above the bar on drawerless pages (article/gallery/about float nothing in
the lower slot) and airy 32px spacing between the two pills on home/search. Now the column
has explicit numbers: 16px bar clearance (trigger at 4.5rem), 12px inter-pill gap (pill at
8.25rem when a drawer trigger exists, else the pill itself takes the 4.5rem slot). The
route list lives in the layout (`stacked` prop) — meaningful consistency ("above whatever
floats below you"), not coordinate consistency.

**About-tab icon — `Feather`, recorded rationale:** `CircleUser` was ambiguous on two
axes — every app trains "person glyph = my account", and the home drawer's ASCII doorknob
(a literal portrait) already owns "the human". The About page now reaches by the pen, not
the face: a feather, which fits the wordmark's pen-name identity and keeps the doorknob
unique. Do not swap it back to a person glyph.

**About page — base structure (2026-11-07):** from a two-paragraph stub to a real identity
page. Content moved to `#lib/content/about.ts` — typed, FE-owned brand copy (like the
hero's `currently` line), with every invented bio/role/link marked `PLACEHOLDER` for the
owner to edit in one file. Composition: header, floating BW cutout portrait (reuses
`photo-640` + the `--photo-glow` dark halo — the hero reveal's end-state as a static
signature) beside the bio, a **scroll-following experience timeline**, and an `elsewhere;`
row. The rail: new `scrollRail` action — one passive rAF-throttled scroll listener maps
"how far the block crossed the 55%-viewport anchor" onto the violet fill's height (two-way:
retreats on scroll-up, per the owner), dots light as the fill passes their center; markup
defaults to the FULLY-DRAWN rail so no-JS and reduced-motion readers see the finished
state and the action only ever retreats it (synchronous measure at mount = no visible
reset). Chose rect-based math over `animation-timeline: scroll()` — Firefox still has no
baseline support. GitHub stats/sparkline block: designed (chips + 12-week commits,
server-side, optional `GITHUB_TOKEN`, graceful null) but HELD per the owner.

**About page — CV content, research, and the gofar line:** `about.ts` rewritten from the
real CV (Gojek/Tokopedia/JalanMimpi entries, 3-paragraph bio with the 2021 Vue/Strapi →
self-hosted SvelteKit lineage line, education with the Catena thesis + UI Robotics Team,
`research` block for the two published blockchain papers — labeled research, not
publications, at the owner's humility call; `stack` as three opinionated anchors (go /
queues / dashboards) + four grouped mono lists; `elsewhere` gained email/RG-profile and the
kanatabi GitHub; phone kept off). The rail became the **gofar line**: dashed `--border`
route ahead, solid violet traveled, and a semicolon marker riding the fill head — the
`scrollRail` action already computed the fraction, so the marker is one more style set.
Markup defaults = the FINISHED journey (fill full, `;` at the end) so no-JS/reduced-motion
readers see a completed route. Motif borrowed in spirit from a friend's journey-path blog
but re-authored in-house: the boat became OUR punctuation; the full wavy SVG voyage
(Tier A) is parked as a candidate round pending how the semicolon glide feels in person.
`venue` strings and the Instagram URL remain marked PLACEHOLDER for the owner; the footer's
Instagram→LinkedIn placeholder is the same known family. (No logic tests; 40 pass.)

**About round 2 — depth:** experience entries grew into rich paragraphs (the CV's bullets
woven to prose — GoMart's polyglot load path, the SSE pipeline "so affiliates watched their
numbers move", the 41/31 internship origin). Education became a **static hairline tree** —
degree as root, thesis + robotics on CSS-elbow branches, the thesis node lit violet (the
traveled branch) linking to `#research`; deliberately un-animated, the journey motion stays
exclusive to the career rail. Research rows gained **abstracts + keywords transcribed from
the local paper PDFs** (`pdftotext`, lightly grammar-normalized, claims untouched) —
abstracts tucked in a native `<details>` (`abstract;` summary, JS-off friendly), keyword
rows rendered mono outside so the scannable surface stays open. The Stack anchors were
**merged into the groups** as annotated first items (`go, the default answer until proven
otherwise · …`) — the orphan three-line philosophy zone confused even its own author;
opinions now ride inside the facts. Mobile portrait centers (`justify-self-center
md:justify-self-start`), text stays left. (40 tests pass; preview curls confirmed both
details blocks, keyword lines, tree markup, merged stack, centering.)

**About round 3 — three visual bugs from the owner's screenshots:** (1) timeline card
hairlines were `li` border-t spanning the full container — straight THROUGH the rail
channel; the separator is now an absolutely-positioned span starting at the text gutter
(`left-10`), so no line ever crosses the journey (rail + `;` marker screenshot). (2) the
education tree looked disconnected: each branch trunk only spanned its own li's box,
leaving the padding gap between branches uncovered, and the root stub was 4px short of
the heading; trunks are now full-height (`bottom: 0`, last stops at its elbow) and the
stub meets both seams — corner-to-corner hairlines. (3) the `abstract;` toggle read as
plain text, not a control — now the house pill affordance (`rounded-full border px-3 py-1`

- ChevronRight rotating via `group-open:`, same grammar as the filter presets and the
  retired mobile disclosure), native `<details>` semantics preserved.

**About round 4 — research block polish:** venue dropped entirely (field gone, not hidden
— meta row is year + keywords); the **paper title became the link** (scholarly convention)
wearing the house underline-grow grammar with an ↗ and sr-only "(opens in a new tab)",
while a matching `pdf ↗` pill stays for explicitness; the `abstract` label and keyword
rows shed their brand semicolons (UI labels, not prose voice); the abstract disclosure
**glides open** via a one-shot `grid-template-rows 0fr→1fr` + opacity keyframe on
`details[open] .abs-body` (RevealPast's collapse grammar) — closing stays instant, the
honest tradeoff of keeping native `<details>` and JS-off readability over a JS-controlled
symmetric disclosure; reduced-motion disables it.

**Chrome startup sync fix:** `startScrollChrome` only ever wrote state from a
scroll _event_ — landing on a restored or deep scroll position fires none after the
layout effect attaches, so the scroll-top pill stayed hidden and the bar's baseline
stale until the first manual scroll (the owner's "no longer visible" report, plus the
bar not hiding). The listener now runs `onScroll()` once at startup; verified compiled
(`n();window.addEventListener(...)`). If symptoms persist on a stale dev server, the
culprit is the runtime, not the code — the bundle was audit-verified single-store,
reactive, and wired end-to-end.

**Chrome follow-up — self-attaching store:** the symptom survived the startup sync on the owner's dev+ngrok runtime, and the dev-served
modules audited clean (runes compiled, effect present, single store instance), so the
remaining suspects were runtime effects that never fire (stale HMR graphs after branch
switches are a classic). Killed the dependency entirely: the scroll listener now attaches
at module-eval time inside scroll-chrome.svelte.ts (typeof-window guarded, runs once per
client graph, before first paint), and the layout effect + startScrollChrome export are
gone. Nothing can forget to start it now.

**About desktop rail + watermark:** the narrative column (72ch) inside the 1120 grid left a
dead right margin at lg; the kit answered it. Section is now
`lg:grid-cols-[minmax(0,1fr)_272px]` with a sticky `Sidebar` rail: the promoted portrait
(272px) wrapped in `RevealPast watch="identity-photo"` — the rail face appears exactly when
the inline twin scrolls away (owner's twist on the home gating, component reused verbatim),
then the new `rail/FactCard` for `facts;` and `colophon;` (source → earendil ↗), and
`elsewhere;` into the rail with a `lg:hidden` body-end twin (the accepted dual-mount). A
6%-opacity ASCII-glyph watermark (same mask asset, `--ascii-ink`, theme-aware, static,
bottom-right) fills the corner the rail leaves empty. No new scroll machinery anywhere: one
reused component, one presentational card, one static mask.

**Social links, canonized + iconographic:** one true list now lives in
`content/social.ts` (kanatabi GitHub, in/faizainur LinkedIn, ResearchGate profile, mailto,
and the real instagram.com/faizarq — which also cured the footer's Instagram→LinkedIn
copy-paste placeholder); `about.ts` re-exports it and zero live PLACEHOLDER marks remain.
The footer trades words for inline brand marks: paths vendored from Simple Icons (CC0;
LinkedIn pinned from the pre-removal v11.3.0 tag) via `lib/brand-icons.ts`, rendered with
currentColor — theme-aware, no third-party requests — on size-9 targets with aria-label,
external links `_blank rel=noopener`; the Mail glyph (lucide) and ResearchGate ride the
shared list automatically.

**About round 5 — full-figure portrait + hosting-honest copy:** the About mounts traded the
square `photo-640` for a freshly matted UNCROPPED portrait (rembg isnet, cached model;
trim to content bbox + 2% margin keeps the crossed arms, the photo's own bottom cut is
inherent to the master; 600x790 AVIF/WebP, 19/51KB). Inline beside the bio is width-sized
(`w-40 md:w-48`, h-auto, native ratio for CLS); the rail figure caps at 300px
(`max-h-[300px] object-contain`) so facts/colophon/elsewhere stay high in the sticky column.
The hero keeps the square cutout — it is registered against the ASCII composition; two
derivatives, two jobs. Second half: public copy no longer claims a hosting choice
(homelab-vs-VPS genuinely undecided): footer reads `Built with SvelteKit · no trackers;`,
the colophon's `hosts — self-managed k3s` row is deleted, the bio's lineage line became
"wherever its server ends up living, I will be the one running it" (promises WHO, not
WHERE), and the hero's `currently` line says `running postgres myself;`. Internal docs keep
their K3s engineering records — those speak to the builder, not visitors. DESIGN's footer
copy spec synced.

**Tree/rail dialect unification (zoomed QA):** the Education tree read jaggy and foreign —
1px strokes whose 0.5px-centered junctions (elbows at `top:50%` unshifted vs dots with
translateY) smeared at zoom, beside a rail speaking 2px/8px. One vocabulary now: 2px strokes,
a single `--stem-x: 9px` centerline all stems/elbows/nodes derive from (integer boundaries;
coincidentally the rail's own stem+dots center on 9 — one axis system for both structures),
transform-centering on every junction, and the rail's COLOR grammar: violet = traveled — root
stub and the Catena branch render `--brand` (trunk via two-stop gradient: violet above the
elbow, grey continuing to Robotics), the thesis dot lit like a rail waypoint. Follow-up zoom:
the elbow landed flush on the text edge (28px padding) — shortened to 1rem (ends 24px) with
the indent at 2rem, leaving a deliberate 8px gap; connector meets copy, never touches it.

**Watermark round + kit consolidation (reuse review):** asked "where else does the ghost
fit?", the answer was everywhere it makes emptiness mean something — and building it
exposed that ten rounds had quietly re-printed the same code: the mask URL in 4 components,
the card kicker in 6, the pill grammar in ~8 places, the search event string in 3. Two
commits: (1) PURE REFACTOR — `--ascii-mask` token (URL now exists once in CSS),
`Watermark.svelte` (decorative ghost; caller owns geometry), `CardTitle`, `Pill`
(aria-pressed toggle chip) + `PillLink` (owns the external-link pattern: ↗, target/rel,
sr-only), `OPEN_SEARCH_EVENT` constant; all existing consumers swapped with zero visual
delta (deliberate exceptions kept custom: the calendar trigger dialog affordance, the
SearchPill fake-input, the primary-action apply button, and the native `<summary>`).
(2) PLACEMENTS — `/search` gains the corner ghost (About-sibling anatomy) and the bare
"No posts matched" line became a ghost-field empty state with a `clear filters;` (or
`back home;`) pill; a REAL root `+error.svelte` finally replaces SvelteKit's bare 500/400
page (status-aware house voice, ghost field, pills, no raw server details), and the posts
error variant joins the pattern; articles end with a 4%-opacity ghost after Further
reading (lg-only, never under prose — documented rule); About grew the last missing mobile
parity piece, a `RailDrawer` carrying facts+colophon. Audit verdict elsewhere: scroll-chrome,
Sidebar/RevealPast/FactCard seams, social module — already shaped right. 47 tests; preview
proved 404 copy, both error variants, empty state, corner ghost, article whisper, about
drawer, and exactly ONE occurrence of the asset URL in compiled CSS. Follow-up taste fix: the article end-credit was sized smaller (28vw) than the corner ghosts — conflating size with loudness; all watermarks now share the family geometry (45vw cap 560px) and ONLY opacity varies per placement (4% under prose, 6-8% on sparse pages).

Correction the owner caught by looking: the article ghost was mounted IN-FLOW
(`mx-auto aspect-square`), so it reserved a 560px square of page height — a banner
wearing a watermark's costume, and the "empty space" at every article's end. It is now
the same corner treatment as the family: `absolute bottom-0 right-0` inside the
relative article (the blank zone under the sticky TOC rail), `-z-10` so it sits behind
ALL content, zero scroll length added. The reuse lesson, written down: Watermark's
"caller owns geometry" seam means callers must keep it OUT of flow — the component
cannot enforce it; the pattern must.

**Watermarks go universal (owner call: all pages, mobile included):** dropped every
`hidden lg:block` gate, added `-z-10` to the about/search ghosts — exposing a latent flaw
they had always carried: as bare absolute siblings they painted ABOVE non-positioned text
(desktop hid it by placing them over empty corners; phones would not). The "never tints
prose" promise is now structural — z-order, not breakpoint. New mounts complete the set:
home writing (5%, quietest — hover bands + long copy), gallery (4% behind the masonry
tail). Opacity per surface is now the only per-placement variable: 4% article/gallery,
5% home, 6% about/search corners, 7–8% error/empty bands.

**Polish round + lumen reconciliation (main merged as PR #2):** (a) the `all` date chip
double-highlighted beside presets — its active condition inherited a double negation
("active unless in a custom range" → preset selections aren't custom → two chips lit);
now `active={!from && !to}`: exactly one chip lights, custom ranges light none (the
trigger pill owns that state). (b) the wordmark `;` pattern applied where it was missed:
Pill children are flex `gap-2`, so bare `label` + `;`-span drifted apart — date and sort
chips wrap their label+`;` in one span (75d; / all; / relevance;). (c) the About headline
was still stub-era sans at 4xl/5xl while home's hero is Fraunces 5xl/6xl — About now
takes the exact home-hero type chain; article titles stay deliberately smaller _serif_.
(d) full contract audit earendil↔lumen: params/tags/Tag/sort/read semantics confirmed in
sync; the real drift was lumen §3 still prescribing publish-time SVG rendering (Route A,
rejected!) with a `content_rendered` column — its own stale-flag, now RESOLVED by the
owner: §3 rewritten to Route B (raw fences are the contract; the backend carries them
untouched; one payload serves both themes), intro/§2/PostDetail/§6 corrected, featured +
feed.xml comments aligned to FE reality. Lesson recorded: a mirror flag marked "stale"
is a promise to reconcile, not a substitute for it.

Sizing follow-up (owner: "the watermark is very small?"): right — `min(45vw,560px)`
self-adapts _downward_ on phones (176px at 390) and the corner stamp read accidental.
Geometry rule now: corners `w-[75vw] max-w-[560px] lg:w-[min(45vw,560px)]` — mobile gets a
deliberate majority of the width (≈293px, an atmosphere) while desktop is untouched;
centered bands go `min(85vw,…)`, empty-state `min(80vw,360px)`. Opacity policy unchanged.

**Float — cutout reveal (same round):** the photo layer lost its rectangle. ImageMagick
border-flood was tried first and rejected by QA: at fuzz 18 the wall-shadow gaps survived
disconnected AND the bright face got eaten through a temple/hair-highlight bridge to the
wall. Escalated to `rembg` (isnet-general-use) in a throwaway `/tmp` venv — system python
untouched, model cached at `~/.rembg`. Full-res matte, then the SAME `+0+300` north square
crop as before; edge QA clean (hair wisps kept, no halo, the white Triple-F logo survives
because flood/AI both see it enclosed by the black tee). New `photo-640.{avif,webp}` =
12/26KB (smaller than the opaque 512s — flat transparent corners compress to nothing). The
subject now floats on the page canvas, so dark mode needed help: `--photo-glow` — `none`
light, `drop-shadow(0 0 18px color-mix(in oklab, var(--brand) 45%, transparent))` dark,
applied as a static `filter` (only opacity still animates). Bonus discovery from the mid-
crossfade render: the ASCII figure registers with the photo after all (the earlier
"head-left" mismatch was a montage-scaling illusion) — the fade reads as a dissolve of one
person, not two.

---

## Milestone 7 — Responsive + a11y polish

1. Screenshot-diff QA against **all 8 Flowstep screens** (theme × viewport).
2. Touch targets ≥44px; contrast pass; semantic landmarks; `prefers-reduced-motion` on dialog/pill-zoom transitions.
3. Lighthouse pass (SEO, a11y, performance) on home + article.

**Verify:** zero known visual deviations from the 8 screens; Lighthouse ≥95 a11y/SEO.

---

## Milestone 8 — Deploy + BE swap

1. `adapter-node` build → Dockerfile (multi-stage, non-root).
2. K3s manifest sized to reserved budget (256Mi req / 512Mi limit); env: `PUBLIC_API_BASE` (in-cluster CMS service URL) + `PUBLIC_SITE_URL` (`https://blog.ainurrofiq.com`).
3. DNS + ingress for `blog.ainurrofiq.com` (root domain → redirect/landing); wildcard cert `*.ainurrofiq.com` via cert-manager DNS-01. **`cms.` never publicly exposed** (see DESIGN §9).
4. When real BE is live: point `PUBLIC_API_BASE` at the service, remove mock. **Any other change ⇒ contract drift — fix the API, not the FE.**
5. RSS link → BE `/feed.xml` (absolute URLs from `PUBLIC_SITE_URL`); add canonical/OG tags at the same time.
6. Optional: `faizrofiq.com` (available 2026-10-17) as owner/email insurance domain → 301 to the blog.

**Verify:** container runs on cluster; real articles flow end-to-end with no FE code change.

---

## Open decisions — RESOLVED

- **Shiki language set**: `go, rust, clojure, javascript, typescript, python, bash, yaml, json, dockerfile, hcl` (Terraform). K8s via `yaml`.
- **Fonts**: Inter (self-hosted variable) + JetBrains Mono for code. Alts if desired: Geist Sans, Atkinson Hyperlegible.
- **"Selected writing"**: BE-curated; FE renders payload as-is. **General rule: no FE post-processing of any BE data** (articles, list, search, suggestions). TOC extraction remains a rendering step, not data processing.
  _(Evolved in M3.6: the home "Selected writing" list became the full paginated feed — the no-post-processing rule and BE-curation principle are unchanged: feed order, featured hero photo, and tag sets remain BE decisions.)_
- **M3.5 round**: 4-link nav (Home/Articles/Gallery/About) + mobile hamburger; contact form removed (spam surface + footer weight); homepage photography demoted to a fixed-height teaser strip (masonry lives on `/gallery`); About is static FE; pagination is Newer/Older, page size 10; article breadcrumb below title/description in M5.
