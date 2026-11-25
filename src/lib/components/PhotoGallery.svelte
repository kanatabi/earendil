<script lang="ts">
	import ImageLightbox from './ImageLightbox.svelte';
	import type { LightboxImage } from './ImageLightbox.svelte';
	import SectionLabel from './SectionLabel.svelte';
	import Watermark from './Watermark.svelte';
	import type { Photo } from '#lib/api/index.ts';

	interface Props {
		photos: Photo[];
	}

	let { photos }: Props = $props();

	let selected = $state<LightboxImage | null>(null);
</script>

<section class="fade-up relative flex flex-col gap-6">
	<!-- 4% corner ghost, behind the masonry's tail at every width — photos own
	     the page; the brand just lives in the margin. -->
	<Watermark
		class="pointer-events-none absolute right-0 bottom-0 -z-10 aspect-square w-[75vw] max-w-[560px] lg:w-[min(45vw,560px)]"
		opacity={0.04}
	/>
	<SectionLabel title="Photography" />
	<!-- CSS-columns masonry: mixed aspect ratios never force rows to align (Pinterest-style).
	     KEY = the list index: lumen's storage lets multiple media rows share one object
	     (identical bytes -> identical hash path), so duplicate src is LEGAL payload - a
	     src-keyed each crashes with each_key_duplicate (hit with two same-file uploads
	     carrying different alt text). The grid is static (no client reordering), so the
	     index is the honest identity here. -->
	<div class="columns-2 gap-4 md:columns-3">
		{#each photos as photo, i (i)}
			<button
				type="button"
				class="mb-4 block w-full cursor-zoom-in break-inside-avoid"
				onclick={() => (selected = { src: photo.src, alt: photo.alt })}
			>
				<img
					src={photo.src}
					alt={photo.alt}
					width={photo.width}
					height={photo.height}
					loading="lazy"
					class="w-full rounded-lg border border-border transition-opacity hover:opacity-90"
				/>
			</button>
		{/each}
	</div>
</section>

{#if selected}
	<ImageLightbox image={selected} onclose={() => (selected = null)} />
{/if}
