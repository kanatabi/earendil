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

<div
	class="flex flex-col gap-8 transition duration-300 ease-out motion-reduce:transition-none {!shown &&
		'pointer-events-none -translate-y-2 opacity-0'}"
	aria-hidden={!shown}
	inert={!shown}
>
	{@render children()}
</div>
