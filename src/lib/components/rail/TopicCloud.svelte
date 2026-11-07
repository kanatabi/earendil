<script lang="ts">
	import CardTitle from '../CardTitle.svelte';
	import type { Tag } from '#lib/api/index.ts';

	interface Props {
		tags: Tag[];
	}

	let { tags }: Props = $props();
</script>

<!-- Home rail: plain link rows — the cloud as BE-served, one tag per click. -->
<div class="flex flex-col gap-3">
	<CardTitle title="topics" />
	<ul class="flex flex-col divide-y divide-border">
		{#each tags as tag (tag.name)}
			<li>
				<a
					href="/search?tag={encodeURIComponent(tag.name)}"
					class="flex items-baseline justify-between gap-3 py-2 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
				>
					<span class="min-w-0 truncate">{tag.name}<span class="text-brand">;</span></span>
					<span class="shrink-0 tabular-nums opacity-60">{tag.posts}</span>
				</a>
			</li>
		{/each}
	</ul>
</div>
