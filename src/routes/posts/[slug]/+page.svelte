<script lang="ts">
	import {
		codeBlockTools,
		headingAnchors,
		mermaidDiagrams,
		tocSpy,
		zoomableImages
	} from '#lib/actions.ts';
	import ArticleTOC from '#lib/components/ArticleTOC.svelte';
	import ImageLightbox from '#lib/components/ImageLightbox.svelte';
	import type { LightboxImage } from '#lib/components/ImageLightbox.svelte';
	import IdentityCard from '#lib/components/rail/IdentityCard.svelte';
	import Watermark from '#lib/components/Watermark.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let zoomed = $state<LightboxImage | null>(null);

	const dateFormatter = new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: '2-digit',
		year: 'numeric'
	});
	let date = $derived(dateFormatter.format(new Date(data.post.date)));

	// Chip pills are clickable tag filters: soften->deepen fill, foreground text, slight lift.
	// min-w-0/max-w-full/break-words: a long unbroken tag must wrap inside the
	// pill instead of pushing the flex row wider than the column.
	const chip =
		'min-w-0 max-w-full break-words rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-all duration-150 hover:bg-foreground/10 hover:text-foreground hover:-translate-y-0.5';
</script>

<svelte:head>
	<title>{data.post.title} · gofar;</title>
	<meta name="description" content={data.post.preview} />
	<link rel="canonical" href="{data.origin}/posts/{data.post.slug}" />
	{#if data.post.thumbnail}
		<meta property="og:image" content={data.post.thumbnail} />
	{/if}
	<meta property="og:title" content={data.post.title} />
	<meta property="og:type" content="article" />
	<meta property="og:url" content="{data.origin}/posts/{data.post.slug}" />
	<meta property="og:description" content={data.post.preview} />
	<meta property="article:published_time" content={data.post.date} />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- server-built JSON-LD; `<` escaped to \u003c -->
	{@html data.jsonLd}
</svelte:head>

<!-- Twelve columns only exist at lg: a 12-col grid with gap-8 spends 11 gaps
     (352px) — wider than a 360px viewport — and every spanning child clipped. -->
<article class="fade-up relative grid grid-cols-1 gap-8 lg:grid-cols-12">
	<aside class="grid grid-cols-1 gap-6 lg:col-span-9 lg:grid-cols-12 lg:gap-6">
		<div class="hidden pt-2 lg:col-span-2 lg:block">
			<div class="sticky top-6 text-xs text-muted-foreground">
				<p class="mb-6 font-mono text-xs text-muted-foreground">
					{date} · {data.post.readTime} min read<span class="text-brand">;</span>
				</p>
				{#if data.post.tags.length > 0}
					<div class="flex flex-wrap gap-1.5 border-t border-border pt-4">
						{#each data.post.tags as tag (tag)}
							<a href="/search?tag={encodeURIComponent(tag)}" class={chip}>{tag}</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<div class="col-span-12 min-w-0 lg:col-span-10">
			<h1
				class="mb-4 font-brand text-4xl font-semibold tracking-tight break-words text-foreground md:text-5xl"
			>
				{data.post.title}
			</h1>
			<p class="mb-4 max-w-2xl text-xl leading-relaxed break-words text-muted-foreground">
				{data.post.preview}
			</p>
			<nav
				aria-label="Breadcrumb"
				class="mb-4 flex items-center gap-2 text-xs text-muted-foreground"
			>
				<a href="/" class="transition-colors hover:text-foreground">Home</a>
				<span aria-hidden="true">/</span>
				<a href="/#writing" class="transition-colors hover:text-foreground">Writing</a>
				<span aria-hidden="true">/</span>
				<!-- min-w-0: a flex item refuses to shrink below min-content by default —
				     a long unbroken title token would pan the page. -->
				<span class="min-w-0 break-words text-foreground">{data.post.title}</span>
			</nav>
			{#if data.post.thumbnail}
				<img
					src={data.post.thumbnail}
					alt={data.post.title}
					class="mt-2 mb-6 max-h-[60vh] w-full rounded-lg border border-border object-contain"
				/>
			{/if}
			<div
				class="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1.5 font-mono text-xs text-muted-foreground lg:hidden"
			>
				<span>{date}</span>
				<span aria-hidden="true">·</span>
				<span>{data.post.readTime} min read<span class="text-brand">;</span></span>
				{#each data.post.tags as tag (tag)}
					<a href="/search?tag={encodeURIComponent(tag)}" class={chip}>{tag}</a>
				{/each}
			</div>
			{#await data.toc}
				<div class="mb-4 h-24 animate-pulse rounded bg-muted lg:hidden" aria-hidden="true"></div>
			{:then toc}
				{#if toc && toc.length > 0}
					<div class="mb-4 lg:hidden">
						<ArticleTOC {toc} />
					</div>
				{/if}
			{:catch}
				<!-- the TOC is an amenity — the article below never depends on it -->
			{/await}

			{#await data.html}
				<!-- THE ARTICLE SHIMMER (the streamed-load round, 2026-11-22): the
				     shell above (title, breadcrumb, tags, meta) is already painted —
				     the navigation left the homepage instantly. The prose-shaped
				     pulse covers the render's stream: a blink on a cache hit, the
				     render's duration on a cold post — never a stuck navigation. -->
				<div class="prose mt-10 max-w-none text-base leading-relaxed" aria-hidden="true">
					<div class="mb-6 h-8 w-1/3 animate-pulse rounded bg-muted"></div>
					<div class="mb-3 h-3.5 w-full animate-pulse rounded bg-muted"></div>
					<div class="mb-3 h-3.5 w-11/12 animate-pulse rounded bg-muted"></div>
					<div class="mb-3 h-3.5 w-4/5 animate-pulse rounded bg-muted"></div>
					<div class="mb-6 h-24 w-full animate-pulse rounded bg-muted"></div>
					<div class="mb-3 h-3.5 w-full animate-pulse rounded bg-muted"></div>
					<div class="mb-3 h-3.5 w-5/6 animate-pulse rounded bg-muted"></div>
					<div class="h-3.5 w-2/3 animate-pulse rounded bg-muted"></div>
				</div>
			{:then html}
				<!-- Rendered Markdown (DESIGN.md §6.5); enhanced by the actions below. -->
				<div
					class="prose mt-10 max-w-none text-base leading-relaxed"
					use:codeBlockTools
					use:tocSpy
					use:headingAnchors
					use:zoomableImages={(image) => (zoomed = image)}
					use:mermaidDiagrams={(image) => (zoomed = image)}
				>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -- HTML is DOMPurify-sanitized in the server Markdown pipeline -->
					{@html html ?? ''}
				</div>
			{:catch}
				<!-- the render's rejection = the honest quiet failure (the shell stays) -->
				<p class="mt-10 font-mono text-sm text-muted-foreground">
					the article failed to render — try reloading.
				</p>
			{/await}

			<!-- The author card, automatic on every post: mobile/tablet get the
			     end-of-body mount; desktop sees it in the right rail under the TOC. -->
			<div class="mt-12 border-t border-border pt-6 lg:hidden">
				<IdentityCard />
			</div>
		</div>
	</aside>

	<!-- Right rail is unconditional now: with a TOC it reads list → hairline →
	     signature; without one the card simply tops the rail. The TOC box is
	     height-capped so a long list can never push the sticky stack (or the
	     card) off the viewport. -->
	<aside class="fade-up col-span-3 hidden [animation-delay:120ms] lg:block">
		<div class="sticky top-6 flex flex-col gap-6">
			{#await data.toc}
				<div class="h-24 animate-pulse rounded bg-muted" aria-hidden="true"></div>
			{:then toc}
				{#if toc && toc.length > 0}
					<div class="max-h-[50svh] overflow-y-auto overscroll-contain">
						<ArticleTOC {toc} variant="sticky" />
					</div>
					<div class="border-t border-border pt-6">
						<IdentityCard />
					</div>
				{:else}
					<IdentityCard />
				{/if}
			{:catch}
				<IdentityCard />
			{/await}
		</div>
	</aside>

	<!-- End credit: a true watermark — corner ghost in the blank zone under
	     the sticky TOC rail, exactly where About and search park theirs.
	     absolute → zero scroll length added; 4% opacity keeps it a whisper.
	     All widths now — -z-10 puts it behind every glyph, which is the real
	     promise of "never tints prose". -->
	<Watermark
		class="pointer-events-none absolute right-0 bottom-0 -z-10 aspect-square w-[75vw] max-w-[560px] lg:w-[min(45vw,560px)]"
		opacity={0.04}
	/>
</article>

{#if zoomed}
	<ImageLightbox image={zoomed} onclose={() => (zoomed = null)} />
{/if}
