# SvelteKit SSR container (adapter-node). Build output in `build/` is self-contained,
# so the runtime stage needs no node_modules. Used by the earendil deployment —
# see vortex/applications/earendil/ in the GitOps repo (renamed from
# k8s-platform-manifests/applications/blog-frontend/).
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build \
 && npm prune --omit=dev

FROM node:22-alpine AS output
WORKDIR /app
ENV NODE_ENV=production
# The SSR externals (shiki, jsdom-dompurify chain — see vite.config ssr.external)
# resolve from node_modules at RUNTIME; "build/ is self-contained" is true only
# for the bundled set. Pruned production deps ride along.
COPY --from=build /app/node_modules ./node_modules
# PORT (listen) comes from the Deployment's env in Git. The ORIGIN claim this
# comment used to make was fiction — nothing in src/ reads it (env.ts declares
# PUBLIC_API_BASE + API_BASE only; canonical URLs derive per-request from the
# Host); it was dropped from base env + ExternalSecrets 2026-11-10. Either way:
# don't bake domains in here.
COPY --from=build /app/build ./build
# package.json rides along: the #lib/* imports ALIAS lives in its "imports"
# field — without it server.js's import of #lib/server/metrics.js throws
# ERR_PACKAGE_IMPORT_NOT_DEFINED at boot (the same bug mellon's v3.1.0
# rollout crashed on). It also anchors "type": "module" for the .js files.
COPY --from=build /app/package.json ./package.json
# the custom server (2026-11-15): TWO listeners in ONE process — the app
# on PORT and the UNROUTED /metrics listener on EARENDIL_METRICS_PORT
# (default 9090, the no-sidecar contract's scrape door). server.js is
# adapter-node's documented custom-server path; the metrics registry is
# plain JS so both the SvelteKit hooks and this server share ONE
# prom-client register.
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/src/lib/server/metrics.js ./src/lib/server/metrics.js
EXPOSE 3000 9090
USER node
CMD ["node", "server.js"]
