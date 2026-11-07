<script lang="ts">
	// Hero profile identity block: the ASCII rendering greets the visitor; the
	// original BW photo reveals on hover (hover-capable pointers, via the CSS-only
	// group-hover variant), on keyboard focus, or on tap — touch has no hover, so
	// there a tap toggles the reveal and the state STICKS until tapped again.
	// Only opacity animates: composited, safe on the mobile perf budget (AGENTS §6).
	let revealed = $state(false);

	function tap(e: MouseEvent) {
		// Same gate as the code-tools tap-reveal in actions.ts. On hover-capable
		// pointers the CSS does everything; the toggle is touch-only.
		if (!window.matchMedia?.('(hover: none)').matches) return;
		revealed = !revealed;
		// Blur so a tap's focus can't pin the reveal beside the toggle state.
		(e.currentTarget as HTMLElement).blur();
	}
</script>

<button
	type="button"
	class="group relative block aspect-square w-40 overflow-hidden rounded-lg border border-border text-left md:w-60"
	aria-label="Portrait of Faiz Ainur Rofiq rendered in ASCII characters. Activate to reveal the photograph."
	onclick={tap}
>
	<picture>
		<source type="image/avif" srcset="/profile/photo-512.avif" />
		<img
			class="absolute inset-0 h-full w-full object-cover"
			src="/profile/photo-512.webp"
			alt=""
			width="512"
			height="512"
			fetchpriority="high"
		/>
	</picture>
	<picture>
		<source type="image/avif" srcset="/profile/ascii-512.avif" />
		<img
			class="ascii absolute inset-0 h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-0 group-focus-visible:opacity-0 {revealed
				? 'opacity-0'
				: 'opacity-100'}"
			src="/profile/ascii-512.webp"
			alt=""
			width="512"
			height="512"
			fetchpriority="high"
		/>
	</picture>
</button>

<style>
	@media (prefers-reduced-motion: reduce) {
		.ascii {
			transition-duration: 0ms;
		}
	}
</style>
