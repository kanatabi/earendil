<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		children: Snippet;
		class?: string;
	}

	let { label, children, class: cls = '' }: Props = $props();
</script>

<!-- Sticky rail shell: self-start keeps the grid item content-height so
     position:sticky actually has scroll room (stretched items never stick).
     Pages plug cards in; this shell knows nothing about them. -->
<aside
	class="hidden lg:sticky lg:top-6 lg:flex lg:flex-col lg:items-stretch lg:gap-8 lg:self-start {cls}"
	aria-label={label}
>
	{@render children()}
</aside>
