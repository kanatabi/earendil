<script lang="ts">
	import './layout.css';
	import { navigating } from '$app/state';
	import favicon from '#lib/assets/favicon.svg';
	import Navbar from '#lib/components/Navbar.svelte';
	import Footer from '#lib/components/Footer.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	// Intentionally seed from the server-rendered cookie value; client toggles own the state afterwards.
	// svelte-ignore state_referenced_locally
	let theme = $state(data.theme);

	// Hash-only jumps (TOC links) load nothing — don't flash.
	const navLoading = $derived(
		navigating.to !== null &&
			!(
				navigating.from !== null &&
				navigating.to.url.pathname === navigating.from.url.pathname &&
				navigating.to.url.hash !== ''
			)
	);

	// Preloaded navigations finish in ~1 frame; guarantee the bar a minimum
	// visible beat: active while loading, then a finishing sweep to full + fade.
	let barState = $state<'idle' | 'active' | 'finishing'>('idle');
	let finishTimer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		if (navLoading) {
			clearTimeout(finishTimer);
			barState = 'active';
		} else if (barState === 'active') {
			barState = 'finishing';
			finishTimer = setTimeout(() => (barState = 'idle'), 280);
		}
	});

	// Person schema: pen-word ↔ legal name, machine-linked (DESIGN §2). Braces are
	// generated via stringify — a literal {...} inside {@html `...`} trips the
	// svelte-eslint-parser template lexer; the closing tag is split so its raw
	// sequence never appears in this file's source (it would end this block).
	const personJsonLd =
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'Person',
			name: 'Faiz Ainur Rofiq',
			alternateName: 'Gofar',
			url: 'https://gofar.id'
		})}</scr` + 'ipt>';

	function toggleTheme() {
		const next = theme === 'dark' ? 'light' : 'dark';
		const apply = () => {
			theme = next;
			document.documentElement.dataset.theme = next;
			document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
		};
		// Palette swap via View Transitions (UA cross-fade; instant where unsupported).
		if (document.startViewTransition) document.startViewTransition(apply);
		else apply();
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta
		name="description"
		content="Essays on distributed systems, reliability, and photography — by Faiz Ainur Rofiq (gofar;)."
	/>
	<meta property="og:site_name" content="gofar;" />
	<!-- Apply persisted theme before paint to avoid a flash of the wrong theme. -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- data.theme is a server-validated 'light'|'dark' literal -->
	{@html `<script>document.documentElement.dataset.theme="${data.theme}"</script>`}
	<!-- Identity anchor: pen-word ↔ legal name, machine-readable (DESIGN §2). -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- static JSON-LD, built above -->
	{@html personJsonLd}
</svelte:head>

<div class="flex min-h-svh flex-col bg-background text-foreground">
	<div class="route-progress" data-phase={barState} aria-hidden="true"></div>
	<Navbar {theme} onToggle={toggleTheme} />
	<div class="mx-auto flex w-full max-w-page grow flex-col gap-12 px-5 py-12 md:px-8">
		<main class="flex flex-1 flex-col gap-12">
			{@render children()}
		</main>
		<Footer />
	</div>
</div>
