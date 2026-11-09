# earendil — dev targets, including the REAL-lumen cutover mode (Phase C).
# The API itself is orchestrated in ../lumen (its Makefile owns compose+seed).

LUMEN ?= http://localhost:8080
PORT  ?= 5173

.PHONY: help install dev lumen contract check lint test build

help:                  ## list targets
	@grep -hE '^[a-z][a-z-]*:.*?## ' Makefile | sed 's/:.*## /  — /'

install:               ## deps only (no backend needed for mock mode)
	npm install

dev:                   ## dev on the MOCK twin (offline default — zero backend)
	npm run dev -- --port $(PORT)

lumen:                 ## dev against a REAL lumen: server loads call $(LUMEN), browser rides the same-origin proxy
	@curl -sf $(LUMEN)/readyz >/dev/null || { echo "lumen not reachable at $(LUMEN) — cd ../lumen && make dev (and optionally: make dev-plane, make devs3)"; exit 1; }
	API_BASE=$(LUMEN) PUBLIC_API_BASE=/ npm run dev -- --port $(PORT)

contract:              ## the live acceptance harness (vitest vs a RUNNING lumen)
	## NOTE: src/lib/api/contract.spec.ts lives on milestone/1-contract-harness —
	## this target becomes runnable the moment both branches reach main.
	LUMEN_URL=$(LUMEN) npx vitest run src/lib/api/contract.spec.ts

check:                 ## svelte-check
	npm run check

lint:                  ## prettier + eslint
	npm run lint

test:                  ## unit suite (mock twin — no backend)
	npm run test:unit

build:                 ## production build (adapter-node)
	npm run build
