<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** id of the watched element; children hide while it intersects. */
		watch: string;
		children: Snippet;
	}

	let { watch, children }: Props = $props();

	// Server-rendered visible — that is also the no-JS fallback (cards show).
	// The observer then reversibly hides the slot while the watched region is
	// in view; on a fresh JS load this lands as one soft fade-out at hydration.
	let shown = $state(true);

	$effect(() => {
		const target = document.getElementById(watch);
		if (!target || !('IntersectionObserver' in window)) return;
		const io = new IntersectionObserver(([entry]) => (shown = !entry.isIntersecting), {
			threshold: 0
		});
		io.observe(target);
		return () => io.disconnect();
	});
</script>

<!-- Collapses for real (1fr ↔ 0fr): a reserved-space fade left a hole in the
     rail while the cards were invisible. -->
<div
	class="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
	style="grid-template-rows: {shown ? '1fr' : '0fr'}"
	aria-hidden={!shown}
	inert={!shown}
>
	<div class="min-h-0 overflow-hidden">
		<div
			class="flex flex-col gap-8 transition-opacity duration-300 ease-out motion-reduce:transition-none {shown
				? 'opacity-100'
				: 'opacity-0'}"
		>
			{@render children()}
		</div>
	</div>
</div>
