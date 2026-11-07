<script lang="ts">
	import { Search } from 'lucide-svelte';
	import type { Tag } from '#lib/api/index.ts';

	interface Props {
		tags: Tag[];
	}

	let { tags }: Props = $props();

	// The palette lives in the Navbar (it owns the ⌘K binding and focus return);
	// the rail asks for it through a window event rather than lifted state.
	function openSearch() {
		window.dispatchEvent(new Event('gofar:open-search'));
	}
</script>

<aside class="hidden lg:sticky lg:top-6 lg:flex lg:flex-col lg:gap-8" aria-label="About this site">
	<!-- Identity: the same ASCII mask at postage size — a signature, not a photo. -->
	<div class="flex items-center gap-4">
		<div
			class="glyph size-16 shrink-0 rounded-lg"
			role="img"
			aria-label="ASCII monogram of the author"
		></div>
		<div class="flex min-w-0 flex-col gap-0.5">
			<p class="truncate text-sm font-medium text-foreground">Faiz Ainur Rofiq</p>
			<p class="text-xs text-muted-foreground">backend engineer · distributed systems</p>
			<p class="mt-1 flex gap-3 text-xs">
				<a href="/about" class="text-primary transition-colors hover:text-foreground"
					>about<span class="text-brand">;</span></a
				>
				<a href="/gallery" class="text-primary transition-colors hover:text-foreground"
					>gallery<span class="text-brand">;</span></a
				>
			</p>
		</div>
	</div>

	<!-- Search: the palette's doorbell for people who never touch ⌘K. -->
	<button
		type="button"
		onclick={openSearch}
		class="flex w-full items-center gap-3 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
	>
		<Search class="size-4 shrink-0" />
		<span class="min-w-0 grow text-left">search the archive…</span>
		<kbd
			class="shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
			>⌘K</kbd
		>
	</button>

	<!-- Topics: the BE ships the cloud curated; this renders it, that is all. -->
	<div class="flex flex-col gap-3">
		<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">topics</p>
		<ul class="flex flex-col divide-y divide-border">
			{#each tags as tag (tag.name)}
				<li>
					<a
						href="/search?tag={tag.name}"
						class="flex items-baseline justify-between gap-3 py-2 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
					>
						<span class="min-w-0 truncate">{tag.name}<span class="text-brand">;</span></span>
						<span class="shrink-0 tabular-nums opacity-60">{tag.posts}</span>
					</a>
				</li>
			{/each}
		</ul>
	</div>
</aside>

<style>
	/* Same luminance mask as the hero portrait, postage-stamped and static. */
	.glyph {
		-webkit-mask-image: url('/profile/ascii-glyphs-640.webp');
		mask-image: url('/profile/ascii-glyphs-640.webp');
		-webkit-mask-size: cover;
		mask-size: cover;
		-webkit-mask-repeat: no-repeat;
		mask-repeat: no-repeat;
		background-color: var(--ascii-ink);
	}
</style>
