<script lang="ts">
	import { ArrowUp } from 'lucide-svelte';
	import { chrome } from '#lib/scroll-chrome.svelte.ts';

	// Guarded: $derived evaluates during SSR, where window is absent.
	const reduced =
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	function toTop() {
		window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
	}
</script>

<!-- Position-gated scroll-top pill (chrome.scrolled: >400px deep). Same round
     family as the drawer trigger; sits directly above its slot on phones —
     a tidy right-edge FAB column — and at a plain bottom-right corner on lg,
     where there is neither bar nor drawer trigger. z-20 keeps it under the
     sheet (z-25) like the drawer trigger itself. -->
<button
	type="button"
	onclick={toTop}
	aria-label="Scroll to top"
	inert={!chrome.scrolled}
	class="fixed right-4 bottom-[calc(9.5rem+env(safe-area-inset-bottom))] z-20 flex size-12 items-center justify-center rounded-full border border-border bg-card/90 shadow-lg backdrop-blur transition duration-200 ease-out hover:bg-card motion-reduce:transition-none lg:right-8 lg:bottom-8 {chrome.scrolled
		? 'translate-y-0 opacity-100'
		: 'pointer-events-none translate-y-2 opacity-0'}"
>
	<ArrowUp class="size-5 text-muted-foreground" />
</button>
