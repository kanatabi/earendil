<script lang="ts">
	import { page } from '$app/state';
	import PillLink from '#lib/components/PillLink.svelte';
	import Watermark from '#lib/components/Watermark.svelte';

	const is404 = $derived(page.status === 404);
</script>

<svelte:head>
	<title>{page.status} · gofar;</title>
</svelte:head>

<!-- Site-wide error surface: the brand's ghost glyph field stands where the
     content would be, copy keeps the house voice. No raw server details —
     the status number is enough for a human and complete for a log. -->
<section class="fade-up relative mx-auto flex w-full max-w-page items-center justify-center py-24">
	<Watermark
		class="pointer-events-none absolute inset-0 m-auto aspect-square w-[min(85vw,480px)]"
		opacity={0.08}
	/>
	<div class="relative flex flex-col items-center gap-4 text-center">
		<p class="font-mono text-xs tracking-widest text-muted-foreground uppercase">{page.status}</p>
		<h1 class="font-brand text-4xl font-semibold tracking-tight md:text-5xl">
			{is404 ? 'This trail goes dead;' : 'Even resilient systems throw up;'}
		</h1>
		<p class="max-w-md text-muted-foreground">
			{is404
				? 'The page you asked for went far — just not this way. Everything that does exist is one tap back.'
				: `The server hit an unexpected state (${page.status}). The essays elsewhere are unaffected — retry, or head back.`}
		</p>
		<div class="mt-2 flex gap-3">
			<PillLink href="/">home;</PillLink>
			<PillLink href="/search">search;</PillLink>
		</div>
	</div>
</section>
