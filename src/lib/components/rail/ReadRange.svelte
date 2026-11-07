<script lang="ts">
	import CardTitle from '../CardTitle.svelte';

	interface Props {
		min?: number;
		max?: number;
		/** Emits undefined at the control bounds (0/30) so the URL stays clean. */
		onChange: (min: number | undefined, max: number | undefined) => void;
	}

	let { min, max, onChange }: Props = $props();

	const LO = 0;
	const HI = 30;
	const lo = $derived(min ?? LO);
	const hi = $derived(max ?? HI);

	// Two native range inputs stacked over one custom track: each handle keeps
	// real semantics (arrows, announcements) while the visuals are ours.
	function setLo(v: number) {
		const next = Math.min(v, hi);
		onChange(next === LO ? undefined : next, max);
	}
	function setHi(v: number) {
		const next = Math.max(v, lo);
		onChange(min, next === HI ? undefined : next);
	}

	const readout = $derived(
		lo === LO && hi === HI
			? 'any length'
			: lo === LO
				? `≤ ${hi} min`
				: hi === HI
					? `≥ ${lo} min`
					: `${lo}–${hi} min`
	);

	const pct = (v: number) => `${(v / HI) * 100}%`;
</script>

<div class="flex flex-col gap-3">
	<div class="flex items-baseline justify-between gap-3">
		<CardTitle title="length" />
		<p class="font-mono text-xs text-foreground">{readout}<span class="text-brand">;</span></p>
	</div>

	<div class="relative h-8">
		<!-- Track + fill. -->
		<div
			class="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-muted"
		></div>
		<div
			class="pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand"
			style="left: {pct(lo)}; width: {pct(hi - lo)}"
		></div>
		<input
			type="range"
			class="slider absolute inset-0 w-full {lo >= HI - 2 ? 'z-20' : 'z-10'}"
			min={LO}
			max={HI}
			step={1}
			value={lo}
			oninput={(e) => setLo(Number(e.currentTarget.value))}
			aria-label="Minimum reading time in minutes"
		/>
		<input
			type="range"
			class="slider absolute inset-0 z-10 w-full"
			min={LO}
			max={HI}
			step={1}
			value={hi}
			oninput={(e) => setHi(Number(e.currentTarget.value))}
			aria-label="Maximum reading time in minutes"
		/>
	</div>

	<div class="flex justify-between font-mono text-[10px] text-muted-foreground/60">
		<span>{LO}m</span>
		<span>{HI}m+</span>
	</div>
</div>

<style>
	/* Native input, invisible chrome; the visible handle is the thumb skin. */
	.slider {
		appearance: none;
		-webkit-appearance: none;
		background: transparent;
		pointer-events: none;
		cursor: pointer;
	}
	.slider:focus {
		outline: none;
	}
	.slider::-webkit-slider-runnable-track {
		background: transparent;
		height: 100%;
	}
	.slider::-moz-range-track {
		background: transparent;
	}
	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		pointer-events: auto;
		width: 16px;
		height: 16px;
		margin-top: 8px;
		border-radius: 9999px;
		background: var(--background);
		border: 2px solid var(--brand);
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.25);
		transition: transform 120ms ease;
	}
	.slider::-moz-range-thumb {
		pointer-events: auto;
		width: 12px;
		height: 12px;
		border-radius: 9999px;
		background: var(--background);
		border: 2px solid var(--brand);
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.25);
	}
	.slider::-webkit-slider-thumb:hover {
		transform: scale(1.15);
	}
	.slider:focus-visible::-webkit-slider-thumb {
		outline: 2px solid color-mix(in oklab, var(--brand) 55%, transparent);
		outline-offset: 2px;
	}
	.slider:focus-visible::-moz-range-thumb {
		outline: 2px solid color-mix(in oklab, var(--brand) 55%, transparent);
		outline-offset: 2px;
	}
	@media (prefers-reduced-motion: reduce) {
		.slider::-webkit-slider-thumb {
			transition: none;
		}
	}
</style>
