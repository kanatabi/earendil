<script lang="ts">
	import { page } from '$app/state';
	import PillLink from '#lib/components/PillLink.svelte';
	import Watermark from '#lib/components/Watermark.svelte';
</script>

<section class="fade-up relative flex min-h-48 items-center justify-center py-16">
	<Watermark
		class="pointer-events-none absolute inset-0 m-auto aspect-square w-[min(70vw,420px)]"
		opacity={0.07}
	/>
	<div class="relative flex flex-col items-center gap-4 text-center">
		<h1 class="font-brand text-3xl font-semibold tracking-tight text-foreground">
			{page.status === 404 ? 'No post at this address;' : 'Something went wrong;'}
		</h1>
		<p class="max-w-md text-muted-foreground">
			{page.status === 404
				? "We couldn't find that article. It may have moved, or never existed — the feed knows where everything lives."
				: 'This one hit an unexpected state. The rest of the library is unaffected.'}
		</p>
		<PillLink href="/">back to the writing;</PillLink>
	</div>
</section>
