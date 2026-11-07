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
	const chip =
		'rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-all duration-150 hover:bg-foreground/10 hover:text-foreground hover:-translate-y-0.5';
</script>

<svelte:head>
	<title>{data.post.title} · gofar;</title>
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
			<h1 class="mb-4 font-brand text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
				{data.post.title}
			</h1>
			<p class="mb-4 max-w-2xl text-xl leading-relaxed text-muted-foreground">
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
				<span class="text-foreground">{data.post.title}</span>
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
			{#if data.toc.length > 0}
				<div class="mb-4 lg:hidden">
					<ArticleTOC toc={data.toc} />
				</div>
			{/if}

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
				{@html data.html}
			</div>

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
			{#if data.toc.length > 0}
				<div class="max-h-[50svh] overflow-y-auto overscroll-contain">
					<ArticleTOC toc={data.toc} variant="sticky" />
				</div>
				<div class="border-t border-border pt-6">
					<IdentityCard />
				</div>
			{:else}
				<IdentityCard />
			{/if}
		</div>
	</aside>

	<!-- End credit: a true watermark — corner ghost in the blank zone under
	     the sticky TOC rail, exactly where About and search park theirs.
	     absolute → zero scroll length added; 4% opacity keeps it a whisper.
	     All widths now — -z-10 puts it behind every glyph, which is the real
	     promise of "never tints prose". -->
	<Watermark
		class="pointer-events-none absolute right-0 bottom-0 -z-10 aspect-square w-[min(45vw,560px)]"
		opacity={0.04}
	/>
</article>

{#if zoomed}
	<ImageLightbox image={zoomed} onclose={() => (zoomed = null)} />
{/if}
