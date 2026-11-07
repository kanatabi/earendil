<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		href: string;
		/** External links get the ↗ suffix, new tab, rel safety, and an
		    sr-only heads-up — the pattern shared by papers, pdfs and source. */
		external?: boolean;
		class?: string;
		children: Snippet;
	}

	let { href, external = false, class: cls = '', children }: Props = $props();
</script>

<!-- Anchor twin of the house pill (e.g. `pdf ↗`). -->
<a
	{href}
	target={external ? '_blank' : undefined}
	rel={external ? 'noopener noreferrer' : undefined}
	class="flex w-fit items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground {cls}"
>
	{@render children()}{#if external}<span aria-hidden="true">↗</span><span class="sr-only"
			>(opens in a new tab)</span
		>{/if}
</a>
