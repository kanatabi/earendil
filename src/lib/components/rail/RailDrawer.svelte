<script lang="ts">
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { fade, slide } from 'svelte/transition';
	import { SlidersHorizontal, X } from 'lucide-svelte';
	import { focusOnMount } from '#lib/actions.ts';

	interface Props {
		/** Accessible name for the button, sheet and close control. */
		label: string;
		/** 'identity' shows the ASCII doorknob, 'filters' the sliders icon. */
		variant?: 'identity' | 'filters';
		children: Snippet;
	}

	let { label, variant = 'filters', children }: Props = $props();

	let open = $state(false);
	let trigger = $state<HTMLButtonElement | undefined>();

	// Guarded: $derived evaluates during SSR too, where window is absent.
	const reduced = $derived(
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
	const slideOpts = $derived({ axis: 'y' as const, duration: reduced ? 0 : 240, easing: cubicOut });
	const fadeOpts = $derived({ duration: reduced ? 0 : 150 });

	function close() {
		open = false;
		trigger?.focus(); // same return contract as the palette
	}

	// Navigation closes the sheet; Esc closes it while open.
	$effect(() => {
		void page.url.pathname;
		open = false;
	});
	$effect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') close();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

<!-- Assistant-style floating trigger above the BottomNav bar (z-20), opening a
     modal sheet (z-25) that stays under the palette/lightbox (z-30). Phones
     only — at lg the real rail takes over. -->
<button
	type="button"
	bind:this={trigger}
	class="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 flex size-12 items-center justify-center rounded-full border border-border bg-card/90 shadow-lg backdrop-blur transition-colors hover:bg-card lg:hidden"
	aria-label={label}
	aria-haspopup="dialog"
	aria-expanded={open}
	onclick={() => (open = !open)}
>
	{#if variant === 'identity'}
		<span class="glyph size-7" aria-hidden="true"></span>
	{:else}
		<SlidersHorizontal class="size-5 text-muted-foreground" />
	{/if}
</button>

{#if open}
	<div
		class="fixed inset-0 z-25 bg-background/60 backdrop-blur-[2px]"
		aria-hidden="true"
		transition:fade={fadeOpts}
		onclick={() => (open = false)}
	></div>
	<div
		role="dialog"
		aria-modal="true"
		aria-label={label}
		tabindex="-1"
		use:focusOnMount
		class="fixed inset-x-0 bottom-0 z-25 max-h-[80svh] overflow-y-auto overscroll-contain rounded-t-2xl border-t border-border bg-card p-5 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl outline-none"
		transition:slide|local={slideOpts}
	>
		<div class="mx-auto mb-3 h-1 w-10 rounded-full bg-border" aria-hidden="true"></div>
		<button
			type="button"
			onclick={close}
			aria-label="Close {label.toLowerCase()}"
			class="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
		>
			<X class="size-4" />
		</button>
		<div class="flex flex-col gap-8 pr-2">
			{@render children()}
		</div>
	</div>
{/if}

<style>
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
