<script lang="ts">
	import { page } from '$app/state';
	import { CircleUser, House, Images, Search } from 'lucide-svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	interface Props {
		theme: 'light' | 'dark';
		onToggle: () => void;
	}

	let { theme, onToggle }: Props = $props();

	const tabs = [
		{ href: '/', label: 'home', icon: House, match: (p: string) => p === '/' },
		{
			href: '/gallery',
			label: 'gallery',
			icon: Images,
			match: (p: string) => p.startsWith('/gallery')
		},
		{
			href: '/about',
			label: 'about',
			icon: CircleUser,
			match: (p: string) => p.startsWith('/about')
		}
	];

	const isActive = (href: string) =>
		tabs.find((t) => t.href === href)?.match(page.url.pathname) ?? false;

	const searchActive = $derived(page.url.pathname.startsWith('/search'));
</script>

<!-- One UI-flavored primary bar below lg: icon-only tabs, an elevated center
     search on phones (the header pill takes over at md), and the theme slot at
     the thumb's rest position. The mobile header is just the wordmark; the
     hamburger is gone. z-20: under the rail sheet (z-25) and the
     palette/lightbox (z-30). -->
<nav
	aria-label="Primary navigation"
	class="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/85 backdrop-blur lg:hidden"
>
	<div
		class="mx-auto flex h-14 w-full max-w-page items-stretch justify-around px-4 pb-[env(safe-area-inset-bottom)]"
	>
		{#each tabs.slice(0, 2) as tab (tab.href)}
			{@const Icon = tab.icon}
			<a
				href={tab.href}
				aria-label={tab.label}
				aria-current={isActive(tab.href) ? 'page' : undefined}
				class="flex min-w-12 grow items-center justify-center transition-colors {isActive(tab.href)
					? 'text-brand'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				<Icon class="size-5" />
			</a>
		{/each}

		<div class="relative flex w-14 shrink-0 items-center justify-center md:hidden">
			<a
				href="/search"
				aria-label="Search"
				class="absolute -top-5 flex size-13 items-center justify-center rounded-full border bg-card shadow-lg transition-colors {searchActive
					? 'border-brand/60 text-brand'
					: 'border-border text-muted-foreground hover:text-foreground'}"
			>
				<Search class="size-5" />
			</a>
		</div>

		{#each tabs.slice(2) as tab (tab.href)}
			{@const Icon = tab.icon}
			<a
				href={tab.href}
				aria-label={tab.label}
				aria-current={isActive(tab.href) ? 'page' : undefined}
				class="flex min-w-12 grow items-center justify-center transition-colors {isActive(tab.href)
					? 'text-brand'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				<Icon class="size-5" />
			</a>
		{/each}

		<div class="flex items-center justify-center">
			<ThemeToggle {theme} {onToggle} />
		</div>
	</div>
</nav>
