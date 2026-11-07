/**
 * Persistent mobile chrome (BottomNav + ScrollTopButton) visibility driven by
 * scroll behavior. Singleton rune module: the passive window listener attaches
 * ITSELF at module-eval time on the client (guarded for SSR) — no reliance on
 * a component effect firing, and one instance is guaranteed per module graph.
 *
 * Rules: always visible near the top; deliberate scroll-DOWN hides (8px
 * hysteresis so jitter can't flicker); scroll-UP reveals instantly; stopping
 * anywhere reveals after a short idle beat, so the bar is never withheld. The
 * scroll-top pill reads `scrolled` (a pure position rule, >400px deep).
 */
export const chrome = $state({ visible: true, scrolled: false });

const TOP_PX = 100;
const HYSTERESIS_PX = 8;
const IDLE_MS = 600;
// Position rule (independent from the bar's direction choreography): deep
// enough that "back to the top" is a real need.
const DEEP_PX = 400;

// Imported once by the client module graph; runs at eval, before first paint.
if (typeof window !== 'undefined') {
	let lastY = window.scrollY;
	let idle: ReturnType<typeof setTimeout> | undefined;

	const onScroll = () => {
		const y = window.scrollY;
		chrome.scrolled = y > DEEP_PX;
		if (y <= TOP_PX || y < lastY - HYSTERESIS_PX) chrome.visible = true;
		else if (y > lastY + HYSTERESIS_PX) chrome.visible = false;
		clearTimeout(idle);
		idle = setTimeout(() => (chrome.visible = true), IDLE_MS);
		lastY = y;
	};

	// Sync once at startup: restored or deep scroll positions do not
	// necessarily fire a scroll event right away — without this the pill
	// stays hidden (and the bar's baseline stale) until a manual scroll.
	onScroll();

	window.addEventListener('scroll', onScroll, { passive: true });
}
