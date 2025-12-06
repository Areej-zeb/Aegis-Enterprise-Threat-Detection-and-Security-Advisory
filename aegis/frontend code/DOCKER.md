# Docker Deployment Guide

Complete guide for running the Aegis Dashboard with Docker and Docker Compose.

## 📋 Prerequisites

- **Docker** (v20.10+) - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (v2.0+) - Usually included with Docker Desktop
- **MongoDB Atlas** account with valid credentials

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd AegisFrontend
```

### 2. Configure Environment Variables

Create a `.env` file in the project root (or use the existing one):

```bash
cp .env.example .env
```

Edit `.env` with your MongoDB Atlas credentials:

```env
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/?appName=Cluster0
JWT_SECRET=your-super-secret-jwt-key-here
PORT=8000
```

**Important:** 
- Replace MongoDB credentials with your actual Atlas credentials
- Generate a strong JWT secret: `openssl rand -hex 32`

### 3. Build and Run

Build the Docker images:
```bash
docker compose build
```

Start the services:
```bash
docker compose up -d
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Backend Health**: http://localhost:8000/health

### 5. Create Your First Account

1. Open http://localhost:5173
2. Click "Create one" to register
3. Enter email and password (min 8 chars, 1 uppercase, 1 number)
4. Login and start using the dashboard!

## 🛠️ Docker Commands

### View Running Containers
```bash
docker compose ps
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f frontend
docker compose logs -f auth-backend
```

### Stop Services
```bash
docker compose stop
```

### Start Services
```bash
docker compose start
```

### Restart Services
```bash
docker compose restart
```

### Stop and Remove Containers
```bash
docker compose down
```

### Rebuild After Code Changes
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

## 📦 Services

### Auth Backend
- **Container**: `aegis-auth-backend`
- **Port**: 8000
- **Image**: Built from `./auth-backend/Dockerfile`
- **Base**: `node:20-alpine`
- **Health Check**: `/health` endpoint

### Frontend
- **Container**: `aegis-frontend`
- **Port**: 5173 (mapped to container port 80)
- **Image**: Built from `./aegis-dashboard/Dockerfile`
- **Base**: `nginx:alpine`
- **Serves**: Static React build

## 🔧 Configuration

### Environment Variables

#### Backend (auth-backend)
- `MONGODB_URI`: MongoDB Atlas connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `PORT`: Backend server port (default: 8000)
- `NODE_ENV`: Environment mode (production)

#### Frontend (aegis-dashboard)
- `VITE_AEGIS_API_BASE_URL`: Backend API URL (set at build time)

### Ports

| Service | Container Port | Host Port | Description |
|---------|---------------|-----------|-------------|
| auth-backend | 8000 | 8000 | Backend API |
| frontend | 80 | 5173 | Frontend UI |

### Networks

All services run on the `aegis-network` bridge network, allowing inter-service communication.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Host                          │
│                                                         │
│  ┌──────────────────┐         ┌──────────────────┐    │
│  │   Frontend       │         │   Auth Backend   │    │
│  │   (Nginx)        │────────▶│   (Node.js)      │    │
│  │   Port: 5173     │         │   Port: 8000     │    │
│  └──────────────────┘         └──────────────────┘    │
│                                        │               │
└────────────────────────────────────────┼───────────────┘
                                         │
                                         ▼
                              ┌──────────────────┐
                              │  MongoDB Atlas   │
                              │  (External)      │
                              └──────────────────┘
```

## 🐛 Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker compose logs auth-backend
docker compose logs frontend
```

**Common issues:**
- MongoDB Atlas credentials invalid
- Port 8000 or 5173 already in use
- Insufficient Docker resources

### MongoDB Connection Failed

**Symptoms:**
- Backend health check fails
- Login/registration doesn't work

**Solutions:**
1. Verify MongoDB Atlas credentials in `.env`
2. Check MongoDB Atlas network access (allow your IP)
3. Ensure MongoDB Atlas cluster is running
4. Test connection string manually

### Frontend Can't Reach Backend

**Symptoms:**
- Login fails with "Unable to reach the server"
- Network errors in browser console

**Solutions:**
1. Ensure backend is running: `docker compose ps`
2. Check backend health: `curl http://localhost:8000/health`
3. Verify `VITE_AEGIS_API_BASE_URL` in frontend build
4. Rebuild frontend: `docker compose build frontend`

### Port Already in Use

**Error:** `Bind for 0.0.0.0:8000 failed: port is already allocated`

**Solution:**
```bash
# Find process using the port
# Windows
netstat -ano | findstr :8000

# macOS/Linux
lsof -i :8000

# Kill the process or change port in docker-compose.yml
```

### Permission Denied

**Linux users may need:**
```bash
sudo docker compose up -d
```

Or add your user to the docker group:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

## 🔒 Security Notes

### Production Deployment

1. **Change JWT Secret**: Generate a strong random secret
   ```bash
   openssl rand -hex 32
   ```

2. **Use Environment Variables**: Never commit `.env` to version control

3. **Enable HTTPS**: Use a reverse proxy (nginx, Caddy, Traefik)

4. **Update Dependencies**: Regularly update Docker images
   ```bash
   docker compose pull
   docker compose up -d
   ```

5. **Limit Network Access**: Configure MongoDB Atlas IP whitelist

6. **Use Docker Secrets**: For sensitive data in production
   ```yaml
   secrets:
     jwt_secret:
       external: true
   ```

## 📊 Monitoring

### Health Checks

Both services have built-in health checks:

```bash
# Check backend health
curl http://localhost:8000/health

# Check frontend health
curl http://localhost:5173/health
```

### Container Stats

```bash
docker stats aegis-frontend aegis-auth-backend
```

### Inspect Containers

```bash
docker inspect aegis-frontend
docker inspect aegis-auth-backend
```

## 🔄 Updates and Maintenance

### Update Application Code

1. Pull latest changes
2. Rebuild containers
3. Restart services

```bash
git pull
docker compose build
docker compose up -d
```

### Update Base Images

```bash
docker compose pull
docker compose up -d --build
```

### Clean Up

Remove unused images and containers:
```bash
docker system prune -a
```

## 📝 Development vs Production

### Development
- Use `docker-compose.override.yml` for dev-specific config
- Mount volumes for hot-reload
- Enable debug logging

### Production
- Use production-ready base images
- Minimize image size
- Enable security headers
- Use orchestration (Kubernetes, Docker Swarm)
- Implement proper logging and monitoring

## 🆘 Support

For issues or questions:
1. Check logs: `docker compose logs -f`
2. Review [SETUP.md](SETUP.md) for detailed setup
3. Check [README.md](README.md) for application docs
4. Verify MongoDB Atlas connectivity

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
