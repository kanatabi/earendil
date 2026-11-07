<script lang="ts">
	// Rail identity card: the hero's ASCII mask at postage size, static.
	// Theme-following via --ascii-ink, like the hero layer.
</script>

<div class="flex items-center gap-4">
	<div class="glyph size-16 shrink-0" role="img" aria-label="ASCII monogram of the author"></div>
	<div class="flex min-w-0 flex-col gap-0.5">
		<p class="truncate text-sm font-medium text-foreground">Faiz Ainur Rofiq</p>
		<p class="text-xs text-muted-foreground">backend engineer · distributed systems</p>
		<p class="mt-1 flex gap-3 text-xs">
			<a href="/about" class="text-primary transition-colors hover:text-foreground"
				>about<span class="text-brand">;</span></a
			>
			<a href="/gallery" class="text-primary transition-colors hover:text-foreground"
				>gallery<span class="text-brand">;</span></a
			>
		</p>
	</div>
</div>

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
