<script lang="ts">
	import type { SortValue, Tag } from '#lib/api/index.ts';
	import DateRange from './DateRange.svelte';
	import ReadRange from './ReadRange.svelte';
	import SortPicker from './SortPicker.svelte';
	import TopicFilter from './TopicFilter.svelte';

	export type Selection = {
		tags: string[];
		from?: string;
		to?: string;
		readMin?: number;
		readMax?: number;
		sort?: SortValue;
	};

	interface Props {
		tags: Tag[];
		selected: string[];
		from?: string;
		to?: string;
		readMin?: number;
		readMax?: number;
		sort?: SortValue;
		/** With a query, relevance is the implicit default order. */
		hasQuery: boolean;
		onApply: (f: Selection) => void;
	}

	let { tags, selected, from, to, readMin, readMax, sort, hasQuery, onApply }: Props = $props();

	// Buffer: selections accumulate locally; the URL — and therefore the
	// results — only move when Apply is pressed. The page re-keys this
	// component after each navigation, so the buffer always reseeds from the
	// applied truth (also when a result chip's × removes a filter).
	// Seeding note: with a query, the *effective* order is relevance even when
	// the param is absent, so the chip lights up without shipping a param.
	const defaultSort = $derived<SortValue | ''>(sort ?? (hasQuery ? 'relevance' : ''));
	// Intentional one-time seeding from props (safe under the key-remount):
	// svelte-ignore state_referenced_locally
	let picked = $state<string[]>([...selected]);
	// svelte-ignore state_referenced_locally
	let fromV = $state<string | undefined>(from);
	// svelte-ignore state_referenced_locally
	let toV = $state<string | undefined>(to);
	// svelte-ignore state_referenced_locally
	let readMinV = $state<number | undefined>(readMin);
	// svelte-ignore state_referenced_locally
	let readMaxV = $state<number | undefined>(readMax);
	// svelte-ignore state_referenced_locally
	let sortV = $state<SortValue | ''>(defaultSort);

	const dirty = $derived(
		fromV !== from ||
			toV !== to ||
			readMinV !== readMin ||
			readMaxV !== readMax ||
			sortV !== defaultSort ||
			picked.length !== selected.length ||
			picked.some((t) => !selected.includes(t))
	);
	const count = $derived(
		picked.length +
			(fromV || toV ? 1 : 0) +
			(readMinV || readMaxV ? 1 : 0) +
			(sortV !== '' && sortV !== defaultSort ? 1 : 0)
	);

	function toggle(name: string) {
		picked = picked.includes(name) ? picked.filter((t) => t !== name) : [...picked, name];
	}

	function reset() {
		picked = [...selected];
		fromV = from;
		toV = to;
		readMinV = readMin;
		readMaxV = readMax;
		sortV = defaultSort;
	}

	function apply() {
		onApply({
			tags: picked,
			from: fromV,
			to: toV,
			readMin: readMinV,
			readMax: readMaxV,
			// relevance over a query is the param-free default.
			sort: sortV === '' || sortV === defaultSort ? undefined : sortV
		});
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
	<ReadRange
		min={readMinV}
		max={readMaxV}
		onChange={(a, b) => {
			readMinV = a;
			readMaxV = b;
		}}
	/>
	<SortPicker value={sortV} showRelevance={hasQuery} onChange={(v) => (sortV = v)} />

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
				onclick={apply}
				disabled={!dirty}
				class="rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white transition-all hover:brightness-110 disabled:pointer-events-none disabled:opacity-40"
			>
				apply<span class="text-white/70">;</span>
			</button>
		</div>
	</div>
</div>
