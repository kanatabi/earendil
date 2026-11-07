<script lang="ts">
	import SectionLabel from '#lib/components/SectionLabel.svelte';
	import { experience, elsewhere, profile } from '#lib/content/about.ts';
	import { scrollRail } from '#lib/actions.ts';
</script>

<svelte:head>
	<title>about · gofar;</title>
</svelte:head>

<section class="fade-up mx-auto flex w-full max-w-page flex-col gap-12">
	<div class="flex flex-col gap-6">
		<p class="text-sm font-medium tracking-wide text-primary">About</p>
		<h1 class="max-w-3xl text-4xl leading-tight font-semibold tracking-tight md:text-5xl">
			{profile.tagline}
		</h1>
		<!-- Identity block: the same floating cutout that ends the hero reveal. -->
		<div class="grid items-start gap-8 md:grid-cols-[192px_minmax(0,1fr)] md:gap-10">
			<picture>
				<source type="image/avif" srcset="/profile/photo-640.avif" />
				<img
					class="photo size-40 self-start rounded-lg object-cover md:size-48"
					src="/profile/photo-640.webp"
					alt="Black-and-white portrait of {profile.name}"
					width="640"
					height="640"
				/>
			</picture>
			<div class="flex max-w-2xl flex-col gap-4">
				{#each profile.bio as para (para)}
					<p class="text-lg leading-relaxed text-muted-foreground">{para}</p>
				{/each}
				<p class="font-mono text-xs text-muted-foreground">
					see also —
					<a href="/gallery" class="text-primary transition-colors hover:text-foreground"
						>the gallery<span class="text-brand">;</span></a
					>
				</p>
			</div>
		</div>
	</div>

	<!-- Experience: a timeline rail that follows the scroll (grows down,
	     retreats back up); dots light as the violet fill passes them.
	     Markup default = fully drawn — no-JS and reduced-motion readers see
	     the finished rail; scrollRail only ever retreats it to reality. -->
	<div class="flex flex-col gap-6">
		<SectionLabel title="Experience" />
		<div class="relative" use:scrollRail>
			<span class="rail" aria-hidden="true"><span class="rail-fill"></span></span>
			<ol class="flex flex-col">
				{#each experience as job (job.period + job.company)}
					<li class="relative border-t border-border py-5 pl-10 first:border-t-0">
						<span
							class="rail-dot absolute top-[26px] left-[6px]"
							data-rail-off={undefined}
							aria-hidden="true"
						></span>
						<p class="font-mono text-xs text-muted-foreground">{job.period}</p>
						<h3
							class="mt-1 max-w-[72ch] font-brand text-lg font-semibold tracking-tight text-foreground"
						>
							{job.role}<span class="font-normal text-muted-foreground"> · {job.company}</span>
						</h3>
						<p class="mt-1 max-w-[72ch] text-sm leading-relaxed text-muted-foreground">
							{job.blurb}
						</p>
					</li>
				{/each}
			</ol>
		</div>
	</div>

	<div class="flex flex-col gap-4">
		<SectionLabel title="Elsewhere" />
		<p class="flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs text-muted-foreground">
			{#each elsewhere as link (link.label)}
				<a href={link.href} class="transition-colors hover:text-foreground"
					>{link.label.toLowerCase()}<span class="text-brand">;</span></a
				>
			{/each}
		</p>
	</div>
</section>

<style>
	.photo {
		/* Dark mode: same brand-violet halo that keeps the hero cutout readable. */
		filter: var(--photo-glow);
	}

	.rail {
		position: absolute;
		top: 1.25rem;
		bottom: 1.75rem;
		left: 9.5px;
		width: 1px;
		background: var(--border);
	}
	.rail-fill {
		position: absolute;
		inset: 0 0 auto 0;
		width: 100%;
		height: 100%; /* markup default = drawn; the action tracks scroll */
		background: var(--brand);
		transition: height 120ms linear;
	}
	.rail-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 9999px;
		background: var(--brand);
		transition:
			transform 150ms ease,
			background-color 150ms ease;
	}
	/* Unlit until the fill reaches the dot (the scrollRail action toggles the
	   attribute at runtime; the markup carries it as `undefined` so it renders
	   nothing but stays known to static analysis). */
	.rail-dot[data-rail-off] {
		background: var(--background);
		outline: 1.5px solid var(--border);
		outline-offset: -1px;
		transform: scale(0.85);
	}

	@media (prefers-reduced-motion: reduce) {
		.rail-fill,
		.rail-dot {
			transition: none;
		}
	}
</style>
