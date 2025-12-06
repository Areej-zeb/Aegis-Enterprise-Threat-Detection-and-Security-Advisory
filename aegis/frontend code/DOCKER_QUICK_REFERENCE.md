# Docker Quick Reference

## 🚀 Quick Commands

### Start Everything
```bash
docker compose up -d
```

### Stop Everything
```bash
docker compose down
```

### View Logs
```bash
docker compose logs -f
```

### Rebuild After Changes
```bash
docker compose build --no-cache
docker compose up -d
```

### Check Status
```bash
docker compose ps
```

## 🔗 URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Backend Health**: http://localhost:8000/health

## 📝 Environment Setup

1. Copy `.env.example` to `.env`
2. Update MongoDB Atlas credentials
3. Generate JWT secret: `openssl rand -hex 32`

## 🐛 Common Issues

### Port Already in Use
```bash
# Change ports in docker-compose.yml
ports:
  - "5174:80"  # Frontend
  - "8001:8000"  # Backend
```

### MongoDB Connection Failed
- Check MongoDB Atlas credentials in `.env`
- Verify IP whitelist in MongoDB Atlas
- Ensure cluster is running

### Container Won't Start
```bash
# Check logs
docker compose logs auth-backend
docker compose logs frontend

# Restart
docker compose restart
```

## 🔄 Update Workflow

```bash
git pull
docker compose down
docker compose build
docker compose up -d
```

## 🧹 Cleanup

```bash
# Remove containers and networks
docker compose down

# Remove images too
docker compose down --rmi all

# Clean everything
docker system prune -a
```

## 📊 Monitoring

```bash
# Container stats
docker stats

# Health checks
curl http://localhost:8000/health
curl http://localhost:5173/health

# Inspect container
docker inspect aegis-frontend
```

## 🔒 Security Checklist

- [ ] Changed JWT_SECRET from default
- [ ] Using strong MongoDB password
- [ ] MongoDB Atlas IP whitelist configured
- [ ] `.env` file not committed to git
- [ ] HTTPS enabled (production)
- [ ] Regular security updates

## 📚 Full Documentation

See [DOCKER.md](DOCKER.md) for complete guide.
