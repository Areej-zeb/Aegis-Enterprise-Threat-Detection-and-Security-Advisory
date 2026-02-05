# ==============================================================================
# Aegis Docker Management - Makefile
# ==============================================================================
# Convenient commands for managing Docker containers
# ==============================================================================

.PHONY: help build up down restart logs ps clean dev prod

# Default target
help:
	@echo "Aegis Docker Management Commands:"
	@echo ""
	@echo "  make build       - Build all Docker images"
	@echo "  make up          - Start all containers (production)"
	@echo "  make down        - Stop all containers"
	@echo "  make restart     - Restart all containers"
	@echo "  make logs        - View logs from all containers"
	@echo "  make ps          - Show container status"
	@echo "  make clean       - Remove containers, volumes, and images"
	@echo "  make dev         - Start development environment"
	@echo "  make prod        - Start production environment"
	@echo ""
	@echo "Service-specific commands:"
	@echo "  make logs-backend    - View backend logs"
	@echo "  make logs-frontend   - View frontend logs"
	@echo "  make logs-auth       - View auth service logs"
	@echo "  make logs-mongodb    - View MongoDB logs"
	@echo ""
	@echo "  make shell-backend   - Open backend shell"
	@echo "  make shell-frontend  - Open frontend shell"
	@echo "  make shell-mongodb   - Open MongoDB shell"
	@echo ""
	@echo "  make backup-db       - Backup MongoDB database"
	@echo "  make restore-db      - Restore MongoDB database"

# Build all images
build:
	docker-compose build

# Start production environment
up:
	docker-compose up -d

prod: up

# Start development environment
dev:
	docker-compose -f docker-compose.dev.yml up -d

# Stop all containers
down:
	docker-compose down

# Stop development containers
down-dev:
	docker-compose -f docker-compose.dev.yml down

# Restart all containers
restart:
	docker-compose restart

# View logs from all containers
logs:
	docker-compose logs -f

# View logs from specific services
logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-auth:
	docker-compose logs -f auth

logs-mongodb:
	docker-compose logs -f mongodb

# Show container status
ps:
	docker-compose ps

# Open shell in containers
shell-backend:
	docker-compose exec backend bash

shell-frontend:
	docker-compose exec frontend sh

shell-mongodb:
	docker-compose exec mongodb mongosh

# Clean up everything (⚠️ removes volumes)
clean:
	docker-compose down -v
	docker system prune -af

# Backup MongoDB
backup-db:
	@echo "Creating MongoDB backup..."
	@mkdir -p ./backups
	docker-compose exec -T mongodb mongodump --out /data/backup
	docker cp aegis-mongodb:/data/backup ./backups/mongodb-backup-$$(date +%Y%m%d-%H%M%S)
	@echo "Backup completed!"

# Restore MongoDB (requires BACKUP_DIR variable)
restore-db:
	@if [ -z "$(BACKUP_DIR)" ]; then \
		echo "Error: Please specify BACKUP_DIR"; \
		echo "Usage: make restore-db BACKUP_DIR=./backups/mongodb-backup-20240101-120000"; \
		exit 1; \
	fi
	@echo "Restoring MongoDB from $(BACKUP_DIR)..."
	docker cp $(BACKUP_DIR) aegis-mongodb:/data/restore
	docker-compose exec mongodb mongorestore /data/restore
	@echo "Restore completed!"

# Health check
health:
	@echo "Checking container health..."
	@docker-compose ps
	@echo ""
	@echo "Backend health:"
	@curl -s http://localhost:8000/api/health || echo "Backend not responding"
	@echo ""
	@echo "Frontend health:"
	@curl -s http://localhost/health || echo "Frontend not responding"

# Update and rebuild
update:
	git pull origin main
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

# View resource usage
stats:
	docker stats --no-stream

# Prune unused resources
prune:
	docker system prune -f
	docker volume prune -f
	docker image prune -af
