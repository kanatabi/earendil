<script lang="ts">
	import { ChevronRight } from 'lucide-svelte';
	import SectionLabel from '#lib/components/SectionLabel.svelte';
	import {
		education,
		elsewhere,
		experience,
		profile,
		research,
		stack
	} from '#lib/content/about.ts';
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
			<picture class="justify-self-center md:justify-self-start">
				<source type="image/avif" srcset="/profile/photo-640.avif" />
				<img
					class="photo size-40 rounded-lg object-cover md:size-48"
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

	<!-- Experience: the gofar line. The route ahead is dashed; the traveled
	     part is solid violet, and a semicolon rides the fill head as you scroll
	     (it grows down, retreats back up). Markup defaults to the FINISHED
	     journey — no-JS and reduced-motion readers see the full line with the
	     marker at the end; scrollRail only ever retreats it to reality. -->
	<div class="flex flex-col gap-6">
		<SectionLabel title="Experience" />
		<div class="relative" use:scrollRail>
			<span class="rail" aria-hidden="true">
				<span class="rail-fill"></span>
				<span class="rail-mark">;</span>
			</span>
			<ol class="flex flex-col">
				{#each experience as job, i (job.period + job.company)}
					<li class="relative py-5 pl-10">
						<!-- Card hairline starts at the text gutter (left-10): it must
						     never cross the rail channel, unlike the old li border-t. -->
						{#if i > 0}
							<span class="absolute top-0 right-0 left-10 h-px bg-border" aria-hidden="true"></span>
						{/if}
						<span
							class="rail-dot absolute top-[26px] left-[5px]"
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

	<!-- Education: a static tree — the degree is the root, the thesis and
	     robotics hang beneath it on hairline elbows. The thesis node is lit
	     violet: the traveled branch, linking down to the research block. -->
	<div class="flex flex-col gap-6">
		<SectionLabel title="Education" />
		<div class="max-w-[72ch]">
			<h3 class="font-brand text-lg font-semibold tracking-tight text-foreground">
				{education.degree}<span class="font-normal text-muted-foreground">
					· {education.school}</span
				>
			</h3>
			<p class="mt-1 font-mono text-xs text-muted-foreground">{education.period}</p>
			<ul class="tree">
				{#each education.highlights as item (item.body)}
					<li>
						<span class="node {item.active ? 'node-lit' : ''}" aria-hidden="true"
						></span>{item.body}{#if item.link}
							(<a href={item.link.href} class="text-primary transition-colors hover:text-foreground"
								>{item.link.label}</a
							>){/if}
					</li>
				{/each}
			</ul>
		</div>
	</div>

	<div class="flex flex-col gap-6" id="research">
		<SectionLabel title="Research" />
		<div class="flex flex-col">
			{#each research as paper (paper.title)}
				<article class="border-t border-border py-5 first:border-t-0 first:pt-0">
					<!-- The title IS the link (scholarly convention), wearing the house
					     underline-grow grammar of the article rows; the ↗ says "leaves". -->
					<h3
						class="group max-w-[72ch] font-brand text-base leading-snug font-semibold tracking-tight text-foreground"
					>
						<a
							href={paper.href}
							target="_blank"
							rel="noopener noreferrer"
							class="relative inline after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-brand after:transition-[width] after:duration-200 hover:after:w-full"
						>
							{paper.title}
							<span aria-hidden="true" class="align-top text-xs text-muted-foreground">↗</span>
							<span class="sr-only">(opens in a new tab)</span>
						</a>
					</h3>
					<p class="mt-1.5 font-mono text-xs text-muted-foreground">{paper.year}</p>
					<p class="mt-1 max-w-[72ch] font-mono text-xs text-muted-foreground">
						{paper.keywords.join(' · ')}
					</p>
					<p class="mt-2 max-w-[72ch] text-sm leading-relaxed text-muted-foreground">
						{paper.note}
					</p>
					<!-- Native <details> (JS-off keeps the content readable); the body
					     glides open via a grid-rows keyframe — closing stays instant:
					     the honest tradeoff of animating unmount without JS. -->
					<details class="group mt-3 max-w-[72ch]">
						<summary
							class="flex w-fit cursor-pointer list-none items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden"
						>
							abstract
							<ChevronRight
								class="size-3 transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none"
							/>
						</summary>
						<div class="abs-body">
							<p
								class="mt-2 min-h-0 overflow-hidden text-sm leading-relaxed text-muted-foreground first-letter:font-brand first-letter:font-semibold"
							>
								{paper.abstract}
							</p>
						</div>
					</details>
					<a
						href={paper.href}
						target="_blank"
						rel="noopener noreferrer"
						class="mt-3 inline-flex w-fit items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
					>
						pdf<span aria-hidden="true">↗</span><span class="sr-only">(opens in a new tab)</span>
					</a>
				</article>
			{/each}
		</div>
	</div>

	<!-- Stack: opinions ride inside the groups as annotated first items. -->
	<div class="flex flex-col gap-6">
		<SectionLabel title="Stack" />
		<div class="flex max-w-[72ch] flex-col gap-2">
			{#each stack.groups as group (group.label)}
				<p class="font-mono text-xs leading-relaxed text-muted-foreground">
					<span class="text-foreground">{group.label} —</span>
					{group.items.join(' · ')}<span class="text-brand">;</span>
				</p>
			{/each}
		</div>
	</div>

	<div class="flex flex-col gap-4">
		<SectionLabel title="Elsewhere" />
		<p class="flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs text-muted-foreground">
			{#each elsewhere as link (link.label)}
				<a href={link.href} class="transition-colors hover:text-foreground"
					>{link.label}<span class="text-brand">;</span></a
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
		left: 8px;
		width: 2px;
		/* The route ahead: dashes in the border tone. */
		background: repeating-linear-gradient(
			to bottom,
			var(--border) 0,
			var(--border) 5px,
			transparent 5px,
			transparent 11px
		);
	}
	.rail-fill {
		position: absolute;
		inset: 0 0 auto 0;
		width: 100%;
		height: 100%; /* markup default = the whole road traveled */
		background: var(--brand);
		transition: height 120ms linear;
	}
	.rail-mark {
		position: absolute;
		top: 100%; /* markup default: the semicolon rests at journey's end */
		left: 50%;
		transform: translate(-50%, -50%);
		font-family: var(--font-mono);
		font-size: 0.875rem;
		font-weight: 600;
		line-height: 1;
		color: var(--brand);
		background: var(--background);
		padding: 2px 1px;
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

	/* Education tree — hairline elbows off the degree root. Lines only; the
	   journey animation belongs to the career rail, not here. */
	.tree {
		position: relative;
		margin-top: 0.75rem;
		padding-left: 0;
		list-style: none;
	}
	.tree::before {
		/* Root stub: meets the degree block exactly and the first trunk at 0. */
		content: '';
		position: absolute;
		left: 5px;
		top: -0.75rem;
		width: 1px;
		height: 0.75rem;
		background: var(--border);
	}
	.tree li {
		position: relative;
		padding: 0.375rem 0 0.375rem 1.75rem;
		font-size: 0.875rem;
		line-height: 1.6;
		color: var(--muted-foreground);
	}
	.tree li::before {
		/* Full-height trunk so consecutive branches join corner-to-corner. */
		content: '';
		position: absolute;
		left: 5px;
		top: 0;
		bottom: 0;
		width: 1px;
		background: var(--border);
	}
	.tree li::after {
		/* horizontal elbow to the node */
		content: '';
		position: absolute;
		left: 5px;
		top: 50%;
		width: 0.75rem;
		height: 1px;
		background: var(--border);
	}
	.tree li:last-child::before {
		/* stop the trunk at the last branch */
		bottom: auto;
		height: 50%;
	}
	.node {
		position: absolute;
		left: 3px;
		top: 50%;
		width: 5px;
		height: 5px;
		border-radius: 9999px;
		transform: translateY(-50%);
		background: var(--border);
	}
	.node-lit {
		background: var(--brand);
	}

	/* Abstract disclosure: the body glides open on a grid-rows keyframe
	   (one-shot when <details> mounts its content); closing is instant — the
	   native unmount — which is the honest tradeoff for JS-off readability. */
	.abs-body {
		display: grid;
	}
	details[open] .abs-body {
		animation: abs-open 240ms ease-out;
	}
	@keyframes abs-open {
		from {
			grid-template-rows: 0fr;
			opacity: 0;
		}
		to {
			grid-template-rows: 1fr;
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.rail-fill,
		.rail-dot {
			transition: none;
		}
		details[open] .abs-body {
			animation: none;
		}
	}
</style>
