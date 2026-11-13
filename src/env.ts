import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	PUBLIC_API_BASE: {
		public: true,
		// unset falls back to the dev default (real-by-default ruling 2026-11-09)
		schema: (value) => value,
		description:
			'Base URL of the backend REST API as seen by the BROWSER. In the cluster this is "/" — ' +
			'calls go same-origin and are proxied server-side (see routes/api/[...path]) because the ' +
			'API is not publicly exposed. Unset = the dev default (http://localhost:8080). ' +
			'The fixture corpus is a TEST-ONLY twin now — never a runtime source.'
	},
	API_BASE: {
		// server-only module ($app/env/private); read here for validation/docs, used via process.env
		schema: (value) => value,
		description:
			'Internal base URL of the backend REST API, SERVER-SIDE ONLY. ' +
			'In the cluster: http://lumen-http-server.lumen.svc.cluster.local. ' +
			'Unset falls back to the dev default (http://localhost:8080).'
	},
	ORIGIN: {
		// server-only module ($app/env/private); consumed in +layout.server.ts via process.env
		schema: (value) => value,
		description:
			'Canonical public origin of THIS deployment (scheme + host, no trailing slash): ' +
			'https://gofar.id in production, https://staging.gofar.id in staging. ' +
			'Consumed by the Person JSON-LD identity anchor so one image serves both envs ' +
			'(DESIGN §9). Unset = https://gofar.id (current prod behavior preserved).'
	}
});
