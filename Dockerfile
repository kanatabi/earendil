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
EXPOSE 3000
USER node
CMD ["node", "build"]
