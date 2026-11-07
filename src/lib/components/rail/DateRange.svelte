<script lang="ts">
	import { SvelteDate } from 'svelte/reactivity';
	import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-svelte';
	import CardTitle from '../CardTitle.svelte';
	import Pill from '../Pill.svelte';

	interface Props {
		from?: string;
		to?: string;
		/** Emits the inclusive YYYY-MM-DD window; undefined means unbounded. */
		onChange: (from: string | undefined, to: string | undefined) => void;
	}

	let { from, to, onChange }: Props = $props();

	let open = $state(false);
	let root = $state<HTMLDivElement | undefined>();
	let trigger = $state<HTMLButtonElement | undefined>();
	// Month under the grid header; seeded when the popover opens (client-only).
	let cursor = $state<Date | null>(null);

	const iso = (d: Date) =>
		`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

	const today = () => iso(new SvelteDate());

	function display(isoStr: string) {
		const [y, m, d] = isoStr.split('-').map(Number);
		return new SvelteDate(y, m - 1, d).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	// Compact for the 272px rail: ISO-ish, year printed once when unambiguous.
	const summary = $derived(
		from && to
			? from.slice(0, 4) === to.slice(0, 4)
				? `${from} → ${to.slice(5)}`
				: `${from} → ${to}`
			: from
				? `≥ ${from}`
				: to
					? `≤ ${to}`
					: 'any date'
	);

	function presetDays(days: number) {
		const end = new SvelteDate();
		const start = new SvelteDate();
		start.setDate(end.getDate() - days + 1);
		return { from: iso(start), to: iso(end) };
	}

	const presets = [7, 30, 90];
	function presetActive(days: number) {
		const p = presetDays(days);
		return from === p.from && to === p.to;
	}

	function toggleOpen() {
		open = !open;
		if (open && !cursor) {
			const seed = to ?? from ?? today();
			const [y, m] = seed.split('-').map(Number);
			cursor = new SvelteDate(y, m - 1, 1);
		}
		if (!open) trigger?.focus();
	}

	// Pick flow: first click sets the start, second sets the end (a click before
	// the start swaps it). One-click presets and clear sit alongside the calendar.
	function pick(dayIso: string) {
		if (!from || to) onChange(dayIso, undefined);
		else if (dayIso < from) onChange(dayIso, from);
		else onChange(from, dayIso);
	}

	function setPreset(days: number) {
		const p = presetDays(days);
		onChange(p.from, p.to);
	}

	const monthTitle = $derived(
		cursor?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) ?? ''
	);

	const cells = $derived.by(() => {
		if (!cursor) return [];
		const y = cursor.getFullYear();
		const m = cursor.getMonth();
		const lead = (new SvelteDate(y, m, 1).getDay() + 6) % 7; // Monday-first grid
		const count = new SvelteDate(y, m + 1, 0).getDate();
		const out: (string | null)[] = Array.from({ length: lead }, () => null);
		for (let d = 1; d <= count; d++) {
			out.push(`${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
		}
		return out;
	});

	function shiftMonth(delta: number) {
		if (!cursor) return;
		cursor = new SvelteDate(cursor.getFullYear(), cursor.getMonth() + delta, 1);
	}

	// Outside-click + Esc while open. The dialog is non-modal by design: the
	// feed stays browsable behind it, so no focus trap — Esc returns focus.
	$effect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') toggleOpen();
		};
		const onDown = (e: PointerEvent) => {
			if (root && !root.contains(e.target as Node)) toggleOpen();
		};
		window.addEventListener('keydown', onKey);
		window.addEventListener('pointerdown', onDown);
		return () => {
			window.removeEventListener('keydown', onKey);
			window.removeEventListener('pointerdown', onDown);
		};
	});
</script>

<div class="relative flex flex-col gap-3" bind:this={root}>
	<CardTitle title="dates" />

	<div class="flex flex-wrap gap-2">
		{#each presets as days (days)}
			<Pill active={presetActive(days)} onclick={() => setPreset(days)}>
				{days}d<span class="text-brand">;</span>
			</Pill>
		{/each}
		<Pill
			active={!((from || to) && !presets.some((p) => presetActive(p)))}
			onclick={() => onChange(undefined, undefined)}
		>
			all<span class="text-brand">;</span>
		</Pill>
	</div>

	<button
		type="button"
		onclick={toggleOpen}
		aria-expanded={open}
		aria-haspopup="dialog"
		class="flex items-center gap-2.5 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-accent/40"
		bind:this={trigger}
	>
		<CalendarDays class="size-4 shrink-0 text-muted-foreground" />
		<span
			class="min-w-0 grow truncate text-left font-mono text-xs {from || to
				? 'text-foreground'
				: 'text-muted-foreground'}">{summary}<span class="text-brand">;</span></span
		>
		<ChevronRight
			class="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 {open
				? 'rotate-90'
				: ''}"
		/>
	</button>

	{#if open && cursor}
		<div
			role="dialog"
			aria-label="Choose a date range"
			class="fade-in absolute z-30 mt-2 w-64 rounded-xl border border-border bg-card p-4 shadow-lg"
		>
			<div class="mb-2 flex items-center justify-between">
				<button
					type="button"
					onclick={() => shiftMonth(-1)}
					aria-label="Previous month"
					class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
				>
					<ChevronLeft class="size-4" />
				</button>
				<p class="font-brand text-lg leading-none font-semibold tracking-tight">{monthTitle}</p>
				<button
					type="button"
					onclick={() => shiftMonth(1)}
					aria-label="Next month"
					class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
				>
					<ChevronRight class="size-4" />
				</button>
			</div>
			<div class="grid grid-cols-7 gap-1">
				{#each ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as wd, i (i)}
					<span
						class="flex h-6 items-center justify-center font-mono text-[10px] text-muted-foreground/60"
						>{wd}</span
					>
				{/each}
				{#each cells as day, i (i)}
					{#if day === null}
						<span></span>
					{:else}
						{@const [y, m, d] = day.split('-').map(Number)}
						{@const endpoint = day === from || day === to}
						{@const inRange = from && to && day > from && day < to}
						<button
							type="button"
							onclick={() => pick(day)}
							aria-pressed={endpoint}
							aria-label={new SvelteDate(y, m - 1, d).toLocaleDateString('en-US', {
								weekday: 'short',
								month: 'short',
								day: 'numeric',
								year: 'numeric'
							})}
							class="flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs tabular-nums transition-colors {endpoint
								? 'bg-brand font-semibold text-white'
								: inRange
									? 'bg-brand/15 text-foreground'
									: day === today()
										? 'border border-border text-foreground'
										: 'text-muted-foreground hover:bg-accent hover:text-foreground'}"
						>
							{d}
						</button>
					{/if}
				{/each}
			</div>
			<p
				class="mt-3 border-t border-border pt-2 text-center font-mono text-[11px] text-muted-foreground"
			>
				{from && !to
					? 'pick the end date'
					: from
						? `${display(from)} → ${to ? display(to) : '…'}`
						: 'any date'}
			</p>
		</div>
	{/if}
</div>
