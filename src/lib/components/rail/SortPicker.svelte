<script lang="ts">
	import CardTitle from '../CardTitle.svelte';
	import Pill from '../Pill.svelte';
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
	<CardTitle title="order" />
	<div class="flex flex-wrap gap-2">
		{#if showRelevance}
			<Pill active={value === 'relevance'} onclick={() => onChange('relevance')}>
				relevance<span class="text-brand">;</span>
			</Pill>
		{/if}
		{#each options as opt (opt.v)}
			<Pill active={value === opt.v} onclick={() => onChange(opt.v)}>
				{opt.label}<span class="text-brand">;</span>
			</Pill>
		{/each}
	</div>
</div>
