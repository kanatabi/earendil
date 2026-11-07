<script lang="ts">
	import PostCard from '#lib/components/PostCard.svelte';
	import ProfileVisual from '#lib/components/ProfileVisual.svelte';
	import IdentityCard from '#lib/components/rail/IdentityCard.svelte';
	import RailDrawer from '#lib/components/rail/RailDrawer.svelte';
	import RevealPast from '#lib/components/rail/RevealPast.svelte';
	import SearchPill from '#lib/components/rail/SearchPill.svelte';
	import SectionLabel from '#lib/components/SectionLabel.svelte';
	import Sidebar from '#lib/components/rail/Sidebar.svelte';
	import TopicCloud from '#lib/components/rail/TopicCloud.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>gofar; — essays by Faiz Ainur Rofiq</title>
</svelte:head>

<!-- Hero: display serif headline, "currently" line, ASCII profile portrait -->
<section
	id="hero"
	class="fade-up mx-auto flex w-full max-w-page flex-col gap-6 md:grid md:grid-cols-[minmax(0,1fr)_288px] md:items-start md:gap-x-8 md:gap-y-6 lg:grid-cols-[minmax(0,1fr)_320px]"
>
	<!-- Mobile: micro two-column header (avatar beside the greeting). At md the
	     wrapper dissolves (display: contents) and both children join the main
	     grid — the portrait takes the right column, vertically centered. -->
	<div class="flex items-center gap-4 md:contents">
		<div class="md:col-start-2 md:row-span-4 md:row-start-1 md:self-center">
			<ProfileVisual />
		</div>
		<p class="text-sm font-medium tracking-wide text-primary">Hello, I&rsquo;m Faiz.</p>
	</div>
	<h1 class="font-brand text-5xl leading-[1.05] font-semibold tracking-tight md:text-6xl">
		I write about systems that keep <em class="italic">working</em> under pressure<span
			class="text-brand">;</span
		>
	</h1>
	<p class="max-w-2xl text-lg leading-relaxed text-muted-foreground">
		Backend engineer exploring distributed systems, high-throughput applications, and the quiet
		details behind reliable software.
	</p>
	<!-- Static until the BE grows a status endpoint. -->
	<p class="max-w-2xl text-xs text-muted-foreground">
		currently — building queue-depth metrics<span class="text-brand">;</span> reading The Design of
		Everyday Things<span class="text-brand">;</span> running postgres myself<span class="text-brand"
			>;</span
		>
	</p>
</section>

<!-- Writing: the full list, paginated — /articles and /search reuse these rows -->
<section id="writing" class="fade-up mx-auto flex w-full max-w-page flex-col gap-6">
	<SectionLabel title="Writing" />
	<div class="grid gap-12 lg:grid-cols-[minmax(0,1fr)_272px]">
		<!-- Re-mounts when the page changes so the list fades in on Newer/Older. -->
		{#key data.page}
			<div class="fade-in flex flex-col gap-6">
				<div>
					{#each data.posts as post (post.slug)}
						<PostCard {post} />
					{/each}
				</div>

				{#if data.posts.length === 0}
					<p class="py-6 text-sm text-muted-foreground">Nothing published yet.</p>
				{:else if data.pages > 1}
					<nav
						class="flex items-center justify-between text-sm text-muted-foreground"
						aria-label="Pagination"
					>
						{#if data.page > 1}
							<a
								href="/?page={data.page - 1}"
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
								href="/?page={data.page + 1}"
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

		<Sidebar label="About this site">
			<!-- Search and identity hide while the hero is still on screen; topics persist. -->
			<RevealPast watch="hero">
				<SearchPill />
			</RevealPast>
			<TopicCloud tags={data.tags} />
			<RevealPast watch="hero">
				<IdentityCard />
			</RevealPast>
		</Sidebar>
	</div>
</section>

<!-- Phones/tablets: identity + topics ride the floating bottom-sheet drawer;
     search is the BottomNav FAB's job, so no pill in the sheet. -->
<RailDrawer label="About this site" variant="identity">
	<IdentityCard />
	<TopicCloud tags={data.tags} />
</RailDrawer>
