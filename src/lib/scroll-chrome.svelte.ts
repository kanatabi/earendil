/**
 * Persistent mobile chrome (BottomNav) visibility driven by scroll behavior.
 * Singleton rune module: one passive scroll listener, started once from the
 * root layout, read by any chrome that should get out of the reader's way.
 *
 * Rules: always visible near the top; deliberate scroll-DOWN hides (8px
 * hysteresis so jitter can't flicker); scroll-UP reveals instantly; stopping
 * anywhere reveals after a short idle beat, so the bar is never withheld.
 */
export const chrome = $state({ visible: true });

const TOP_PX = 100;
const HYSTERESIS_PX = 8;
const IDLE_MS = 600;

export function startScrollChrome(): () => void {
	let lastY = window.scrollY;
	let idle: ReturnType<typeof setTimeout> | undefined;

	const onScroll = () => {
		const y = window.scrollY;
		if (y <= TOP_PX || y < lastY - HYSTERESIS_PX) chrome.visible = true;
		else if (y > lastY + HYSTERESIS_PX) chrome.visible = false;
		clearTimeout(idle);
		idle = setTimeout(() => (chrome.visible = true), IDLE_MS);
		lastY = y;
	};

	window.addEventListener('scroll', onScroll, { passive: true });
	return () => {
		window.removeEventListener('scroll', onScroll);
		clearTimeout(idle);
	};
}
