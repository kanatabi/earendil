<script lang="ts">
	import { Search } from 'lucide-svelte';
	import { OPEN_SEARCH_EVENT } from '#lib/ui-events.ts';

	// The palette lives in the Navbar (⌘K binding + focus return); the pill
	// rings it through a window event — no lifted state across the shell.
	function openSearch() {
		window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
	}
</script>

<button
	type="button"
	onclick={openSearch}
	class="flex w-full items-center gap-3 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
>
	<Search class="size-4 shrink-0" />
	<span class="min-w-0 grow text-left">search the archive…</span>
	<kbd
		class="shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
		>⌘K</kbd
	>
</button>
