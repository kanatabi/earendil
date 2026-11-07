<script lang="ts">
	import { page } from '$app/state';
	import { Feather, House, Images, Search } from 'lucide-svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import { OPEN_SEARCH_EVENT } from '#lib/ui-events.ts';
	import { chrome } from '#lib/scroll-chrome.svelte.ts';

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
			// Feather, not a person glyph: "account" icons promise a profile the
			// site doesn't have, and the ASCII doorknob keeps the monopoly on
			// "the human". A pen-name blog reaches its author by the pen.
			icon: Feather,
			match: (p: string) => p.startsWith('/about')
		}
	];

	const isActive = (href: string) =>
		tabs.find((t) => t.href === href)?.match(page.url.pathname) ?? false;

	const searchActive = $derived(page.url.pathname.startsWith('/search'));

	// Context-aware FAB (the pill in the home sheet retired as redundant):
	// on /search it returns you to the field — the browser scrolls it back
	// into view — everywhere else it rings the palette through the same
	// window event the rail SearchPill uses, so the Navbar's focus-return
	// contract applies unchanged.
	function tapSearch() {
		if (searchActive) {
			const el = document.getElementById('search-input');
			el?.focus();
			if (el instanceof HTMLInputElement) el.select();
		} else {
			window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
		}
	}
</script>

<!-- One UI-flavored primary bar below lg: five EQUAL flex-1 cells (exact
     10/30/50/70/90 icon rhythm, the elevated FAB mathematically centered),
     icon-only, active = brand violet. Phones keep the center search FAB; at
     md the slot retires with it (header pill takes over). Scroll choreography
     from the shared chrome store: hidden on deliberate scroll-down, back on
     scroll-up or a short idle beat; focusin forces it visible so keyboard
     focus is never stranded off-screen. z-20: under the rail sheet (z-25) and
     the palette/lightbox (z-30). -->
<nav
	aria-label="Primary navigation"
	onfocusin={() => (chrome.visible = true)}
	class="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/85 backdrop-blur transition duration-200 ease-out motion-reduce:transition-none lg:hidden {chrome.visible
		? 'translate-y-0 opacity-100'
		: 'pointer-events-none translate-y-full opacity-0'}"
>
	<div
		class="mx-auto flex h-14 w-full max-w-page items-stretch px-4 pb-[env(safe-area-inset-bottom)]"
	>
		{#each tabs.slice(0, 2) as tab (tab.href)}
			{@const Icon = tab.icon}
			<a
				href={tab.href}
				aria-label={tab.label}
				aria-current={isActive(tab.href) ? 'page' : undefined}
				class="flex min-w-0 flex-1 items-center justify-center transition-colors {isActive(tab.href)
					? 'text-brand'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				<Icon class="size-5" />
			</a>
		{/each}

		<div class="relative flex flex-1 items-center justify-center md:hidden">
			<button
				type="button"
				onclick={tapSearch}
				aria-label={searchActive ? 'Search field' : 'Search'}
				aria-haspopup={searchActive ? undefined : 'dialog'}
				class="absolute -top-5 flex size-13 items-center justify-center rounded-full border bg-card shadow-lg transition-colors {searchActive
					? 'border-brand/60 text-brand'
					: 'border-border text-muted-foreground hover:text-foreground'}"
			>
				<Search class="size-5" />
			</button>
		</div>

		{#each tabs.slice(2) as tab (tab.href)}
			{@const Icon = tab.icon}
			<a
				href={tab.href}
				aria-label={tab.label}
				aria-current={isActive(tab.href) ? 'page' : undefined}
				class="flex min-w-0 flex-1 items-center justify-center transition-colors {isActive(tab.href)
					? 'text-brand'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				<Icon class="size-5" />
			</a>
		{/each}

		<div class="flex flex-1 items-center justify-center">
			<ThemeToggle {theme} {onToggle} />
		</div>
	</div>
</nav>
