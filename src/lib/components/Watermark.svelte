<script lang="ts">
	interface Props {
		/** Opacity of the ink field; keep whisper-quiet on reading surfaces. */
		opacity?: number;
		/** Placement + size live HERE at the call site — the component is a
		    pure decorative mask field; the parent owns geometry. */
		class?: string;
	}

	let { opacity = 0.06, class: cls = '' }: Props = $props();
</script>

<!-- The brand's ASCII ghost: glyph mask painted with the theme's ink token.
     Decorative by contract — aria-hidden, no pointer events, zero layout pull. -->
<span
	class={cls}
	aria-hidden="true"
	style="opacity: {opacity}; background-color: var(--ascii-ink); -webkit-mask-image: var(--ascii-mask); mask-image: var(--ascii-mask); -webkit-mask-size: cover; mask-size: cover; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;"
></span>
