<script lang="ts">
	import type { FactRow } from '#lib/content/about.ts';

	interface Props {
		title: string;
		rows: FactRow[];
	}

	let { title, rows }: Props = $props();
</script>

<!-- Rail card: label — value rows in the mono voice (facts, colophon). -->
<div class="flex flex-col gap-3">
	<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">{title}</p>
	<div class="flex flex-col gap-1.5">
		{#each rows as row (row.label)}
			<p class="flex flex-wrap items-baseline gap-x-2 font-mono text-xs leading-relaxed">
				<span class="text-muted-foreground">{row.label} —</span>
				{#if row.href}
					<a
						href={row.href}
						target={row.href.startsWith('http') ? '_blank' : undefined}
						rel={row.href.startsWith('http') ? 'noopener noreferrer' : undefined}
						class="text-foreground transition-colors hover:text-brand">{row.value}</a
					>
				{:else}
					<span class="text-foreground">{row.value}</span>
				{/if}
			</p>
		{/each}
	</div>
</div>
