<script lang="ts">
	import { Check } from 'lucide-svelte';
	import type { Tag } from '#lib/api/index.ts';

	interface Props {
		tags: Tag[];
		selected: string[];
		onToggle: (name: string) => void;
	}

	let { tags, selected, onToggle }: Props = $props();
</script>

<div class="flex flex-col gap-3">
	<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">topics</p>
	<ul class="flex flex-col divide-y divide-border">
		{#each tags as tag (tag.name)}
			<li>
				<label class="row flex cursor-pointer items-baseline justify-between gap-3 py-2">
					<!-- Native checkbox, visually hidden: real semantics and keyboard for free. -->
					<input
						type="checkbox"
						class="absolute size-0 opacity-0"
						checked={selected.includes(tag.name)}
						onchange={() => onToggle(tag.name)}
					/>
					<span class="box flex min-w-0 items-baseline gap-1.5">
						<span class="tick" aria-hidden="true"><Check class="size-2.5" /></span>
						<span
							class="min-w-0 truncate font-mono text-xs {selected.includes(tag.name)
								? 'text-foreground'
								: 'text-muted-foreground'}">{tag.name}<span class="text-brand">;</span></span
						>
					</span>
					<span class="shrink-0 font-mono text-xs tabular-nums opacity-60">{tag.posts}</span>
				</label>
			</li>
		{/each}
	</ul>
</div>

<style>
	/* Violet box + tick on check; focus lands as a ring on the fake box. */
	.tick {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
		border: 1px solid var(--border);
		border-radius: 0.25rem;
		color: var(--background);
		align-self: center;
		transition:
			background-color 120ms ease,
			border-color 120ms ease;
	}
	.tick :global(svg) {
		opacity: 0;
		transform: scale(0.5);
		transition:
			opacity 120ms ease,
			transform 120ms ease;
	}
	.row input:checked + .box .tick {
		background-color: var(--brand);
		border-color: var(--brand);
	}
	.row input:checked + .box .tick :global(svg) {
		opacity: 1;
		transform: scale(1);
	}
	.row input:focus-visible + .box .tick {
		outline: 2px solid color-mix(in oklab, var(--brand) 55%, transparent);
		outline-offset: 2px;
	}
	.row:hover .tick {
		border-color: var(--muted-foreground);
	}
	@media (prefers-reduced-motion: reduce) {
		.tick,
		.tick :global(svg) {
			transition: none;
		}
	}
</style>
