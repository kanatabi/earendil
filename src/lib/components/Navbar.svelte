<script lang="ts">
	import { page } from '$app/state';
	import { Search } from 'lucide-svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import SearchDialog from './SearchDialog.svelte';

	interface Props {
		theme: 'light' | 'dark';
		onToggle: () => void;
	}

	let { theme, onToggle }: Props = $props();

	const links = [
		{ label: 'Home', href: '/' },
		{ label: 'Gallery', href: '/gallery' },
		{ label: 'About', href: '/about' }
	];

	const isActive = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);

	let searchOpen = $state(false);
	let searchTrigger: HTMLElement | null = null;

	function openSearch() {
		if (searchOpen) return;
		// Remember the trigger so Esc/backdrop close can restore focus to it.
		searchTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		searchOpen = true;
	}

	function closeSearch() {
		searchOpen = false;
		searchTrigger?.focus();
		searchTrigger = null;
	}

	// Close on navigation.
	$effect(() => {
		void page.url.pathname;
		searchOpen = false;
	});

	// Global Mod+K / Ctrl+K toggles the search palette.
	$effect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') {
				e.preventDefault();
				if (searchOpen) closeSearch();
				else openSearch();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	// Home's rail search card asks for the palette through a window event —
	// the dialog (and its focus-return contract) stays owned by the Navbar.
	$effect(() => {
		const onRequest = () => openSearch();
		window.addEventListener('gofar:open-search', onRequest);
		return () => window.removeEventListener('gofar:open-search', onRequest);
	});
</script>

<!-- Mobile: wordmark only — primary navigation moved to the BottomNav bar
     (icon tabs + elevated search + theme slot); the hamburger menu is gone. -->
<header class="relative border-b border-border">
	<div class="mx-auto flex w-full max-w-page items-center justify-between px-5 py-4">
		<a
			href="/"
			class="font-brand text-3xl leading-none font-semibold tracking-tight"
			style="font-variation-settings: 'SOFT' 40, 'WONK' 1"
			aria-label="gofar; — home">gofar<span class="pl-1 text-brand">;</span></a
		>
		<div class="flex items-center gap-2 md:gap-8">
			<!-- Desktop: inline links -->
			<nav class="hidden items-center gap-6 md:flex" aria-label="Main navigation">
				{#each links as link (link.href)}
					<a
						href={link.href}
						class="relative text-sm transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:bg-brand after:transition-[width] after:duration-200
							{isActive(link.href)
							? 'font-medium text-foreground after:w-full'
							: 'text-muted-foreground after:w-0 hover:text-foreground hover:after:w-full'}"
						aria-current={isActive(link.href) ? 'page' : undefined}
					>
						{link.label}
					</a>
				{/each}
			</nav>
			<div class="flex items-center gap-2">
				<!-- Desktop: bordered pill with label + shortcut hint -->
				<button
					type="button"
					class="hidden items-center gap-3 rounded-full border border-border px-3 py-2 text-sm
						text-muted-foreground transition-colors hover:bg-muted md:flex"
					aria-label="Search"
					onclick={openSearch}
				>
					<Search class="size-4" />
					<span>Search</span>
					<span class="font-mono text-xs">Mod+K</span>
				</button>
				<!-- The toggle keeps a header slot only at lg; below that the
				     BottomNav owns it at the thumb's rest position. -->
				<div class="hidden lg:flex">
					<ThemeToggle {theme} {onToggle} />
				</div>
			</div>
		</div>
	</div>

	{#if searchOpen}
		<SearchDialog onClose={closeSearch} />
	{/if}
</header>
