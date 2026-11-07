<script lang="ts">
	// Hero profile identity block: the ASCII rendering greets the visitor; the
	// original BW photo reveals on hover (hover-capable pointers, via the CSS-only
	// group-hover variant), on keyboard focus, or on tap — touch has no hover, so
	// there a tap toggles the reveal and the state STICKS until tapped again.
	// A two-way crossfade: the photo fades IN while the ASCII fades OUT — the
	// ASCII is transparent glyphs (no opaque tile), so an always-on photo under it
	// would double-expose the resting state, loudly in light mode.
	// Only opacity animates: composited, safe on the mobile perf budget (AGENTS §6).
	// The ASCII is a luminance-baked alpha mask painted with --ascii-ink, so it
	// follows the theme (monochrome ink / terminal sage) and blends into the canvas.
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
	class="group relative block aspect-square w-48 overflow-hidden rounded-lg text-left md:w-72 lg:w-80"
	aria-label="Portrait of Faiz Ainur Rofiq rendered in ASCII characters. Activate to reveal the photograph."
	onclick={tap}
>
	<picture>
		<source type="image/avif" srcset="/profile/photo-512.avif" />
		<img
			class="fade absolute inset-0 h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100 {revealed
				? 'opacity-100'
				: 'opacity-0'}"
			src="/profile/photo-512.webp"
			alt=""
			width="512"
			height="512"
			fetchpriority="high"
		/>
	</picture>
	<div
		class="ascii fade absolute inset-0 transition-opacity duration-500 group-hover:opacity-0 group-focus-visible:opacity-0 {revealed
			? 'opacity-0'
			: 'opacity-100'}"
		aria-hidden="true"
	></div>
</button>

<style>
	.ascii {
		-webkit-mask-image: url('/profile/ascii-glyphs-640.webp');
		mask-image: url('/profile/ascii-glyphs-640.webp');
		-webkit-mask-size: 100% 100%;
		mask-size: 100% 100%;
		-webkit-mask-repeat: no-repeat;
		mask-repeat: no-repeat;
		background-color: var(--ascii-ink);
	}

	@media (prefers-reduced-motion: reduce) {
		.fade {
			transition-duration: 0ms;
		}
	}
</style>
