<script lang="ts">
	import { Mail } from 'lucide-svelte';
	import { brandPaths } from '#lib/brand-icons.ts';
	import { elsewhere } from '#lib/content/social.ts';
</script>

<footer class="flex flex-col gap-3 border-t border-border pt-6">
	<div class="flex flex-wrap items-center justify-between gap-4">
		<p class="text-sm text-muted-foreground">&copy; 2026 Faiz Ainur Rofiq</p>
		<!-- Brand marks, not words: logos carry more identity in less space (and
		     read across languages). Inlined SVG paths, currentColor — theme-aware,
		     zero third-party requests. -->
		<nav class="flex items-center gap-1" aria-label="Social links">
			{#each elsewhere as link (link.label)}
				{@const key = link.label.replace(/[^a-z]/g, '')}
				<a
					href={link.href}
					aria-label={link.label}
					title={link.label}
					target={link.href.startsWith('http') ? '_blank' : undefined}
					rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
					class="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
				>
					{#if brandPaths[key]}
						<svg
							viewBox="0 0 24 24"
							class="size-[18px]"
							fill="currentColor"
							role="img"
							aria-hidden="true"><path d={brandPaths[key]} /></svg
						>
					{:else}
						<Mail class="size-[18px]" />
					{/if}
				</a>
			{/each}
		</nav>
	</div>
	<p class="text-xs text-muted-foreground/70">
		Built with SvelteKit &middot; self-hosted &middot; no trackers<span class="text-brand">;</span>
	</p>
</footer>
