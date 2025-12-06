# Quick Start Guide

Get Aegis Dashboard running with authentication in 5 minutes.

## Prerequisites
- Node.js v18+ installed
- MongoDB running locally (see [SETUP.md](SETUP.md) for installation)

## Steps

### 1. Start MongoDB
```bash
# Verify MongoDB is running
mongosh
# If it connects, you're good! Press Ctrl+C to exit
```

### 2. Start Backend (Terminal 1)
```bash
cd auth-backend
npm install
npm run dev
```

Wait for:
```
✓ MongoDB connected: 127.0.0.1
✓ Server running on http://localhost:8000
```

### 3. Test Backend (Optional)
Open a new terminal:
```bash
cd auth-backend
npm test
```

### 4. Start Frontend (Terminal 2)
```bash
cd aegis-dashboard
npm install
npm run dev
```

### 5. Open Browser
Go to: http://localhost:5173

### 6. Create Account
1. Click "Create one" on login page
2. Enter email and password (min 8 chars, 1 uppercase, 1 number)
3. Click "Create Account"
4. You're in! 🎉

### 7. Test Login/Logout
- Click "Logout" button in sidebar
- Login again with your credentials
- Try wrong password - it should fail ✓

## Troubleshooting

**MongoDB not running?**
```bash
# Windows: Check Services app for "MongoDB"
# Mac: brew services start mongodb-community
# Linux: sudo systemctl start mongodb
```

**Port 8000 in use?**
- Edit `auth-backend/.env` and change `PORT=8080`
- Edit `aegis-dashboard/.env.local` and change URL to `:8080`

**Need help?** See [SETUP.md](SETUP.md) for detailed instructions.
