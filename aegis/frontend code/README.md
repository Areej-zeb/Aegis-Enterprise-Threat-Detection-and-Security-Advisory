# Aegis Frontend - Security Dashboard with Authentication

A modern, full-stack security dashboard for the Aegis Intrusion Detection System (IDS). Features real authentication with MongoDB, JWT tokens, and a responsive React interface for real-time threat monitoring.

## 🚀 Quick Start

**Get up and running in 5 minutes:**

1. **Start MongoDB** (must be running)
   ```bash
   mongosh  # Verify it's running
   ```

2. **Start Backend** (Terminal 1)
   ```bash
   cd auth-backend
   npm install
   npm run dev
   ```

3. **Start Frontend** (Terminal 2)
   ```bash
   cd aegis-dashboard
   npm install
   npm run dev
   ```

4. **Open Browser**: http://localhost:5173
5. **Create Account** and start monitoring threats!

📖 **Need help?** See [QUICKSTART.md](QUICKSTART.md) for detailed steps.

---

## 📁 Project Structure

```
AegisFrontend/
├── auth-backend/              # Node.js + Express + MongoDB authentication
│   ├── config/                # Database configuration
│   ├── middleware/            # JWT auth & error handling
│   ├── models/                # User schema
│   ├── routes/                # Auth endpoints (register, login, /me)
│   ├── .env                   # Environment config (create from .env.example)
│   ├── server.js              # Main server
│   └── README.md              # Backend documentation
│
├── aegis-dashboard/           # React + Vite frontend
│   ├── src/
│   │   ├── api/               # API client
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components (Login, Dashboard, etc.)
│   │   ├── utils/             # Auth service & utilities
│   │   └── App.jsx            # Main app with routing
│   ├── .env.local             # Frontend config (API URL)
│   └── README.md              # Frontend documentation
│
├── QUICKSTART.md              # 5-minute setup guide
├── SETUP.md                   # Detailed setup instructions
└── README.md                  # This file
```

---

## ✨ Features

### 🔐 Authentication System
- **Real User Authentication**: MongoDB-backed registration and login
- **Secure Passwords**: Bcrypt hashing (12 salt rounds)
- **JWT Tokens**: 7-day expiration with Bearer authentication
- **Protected Routes**: Dashboard requires valid login
- **Session Management**: Logout and token validation

### 🎯 Security Dashboard
- **Real-time Threat Detection**: Monitor 5 critical cyberattacks
  - SYN Flood, ARP MITM, Brute-force, DNS exfiltration, L7 anomalies
- **Live Alerts Feed**: Auto-refreshing with filtering and search
- **IDS Analytics**: Multi-tab interface with threat intelligence
- **Interactive Charts**: KPIs, trends, and distributions
- **Settings Management**: Alerts, notifications, integrations

### 📱 Responsive Design
- Desktop, tablet, and mobile optimized
- Touch-friendly mobile menu
- Card views on small screens
- Dark SaaS aesthetic with neon accents

---

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express** - REST API server
- **MongoDB** + **Mongoose** - User database
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **express-validator** - Input validation

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool with HMR
- **React Router** - Client-side routing
- **Recharts** - Data visualization
- **Lucide React** - Icons

---

## 📋 Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **MongoDB** (local or Atlas)
  - Windows: [Download MongoDB Community](https://www.mongodb.com/try/download/community)
  - macOS: `brew install mongodb-community`
  - Linux: `sudo apt-get install mongodb`

---

## 🔧 Setup Instructions

### Option 1: Quick Start (Recommended)
Follow [QUICKSTART.md](QUICKSTART.md) for a 5-minute setup.

### Option 2: Detailed Setup
Follow [SETUP.md](SETUP.md) for comprehensive instructions including:
- MongoDB installation for all platforms
- Environment configuration
- Testing procedures
- Troubleshooting guide

### Option 3: Manual Setup

#### 1. Setup Backend
```bash
cd auth-backend
npm install

# Create .env file
cp .env.example .env

# Edit .env and set:
# - MONGODB_URI (e.g., mongodb://127.0.0.1:27017/aegis_auth)
# - JWT_SECRET (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
# - PORT (default: 8000)

# Start server
npm run dev
```

#### 2. Setup Frontend
```bash
cd aegis-dashboard
npm install

# Verify .env.local contains:
# VITE_AEGIS_API_BASE_URL=http://localhost:8000

# Start dev server
npm run dev
```

#### 3. Access Dashboard
- Open http://localhost:5173
- Click "Create one" to register
- Login and explore!

---

## 🧪 Testing

### Test Backend API
```bash
cd auth-backend
npm test
```

This runs automated tests for:
- Health check endpoint
- User registration
- User login
- Protected routes
- Invalid credentials

### Manual Testing
1. Register a new user
2. Logout
3. Login with correct credentials ✓
4. Try wrong password (should fail) ✓

---

## 🔑 API Endpoints

### Authentication Backend (Port 8000)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Health check | No |
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| GET | `/auth/me` | Get current user | Yes (JWT) |

**Example Registration:**
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123"}'
```

**Example Login:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123"}'
```

See [auth-backend/README.md](auth-backend/README.md) for complete API documentation.

---

## 🎨 Frontend Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Redirect | Redirects to `/login` |
| `/login` | Login | User authentication |
| `/signup` | Sign Up | User registration |
| `/dashboard` | Dashboard | Main KPI overview |
| `/ids` | IDS Analytics | 5-tab threat analysis |
| `/settings` | Settings | System configuration |

---

## 🔒 Security Features

- ✅ Passwords hashed with bcrypt (12 salt rounds)
- ✅ JWT tokens with 7-day expiration
- ✅ Input validation on all endpoints
- ✅ CORS configured for frontend origin
- ✅ Protected routes require authentication
- ✅ Email uniqueness enforced
- ✅ Password strength requirements (8+ chars, uppercase, number)

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
mongosh

# Windows: Check Services app for "MongoDB"
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongodb
```

### Port Already in Use
- Backend (8000): Change `PORT` in `auth-backend/.env`
- Frontend (5173): Vite will auto-select next port
- Update `VITE_AEGIS_API_BASE_URL` if backend port changes

### CORS Errors
- Ensure backend runs on `http://localhost:8000`
- Ensure frontend runs on `http://localhost:5173`
- Check browser console for details

### Login Not Working
- Verify backend is running: `curl http://localhost:8000/health`
- Check MongoDB is connected (backend logs)
- Ensure you registered the account first
- Check browser console for errors

**More help:** See [SETUP.md](SETUP.md) troubleshooting section.

---

## 📚 Documentation

- [QUICKSTART.md](QUICKSTART.md) - Get started in 5 minutes
- [SETUP.md](SETUP.md) - Comprehensive setup guide
- [auth-backend/README.md](auth-backend/README.md) - Backend API documentation
- [aegis-dashboard/README.md](aegis-dashboard/README.md) - Frontend documentation

---

## 🚀 Development

### Running Both Servers
You need **two terminals**:

**Terminal 1 - Backend:**
```bash
cd auth-backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd aegis-dashboard
npm run dev
```

### Available Scripts

**Backend:**
- `npm start` - Production mode
- `npm run dev` - Development with auto-reload
- `npm test` - Run API tests

**Frontend:**
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

---

## 🌐 Production Deployment

### Backend
1. Set strong `JWT_SECRET` in production `.env`
2. Use MongoDB Atlas or secure MongoDB instance
3. Enable HTTPS
4. Configure production CORS origins
5. Add rate limiting
6. Set up monitoring and logging

### Frontend
1. Build: `npm run build`
2. Deploy `dist/` folder to hosting service
3. Update `VITE_AEGIS_API_BASE_URL` to production backend URL
4. Enable HTTPS
5. Configure CDN for static assets

---

## 🤝 Contributing

When adding features:
1. Follow existing code structure
2. Maintain responsive design
3. Test authentication flows
4. Update documentation
5. Ensure no security vulnerabilities

---

## 📝 License

[Your License Here]

---

## 🎯 Next Steps

- [ ] Add password reset functionality
- [ ] Implement email verification
- [ ] Add refresh tokens
- [ ] Add rate limiting
- [ ] Add session management UI
- [ ] Implement 2FA
- [ ] Add user profile management
- [ ] Deploy to production

---

## 💡 Support

- **Issues**: Check [SETUP.md](SETUP.md) troubleshooting section
- **Backend API**: See [auth-backend/README.md](auth-backend/README.md)
- **Frontend**: See [aegis-dashboard/README.md](aegis-dashboard/README.md)
- **Quick Start**: See [QUICKSTART.md](QUICKSTART.md)

---

**Built with ❤️ for secure threat monitoring**
