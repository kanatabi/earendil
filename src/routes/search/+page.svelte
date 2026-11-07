<script lang="ts">
	import { goto } from '$app/navigation';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { ChevronRight, Search } from 'lucide-svelte';
	import PostCard from '#lib/components/PostCard.svelte';
	import FilterPanel from '#lib/components/rail/FilterPanel.svelte';
	import Sidebar from '#lib/components/rail/Sidebar.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// One rendered line: a multi-line <title> template leaks its indentation
	// into the SSR HTML (ugly for crawlers and tab strips alike).
	let pageTitle = $derived(
		data.q
			? `search: ${data.q}`
			: data.tags.length
				? `posts tagged ${data.tags.join(' + ')}`
				: 'search'
	);

	// The URL is the single source of truth for applied filters; the rail's
	// buffer only reaches it through apply() (or a chip's ×, which is a link).
	function buildQs(sel: { tags: string[]; from?: string; to?: string }, page = 1): string {
		const params = new SvelteURLSearchParams();
		if (data.q) params.set('q', data.q);
		for (const t of sel.tags) params.append('tag', t);
		if (sel.from) params.set('from', sel.from);
		if (sel.to) params.set('to', sel.to);
		if (page > 1) params.set('page', String(page));
		return params.toString();
	}

	function apply(sel: { tags: string[]; from?: string; to?: string }) {
		const qs = buildQs(sel);
		goto(`/search${qs ? `?${qs}` : ''}`, { replace: true, reset: false });
	}

	const applied = $derived(`${data.tags.join(',')}|${data.from ?? ''}|${data.to ?? ''}`);
	const hasFilters = $derived(applied !== '||');

	const dateLabel = $derived([data.from ?? '…', data.to ?? '…'].join(' → '));
</script>

<svelte:head>
	<title>{pageTitle} · gofar;</title>
	{#if data.q}
		<!-- Query pages are transient views over the corpus; tag pages may be indexed. -->
		<meta name="robots" content="noindex" />
	{/if}
</svelte:head>

<section class="fade-up mx-auto grid w-full max-w-page gap-8 lg:grid-cols-[minmax(0,1fr)_272px]">
	<div class="flex min-w-0 flex-col gap-6">
		<div class="flex items-center justify-between gap-4 border-t border-border pt-4">
			<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">
				{#if data.q}
					Results for &ldquo;{data.q}&rdquo;
				{:else if data.tags.length}
					Tagged {data.tags.map((t) => `“${t}”`).join(' + ')}
				{:else}
					All matching posts
				{/if}
				· {data.total}
				{data.total === 1 ? 'post' : 'posts'}
			</p>
			<a
				href="/"
				class="shrink-0 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				Clear
			</a>
		</div>

		<form method="GET" action="/search" class="flex items-center gap-3">
			<label
				class="flex min-w-0 grow items-center gap-3 rounded-full border border-border px-4 py-2"
			>
				<Search class="size-4 shrink-0 text-muted-foreground" />
				<!-- The tag filter is dropped on a new query — search is the intent switch. -->
				<input
					type="search"
					name="q"
					value={data.q ?? ''}
					placeholder="Search posts…"
					aria-label="Search posts"
					class="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
				/>
			</label>
			<button
				type="submit"
				class="shrink-0 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
			>
				Search
			</button>
		</form>

		<!-- Mobile facets live in a native disclosure: works JS-off, keyboard free. -->
		<details class="group/mfilters lg:hidden">
			<summary
				class="flex cursor-pointer list-none items-center justify-between gap-3 rounded-full border border-border px-4 py-2 font-mono text-sm text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden"
			>
				filter<span class="text-brand">;</span>
				<ChevronRight
					class="size-3.5 transition-transform duration-200 group-open/mfilters:rotate-90"
				/>
			</summary>
			<div class="mt-4 rounded-xl border border-border p-4">
				{#key applied}
					<FilterPanel
						tags={data.tagCloud}
						selected={data.tags}
						from={data.from}
						to={data.to}
						onApply={apply}
					/>
				{/key}
			</div>
		</details>

		<!-- Applied filters echo above the results, each removable in one click. -->
		{#if hasFilters}
			<div class="flex flex-wrap items-center gap-2">
				{#each data.tags as t (t)}
					<a
						href="/search?{buildQs({
							tags: data.tags.filter((x) => x !== t),
							from: data.from,
							to: data.to
						})}"
						class="flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand/10 px-3 py-1 font-mono text-xs text-foreground transition-colors hover:border-brand"
					>
						{t}
						<span aria-hidden="true" class="text-muted-foreground">×</span>
						<span class="sr-only">remove filter {t}</span>
					</a>
				{/each}
				{#if data.from || data.to}
					<a
						href="/search?{buildQs({ tags: data.tags })}"
						class="flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand/10 px-3 py-1 font-mono text-xs text-foreground transition-colors hover:border-brand"
					>
						{dateLabel}
						<span aria-hidden="true" class="text-muted-foreground">×</span>
						<span class="sr-only">remove date filter</span>
					</a>
				{/if}
			</div>
		{/if}

		{#key `${data.page}:${applied}:${data.q ?? ''}`}
			<div class="fade-in flex flex-col gap-6">
				<div>
					{#each data.posts as post (post.slug)}
						<PostCard {post} />
					{/each}
					{#if data.posts.length === 0}
						<p class="border-t border-border py-6 text-sm text-muted-foreground">
							No posts matched{#if data.q}
								&ldquo;{data.q}&rdquo;{/if}.
						</p>
					{/if}
				</div>

				{#if data.posts.length > 0 && data.pages > 1}
					<nav
						class="flex items-center justify-between text-sm text-muted-foreground"
						aria-label="Pagination"
					>
						{#if data.page > 1}
							<a
								href="/search?{buildQs(
									{ tags: data.tags, from: data.from, to: data.to },
									data.page - 1
								)}"
								rel="prev"
								class="font-medium text-primary transition-colors hover:text-foreground"
							>
								← Newer
							</a>
						{:else}
							<span aria-hidden="true" class="opacity-40">← Newer</span>
						{/if}

						<p>Page {data.page} of {data.pages}</p>

						{#if data.page < data.pages}
							<a
								href="/search?{buildQs(
									{ tags: data.tags, from: data.from, to: data.to },
									data.page + 1
								)}"
								rel="next"
								class="font-medium text-primary transition-colors hover:text-foreground"
							>
								Older →
							</a>
						{:else}
							<span aria-hidden="true" class="opacity-40">Older →</span>
						{/if}
					</nav>
				{/if}
			</div>
		{/key}
	</div>

	<Sidebar label="Search filters">
		{#key applied}
			<FilterPanel
				tags={data.tagCloud}
				selected={data.tags}
				from={data.from}
				to={data.to}
				onApply={apply}
			/>
		{/key}
	</Sidebar>
</section>
