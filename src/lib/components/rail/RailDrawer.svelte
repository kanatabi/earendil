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
	let panel = $state<HTMLElement | undefined>();

	// Guarded: $derived evaluates during SSR too, where window is absent.
	const reduced = $derived(
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
	const slideOpts = $derived({ axis: 'y' as const, duration: reduced ? 0 : 240, easing: cubicOut });
	const fadeOpts = $derived({ duration: reduced ? 0 : 150 });

	// Drag-to-dismiss: pointer events ride the grab zone (handle + its padding
	// band, touch-action: none so page scroll doesn't fight the gesture). The
	// panel follows the finger downward; on release it either springs back or
	// glides off-screen and closes — decided by distance or flick velocity.
	let dragging = false;
	let startY = 0;
	let lastY = 0;
	let lastT = 0;
	let velocity = 0;

	function onDragStart(e: PointerEvent) {
		if (!panel) return;
		dragging = true;
		startY = lastY = e.clientY;
		lastT = e.timeStamp;
		velocity = 0;
		panel.style.transition = 'none';
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function onDragMove(e: PointerEvent) {
		if (!dragging || !panel) return;
		const dt = e.timeStamp - lastT;
		if (dt > 0) velocity = (e.clientY - lastY) / dt;
		lastY = e.clientY;
		lastT = e.timeStamp;
		// Downward follows 1:1; an upward pull rubber-bands at 15%.
		const dy = e.clientY - startY;
		panel.style.transform = `translateY(${dy >= 0 ? dy : dy * 0.15}px)`;
	}

	function onDragEnd(e: PointerEvent) {
		if (!dragging || !panel) return;
		dragging = false;
		(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
		const dy = Math.max(0, e.clientY - startY);
		const threshold = Math.min(140, panel.offsetHeight * 0.4);
		const fling = velocity > 0.45 && dy > 24;
		if (dy > threshold || fling) {
			if (reduced) {
				close();
				return;
			}
			panel.style.transition = 'transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)';
			panel.style.transform = 'translateY(100%)';
			const done = (ev: TransitionEvent) => {
				if (ev.propertyName !== 'transform') return;
				panel?.removeEventListener('transitionend', done);
				close();
			};
			panel.addEventListener('transitionend', done);
		} else {
			panel.style.transition = reduced ? 'none' : 'transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)';
			panel.style.transform = 'translateY(0px)';
		}
	}

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
		bind:this={panel}
		use:focusOnMount
		class="fixed inset-x-0 bottom-0 z-25 max-h-[80svh] overflow-y-auto overscroll-contain rounded-t-2xl border-t border-border bg-card p-5 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl outline-none"
		transition:slide|local={slideOpts}
	>
		<!-- Grab band: the handle plus a generous hit area, pointer-owned.
		     aria-hidden like the dialog backdrops — it is a gesture surface, not
		     a control; dismissal already has X/Esc and keyboard paths. -->
		<div
			class="-mx-5 -mt-3 mb-3 cursor-grab touch-none px-5 pt-3 pb-3 active:cursor-grabbing"
			aria-hidden="true"
			onpointerdown={onDragStart}
			onpointermove={onDragMove}
			onpointerup={onDragEnd}
			onpointercancel={onDragEnd}
		>
			<div class="mx-auto h-1 w-10 rounded-full bg-border" aria-hidden="true"></div>
		</div>
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
		-webkit-mask-image: var(--ascii-mask);
		mask-image: var(--ascii-mask);
		-webkit-mask-size: cover;
		mask-size: cover;
		-webkit-mask-repeat: no-repeat;
		mask-repeat: no-repeat;
		background-color: var(--ascii-ink);
	}
</style>
