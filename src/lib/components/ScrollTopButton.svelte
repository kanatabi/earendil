<script lang="ts">
	import { ArrowUp } from 'lucide-svelte';
	import { chrome } from '#lib/scroll-chrome.svelte.ts';

	interface Props {
		/** True on pages that float a drawer trigger in the lower slot — the
		    pill parks 12px above it; elsewhere it takes the slot itself. */
		stacked?: boolean;
	}

	let { stacked = false }: Props = $props();

	// Guarded: $derived evaluates during SSR, where window is absent.
	const reduced =
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	function toTop() {
		window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
	}
</script>

<!-- Position-gated scroll-top pill (chrome.scrolled: >400px deep). Same round
     family as the drawer trigger; the floating column keeps a deliberate
     rhythm below lg — bar top → 16px → trigger (4.5rem) → 12px → this pill
     (8.25rem) — and the pill takes the trigger's slot (4.5rem) on pages with
     no drawer. Plain bottom-right at lg. z-20 keeps it under the sheet
     (z-25) like the drawer trigger itself. -->
<button
	type="button"
	onclick={toTop}
	aria-label="Scroll to top"
	inert={!chrome.scrolled}
	class="fixed right-4 z-20 flex size-12 items-center justify-center rounded-full border border-border bg-card/90 shadow-lg backdrop-blur transition duration-200 ease-out hover:bg-card motion-reduce:transition-none {stacked
		? 'bottom-[calc(8.25rem+env(safe-area-inset-bottom))]'
		: 'bottom-[calc(4.5rem+env(safe-area-inset-bottom))]'} lg:right-8 lg:bottom-8 {chrome.scrolled
		? 'translate-y-0 opacity-100'
		: 'pointer-events-none translate-y-2 opacity-0'}"
>
	<ArrowUp class="size-5 text-muted-foreground" />
</button>
