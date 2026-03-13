# DevPulse Docker Makefile

.PHONY: help build up down logs clean dev-backend dev-frontend

# Default target
help: ## Show this help message
	@echo "DevPulse Docker Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

# Build all services
build: ## Build all Docker images
	docker-compose build

# Start all services
up: ## Start all services in detached mode
	docker-compose up -d

# Stop all services
down: ## Stop all services
	docker-compose down

# View logs
logs: ## View logs from all services
	docker-compose logs -f

# Follow logs from specific service
logs-%: ## View logs from specific service (e.g., make logs-backend)
	docker-compose logs -f $*

# Clean up
clean: ## Remove all containers, volumes, and images
	docker-compose down -v --rmi all

# Development helpers
dev-backend: ## Run backend and database for development
	docker-compose up -d mongodb backend

dev-frontend: ## Run frontend locally (requires backend running)
	cd frontend && npm run dev

# Quick start
start: build up ## Build and start all services
	@echo "DevPulse is running!"
	@echo "Frontend: http://localhost"
	@echo "Backend:  http://localhost:3001"

# Health check
health: ## Check health of all services
	@echo "Checking services..."
	@docker-compose ps
	@echo ""
	@echo "Health checks:"
	@docker-compose exec backend curl -s http://localhost:3001/api/status | head -1 || echo "Backend: DOWN"
	@docker-compose exec mongodb mongosh --eval "db.runCommand('ping')" --quiet || echo "MongoDB: DOWN"