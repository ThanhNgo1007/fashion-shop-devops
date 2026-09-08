.PHONY: help build up down logs restart clean build-prod up-prod health test lint shell-api shell-frontend mongo-shell

# Default target
.DEFAULT_GOAL := help

help: ## Show all available targets
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build docker compose services for local dev
	docker compose build

up: ## Start local dev environment
	docker compose up -d

down: ## Stop local dev environment
	docker compose down

logs: ## Tail logs for all local dev services
	docker compose logs -f

restart: ## Restart local dev environment
	docker compose down
	docker compose up -d

clean: ## Remove containers, networks, volumes, and images for this project
	docker compose down -v --rmi all

build-prod: ## Build docker compose services for production
	docker compose -f docker-compose.yml -f docker-compose.prod.yml build

up-prod: ## Start production environment
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

health: ## Run health check script against local services
	@echo "Checking API..."
	@./scripts/check-health.sh http://localhost:3001/health
	@echo "Checking Frontend..."
	@./scripts/check-health.sh http://localhost:3000/
	@echo "Checking Proxy..."
	@./scripts/check-health.sh http://localhost:80/

test: ## Run tests
	docker compose exec api npm test
	docker compose exec frontend npm test

lint: ## Run linting
	docker compose exec api npm run lint
	docker compose exec frontend npm run lint

shell-api: ## Exec into api container
	docker compose exec api sh

shell-frontend: ## Exec into frontend container
	docker compose exec frontend sh

mongo-shell: ## Exec into mongo container with mongosh
	docker compose exec mongo mongosh

ci-lint: ## Run linting locally
	cd backend && npm run lint
	cd frontend && npm run lint

ci-test: ## Run tests locally
	cd backend && npm test
	cd frontend && npm test

docker-push: ## Run scripts/docker-push.sh
	./scripts/docker-push.sh

smoke-test: ## Run scripts/smoke-test.sh against localhost
	./scripts/smoke-test.sh http://localhost
