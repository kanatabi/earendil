<script lang="ts">
	import type { Tag } from '#lib/api/index.ts';
	import TopicFilter from './TopicFilter.svelte';
	import DateRange from './DateRange.svelte';

	interface Props {
		tags: Tag[];
		selected: string[];
		from?: string;
		to?: string;
		onApply: (f: { tags: string[]; from?: string; to?: string }) => void;
	}

	let { tags, selected, from, to, onApply }: Props = $props();

	// Buffer: selections accumulate locally; the URL — and therefore the
	// results — only move when Apply is pressed. The page re-keys this
	// component after each navigation, so the buffer always reseeds from the
	// applied truth (also when a result chip's × removes a filter).
	// Intentional one-time seeding from props (safe under the key-remount):
	// svelte-ignore state_referenced_locally
	let picked = $state<string[]>([...selected]);
	// svelte-ignore state_referenced_locally
	let fromV = $state<string | undefined>(from);
	// svelte-ignore state_referenced_locally
	let toV = $state<string | undefined>(to);

	const dirty = $derived(
		fromV !== from ||
			toV !== to ||
			picked.length !== selected.length ||
			picked.some((t) => !selected.includes(t))
	);
	const count = $derived(picked.length + (fromV || toV ? 1 : 0));

	function toggle(name: string) {
		picked = picked.includes(name) ? picked.filter((t) => t !== name) : [...picked, name];
	}

	function reset() {
		picked = [...selected];
		fromV = from;
		toV = to;
	}
</script>

<div class="flex flex-col gap-8">
	<TopicFilter {tags} selected={picked} onToggle={toggle} />
	<DateRange
		from={fromV}
		to={toV}
		onChange={(f, t) => {
			fromV = f;
			toV = t;
		}}
	/>

	<div class="flex items-center justify-between gap-3 border-t border-border pt-4">
		<p class="font-mono text-xs text-muted-foreground">
			{count > 0 ? `${count} pending` : 'nothing changed'}
		</p>
		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={reset}
				disabled={!dirty}
				class="rounded-full px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
			>
				reset<span class="text-brand">;</span>
			</button>
			<button
				type="button"
				onclick={() => onApply({ tags: picked, from: fromV, to: toV })}
				disabled={!dirty}
				class="rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white transition-all hover:brightness-110 disabled:pointer-events-none disabled:opacity-40"
			>
				apply<span class="text-white/70">;</span>
			</button>
		</div>
	</div>
</div>
