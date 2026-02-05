# Aegis Docker Deployment Guide

Complete guide for deploying Aegis Enterprise Threat Detection using Docker.

## 📋 Prerequisites

- Docker Engine 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- Docker Compose 2.0+ ([Install Docker Compose](https://docs.docker.com/compose/install/))
- At least 4GB RAM available for Docker
- 10GB free disk space

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Aegis-Enterprise-Threat-Detection-and-Security-Advisory
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your preferred editor
nano .env  # or vim, code, etc.
```

**Important:** Change the default passwords and secrets in `.env`:
- `MONGO_ROOT_PASSWORD`
- `JWT_SECRET` (minimum 32 characters)

### 3. Build and Start All Services

```bash
# Build and start all containers
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 4. Access the Application

- **Frontend (Web UI):** http://localhost
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **Auth Service:** http://localhost:5000
- **MongoDB:** localhost:27017

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Nginx (Frontend)                      │
│                   React Application                      │
│                    Port: 80                              │
└────────────┬────────────────────────────────────────────┘
             │
             ├─────────────────────────────────────────────┐
             │                                             │
┌────────────▼──────────────┐              ┌──────────────▼─────────┐
│   FastAPI Backend         │              │   Auth Service         │
│   ML Detection & IDS      │              │   Node.js + Express    │
│   Port: 8000              │              │   Port: 5000           │
└────────────┬──────────────┘              └──────────────┬─────────┘
             │                                             │
             │                              ┌──────────────▼─────────┐
             │                              │   MongoDB              │
             │                              │   Port: 27017          │
             │                              └────────────────────────┘
             │
┌────────────▼──────────────┐
│   ML Models & Artifacts   │
│   (Volume Mount)          │
└───────────────────────────┘
```

## 📦 Services

### Frontend (React + Nginx)
- **Container:** `aegis-frontend`
- **Port:** 80
- **Technology:** React 19, Vite, Nginx
- **Features:** 
  - Dashboard
  - IDS Alerts
  - ML Detection
  - Pentesting
  - Security Assistant Chatbot
  - Settings

### Backend (Python + FastAPI)
- **Container:** `aegis-backend`
- **Port:** 8000
- **Technology:** Python 3.12, FastAPI, Uvicorn
- **Features:**
  - ML-based threat detection
  - Real-time IDS alerts
  - Pentest scanning
  - WebSocket support
  - SHAP/LIME explainability

### Auth Service (Node.js)
- **Container:** `aegis-auth`
- **Port:** 5000
- **Technology:** Node.js 20, Express, JWT
- **Features:**
  - User authentication
  - JWT token management
  - MongoDB integration

### MongoDB
- **Container:** `aegis-mongodb`
- **Port:** 27017
- **Technology:** MongoDB 7.0
- **Purpose:** User data and authentication

## 🛠️ Common Commands

### Start Services
```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d frontend

# Start with build
docker-compose up -d --build
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 frontend
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Execute Commands in Container
```bash
# Backend shell
docker-compose exec backend bash

# Run Python script
docker-compose exec backend python -m backend.ids.models.show_results

# MongoDB shell
docker-compose exec mongodb mongosh
```

### Health Checks
```bash
# Check all container health
docker-compose ps

# Inspect specific container
docker inspect aegis-backend --format='{{.State.Health.Status}}'
```

## 🔧 Development Mode

For development with hot-reload:

```bash
# Use the development compose file
docker-compose -f docker-compose.dev.yml up -d
```

Or modify `docker-compose.yml` to mount source code as volumes:

```yaml
backend:
  volumes:
    - ./backend:/app/backend
    - ./artifacts:/app/artifacts:ro
```

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Check container status
docker-compose ps

# Rebuild container
docker-compose up -d --build backend
```

### Port Already in Use

```bash
# Find process using port 80
netstat -ano | findstr :80  # Windows
lsof -i :80                 # Linux/Mac

# Change port in docker-compose.yml
ports:
  - "8080:80"  # Use port 8080 instead
```

### MongoDB Connection Issues

```bash
# Check MongoDB is running
docker-compose ps mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Verify connection string in .env
MONGODB_URI=mongodb://admin:password@mongodb:27017/aegis_auth?authSource=admin
```

### Out of Memory

```bash
# Increase Docker memory limit
# Docker Desktop: Settings > Resources > Memory

# Check container memory usage
docker stats
```

### Permission Issues (Linux)

```bash
# Fix volume permissions
sudo chown -R $USER:$USER ./backend/ids/logs
```

## 🔒 Security Considerations

### Production Deployment

1. **Change Default Credentials**
   ```bash
   # Generate strong passwords
   openssl rand -base64 32
   ```

2. **Use HTTPS**
   - Add SSL certificates to Nginx
   - Update nginx.conf for HTTPS

3. **Restrict Network Access**
   ```yaml
   # In docker-compose.yml, remove port mappings for internal services
   mongodb:
     # ports:
     #   - "27017:27017"  # Comment out
   ```

4. **Use Docker Secrets**
   ```yaml
   secrets:
     mongo_password:
       file: ./secrets/mongo_password.txt
   ```

5. **Enable Firewall**
   ```bash
   # Only allow necessary ports
   ufw allow 80/tcp
   ufw allow 443/tcp
   ```

## 📊 Monitoring

### Container Stats
```bash
# Real-time stats
docker stats

# Export metrics
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### Logs Management
```bash
# Limit log size in docker-compose.yml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 🔄 Updates and Maintenance

### Update Application
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Backup Data
```bash
# Backup MongoDB
docker-compose exec mongodb mongodump --out /data/backup

# Copy backup from container
docker cp aegis-mongodb:/data/backup ./mongodb-backup-$(date +%Y%m%d)
```

### Clean Up
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Complete cleanup (⚠️ removes everything)
docker system prune -a --volumes
```

## 📝 Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_ROOT_USER` | admin | MongoDB root username |
| `MONGO_ROOT_PASSWORD` | aegis_secure_password | MongoDB root password |
| `MONGO_DB` | aegis_auth | MongoDB database name |
| `JWT_SECRET` | (required) | JWT signing secret (min 32 chars) |
| `JWT_EXPIRE` | 7d | JWT token expiration |
| `MODE` | static | Backend mode (static/demo/live) |
| `CORS_ALLOWED_ORIGINS` | localhost | Allowed CORS origins |

## 🆘 Support

For issues and questions:
- Check logs: `docker-compose logs -f`
- Review health: `docker-compose ps`
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)

## 📄 License

[Your License Here]
