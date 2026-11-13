import { resolveOrigin } from '#lib/site.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ cookies }) => ({
	theme: cookies.get('theme') === 'dark' ? ('dark' as const) : ('light' as const),
	// Canonical origin of this deployment (ORIGIN env, prod default when unset) —
	// feeds the Person JSON-LD so staging and production ship the SAME image.
	origin: resolveOrigin(process.env.ORIGIN)
});
