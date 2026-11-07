<script lang="ts">
	import type { SortValue } from '#lib/api/index.ts';

	interface Props {
		/** Current pick; '' means the BE curation order (nothing highlighted). */
		value: SortValue | '';
		/** relevance only makes sense over a result set with a query. */
		showRelevance: boolean;
		onChange: (v: SortValue) => void;
	}

	let { value, showRelevance, onChange }: Props = $props();

	const options: { v: SortValue; label: string }[] = [
		{ v: 'newest', label: 'newest' },
		{ v: 'oldest', label: 'oldest' },
		{ v: 'quickest', label: 'quick' },
		{ v: 'longest', label: 'slow' }
	];
</script>

<div class="flex flex-col gap-3">
	<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">order</p>
	<div class="flex flex-wrap gap-2">
		{#if showRelevance}
			<button
				type="button"
				onclick={() => onChange('relevance')}
				aria-pressed={value === 'relevance'}
				class="rounded-full border px-3 py-1 font-mono text-xs transition-colors {value ===
				'relevance'
					? 'border-brand bg-brand/10 text-foreground'
					: 'border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground'}"
			>
				relevance<span class="text-brand">;</span>
			</button>
		{/if}
		{#each options as opt (opt.v)}
			<button
				type="button"
				onclick={() => onChange(opt.v)}
				aria-pressed={value === opt.v}
				class="rounded-full border px-3 py-1 font-mono text-xs transition-colors {value === opt.v
					? 'border-brand bg-brand/10 text-foreground'
					: 'border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground'}"
			>
				{opt.label}<span class="text-brand">;</span>
			</button>
		{/each}
	</div>
</div>
