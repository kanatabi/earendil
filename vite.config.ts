import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	// SSR dependency split, learned live (2026-11-11, mellon first then earendil):
	// vite EXTERNALIZES node_modules by default in SSR builds — but the
	// adapter-node runtime stage carries no node_modules, so every externalized
	// dep is a post-deploy ERR_MODULE_NOT_FOUND (earendil's deepest route,
	// /posts/[slug], died on markdown-it while the listing happily 200'd:
	// smokes must reach the route that RUNS the pipeline). Policy:
	//   noExternal = pure-JS deps that bundle cleanly (the markdown-it family);
	//   external   = package-layout resolvers — shiki fs-reads grammars/wasm,
	//              jsdom (via isomorphic-dompurify) requires ./workers relative
	//              to its own tree — bundling them breaks at runtime (both
	//              output modes proven); the image ships pruned prod deps instead.
	ssr: {
		external: [
			'shiki',
			'@shikijs/markdown-it',
			'@shikijs/core',
			'@shikijs/engine-oniguruma',
			'@shikijs/langs',
			'@shikijs/themes',
			'@shikijs/types',
			'isomorphic-dompurify',
			'jsdom'
		],
		noExternal: [
			'markdown-it',
			'markdown-it-anchor',
			'markdown-it-container',
			'markdown-it-task-lists'
		]
	},
	server: {
		// Tunnel testing (ngrok hands out a fresh random hostname per session, so
		// match by suffix — a leading dot means "this domain and all subdomains",
		// stable even when the URL regenerates). Extra hosts: ALLOWED_HOSTS=h1,h2.
		allowedHosts: [
			'.ngrok-free.app',
			'.ngrok.app',
			...(process.env.ALLOWED_HOSTS?.split(',')
				.map((h) => h.trim())
				.filter(Boolean) ?? [])
		]
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-node builds the Node SSR server (build/) for the K8s deploy —
			// see Dockerfile (which carries pruned prod node_modules for the
			// ssr.external set above) and vortex/applications/earendil/.
			adapter: adapter({ out: 'build' })
		})
	]
});
