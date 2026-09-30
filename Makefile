# Command catalog. Every target is a thin alias for pnpm or docker compose; CI calls the same
# underlying commands. Run `make` to list targets. Same names as the backend repo where they
# mean the same thing.
.DEFAULT_GOAL := help
# Compose file lives in docker/, local variables in env/.env; the project directory stays the
# repo root so paths and volume names don't change.
COMPOSE := docker compose --project-directory . --env-file env/.env -f docker/compose.yml
BACKEND_URL ?= http://localhost:8080

.PHONY: help setup fmt lint test verify backend-up e2e e2e-image api-types up down db-reset docker-ready

help: ## List targets
	@awk 'BEGIN {FS = ":.*## "} /^[a-z0-9-]+:.*## / {printf "  %-12s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

setup: env/.env ## One-time: install dependencies (+ git hooks), create env/.env
	pnpm install
	pnpm exec playwright install chromium

# Created on first use by any target that needs it; never overwritten.
env/.env:
	cp env/.env.example env/.env
	@echo "Created env/.env from env/.env.example"

fmt: ## Format and auto-fix lint issues
	pnpm run lint:fix

lint: ## Lint, type check, unused code/deps, i18n keys (no fixes)
	pnpm run typegen
	pnpm run lint
	pnpm run check:types
	pnpm run check:deps
	pnpm run check:i18n

test: ## Unit + UI component tests (no backend needed)
	pnpm run test

verify: env/.env lint test ## Everything CI's verify job runs: lint + tests + production build
	pnpm run build

backend-up: env/.env docker-ready ## Start Postgres + the backend API (for `pnpm dev` / `make e2e`)
	$(COMPOSE) --profile backend up -d --wait --wait-timeout 300
	@echo "Backend ready at $(BACKEND_URL)"

e2e: backend-up ## End-to-end tests against a local dev server + the backend
	pnpm run test:e2e

e2e-image: env/.env docker-ready ## As CI does: build the frontend image, run everything in containers, test
	$(COMPOSE) --profile full up -d --build --wait --wait-timeout 300
	E2E_BASE_URL=http://localhost:$${FRONTEND_PORT:-3000} pnpm run test:e2e

api-types: backend-up ## Regenerate src/libs/api/schema.d.ts from the backend's OpenAPI spec
	BACKEND_URL=$(BACKEND_URL) pnpm run api:types

up: env/.env docker-ready ## Run the full stack in containers (frontend on :3000)
	$(COMPOSE) --profile full up --build

down: env/.env docker-ready ## Stop all containers (keeps data)
	$(COMPOSE) --profile full down

db-reset: env/.env docker-ready ## Stop containers and delete the local backend database
	$(COMPOSE) --profile full down
	docker volume rm -f $(notdir $(CURDIR))_postgres-data

docker-ready: ## Check Docker is running; on macOS start Docker Desktop and wait
	@scripts/ensure-docker.sh
