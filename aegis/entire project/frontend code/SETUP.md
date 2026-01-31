# Aegis Dashboard - Complete Setup Guide

This guide will help you set up the complete Aegis Dashboard with MongoDB authentication.

## Prerequisites

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **MongoDB** (local or Atlas) - See installation below
3. **Git** (optional)

---

## Part 1: Install and Start MongoDB

### Option A: Local MongoDB

#### Windows
1. Download MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Run the installer (choose "Complete" installation)
3. MongoDB will run as a Windows service automatically
4. Verify it's running:
   ```cmd
   mongosh
   ```
   You should see a MongoDB shell prompt.

#### macOS (with Homebrew)
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

Verify:
```bash
mongosh
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

Verify:
```bash
mongosh
```

### Option B: MongoDB Atlas (Cloud)

1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster (free tier available)
3. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/aegis_auth`)
4. Use this in your `.env` file instead of the local connection string

---

## Part 2: Setup Authentication Backend

### 1. Navigate to backend folder
```bash
cd auth-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create environment file
```bash
# Windows (cmd)
copy .env.example .env

# Windows (PowerShell)
cp .env.example .env

# macOS/Linux
cp .env.example .env
```

### 4. Edit `.env` file

Open `auth-backend/.env` and configure:

```env
# For local MongoDB:
MONGODB_URI=mongodb://127.0.0.1:27017/aegis_auth

# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aegis_auth

# Generate a secure JWT secret (run this command):
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-generated-secret-here

PORT=8000
```

**Important:** Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and paste it as your `JWT_SECRET`.

### 5. Start the backend server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

You should see:
```
✓ MongoDB connected: 127.0.0.1
✓ Database: aegis_auth
✓ Server running on http://localhost:8000
✓ Health check: http://localhost:8000/health
✓ Auth endpoints: http://localhost:8000/auth/*
```

### 6. Test the backend (optional)

Open a new terminal and test:
```bash
curl http://localhost:8000/health
```

You should get:
```json
{"success":true,"message":"Aegis Auth Backend is running","timestamp":"..."}
```

---

## Part 3: Setup Frontend

### 1. Navigate to frontend folder
```bash
cd aegis-dashboard
```

### 2. Install dependencies
```bash
npm install
```

### 3. Verify environment configuration

Check that `aegis-dashboard/.env.local` contains:
```env
VITE_AEGIS_API_BASE_URL=http://localhost:8000
```

This should already be set correctly.

### 4. Start the frontend
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

---

## Part 4: Test the Complete System

### 1. Open your browser
Navigate to: http://localhost:5173

### 2. Create an account
1. Click "Create one" on the login page
2. Enter an email and password
   - Password must be at least 8 characters
   - Must contain at least one uppercase letter
   - Must contain at least one number
3. Click "Create Account"
4. You should be redirected to the dashboard

### 3. Test logout
1. Click the "Logout" button in the sidebar
2. You should be redirected to the login page

### 4. Test login
1. Enter the email and password you just created
2. Click "Sign In"
3. You should be redirected to the dashboard

### 5. Test invalid credentials
1. Try logging in with wrong password
2. You should see an error: "Invalid email or password"
3. The login should NOT succeed

---

## Running Both Servers

You need **two terminal windows**:

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

---

## Troubleshooting

### MongoDB Connection Failed
- **Check if MongoDB is running:**
  ```bash
  mongosh
  ```
- **Windows:** Check if MongoDB service is running in Services app
- **macOS/Linux:** 
  ```bash
  sudo systemctl status mongodb
  ```

### Port Already in Use
- **Backend (8000):** Change `PORT` in `auth-backend/.env` to `8080` or another port
- **Frontend (5173):** Vite will automatically try the next available port
- **Remember:** If you change backend port, update `VITE_AEGIS_API_BASE_URL` in `aegis-dashboard/.env.local`

### CORS Errors
- Make sure backend is running on `http://localhost:8000`
- Make sure frontend is running on `http://localhost:5173`
- Check browser console for specific error messages

### "Invalid email or password" on valid credentials
- Check that MongoDB is running
- Check backend terminal for errors
- Verify you're using the correct email/password
- Try registering a new account

### Frontend can't connect to backend
- Verify backend is running: `curl http://localhost:8000/health`
- Check `VITE_AEGIS_API_BASE_URL` in `aegis-dashboard/.env.local`
- Restart frontend after changing `.env.local`

---

## Project Structure

```
AegisFrontend/
├── auth-backend/              # Authentication backend
│   ├── config/
│   │   └── database.js        # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js            # JWT verification
│   │   └── errorHandler.js    # Error handling
│   ├── models/
│   │   └── User.js            # User schema
│   ├── routes/
│   │   └── auth.js            # Auth endpoints
│   ├── .env                   # Environment config (create this)
│   ├── .env.example           # Example environment config
│   ├── package.json
│   ├── README.md              # Backend documentation
│   └── server.js              # Main server file
│
└── aegis-dashboard/           # React frontend
    ├── src/
    │   ├── pages/
    │   │   ├── LoginPage.jsx      # Login with real auth
    │   │   └── SignUpPage.jsx     # Registration with real auth
    │   ├── utils/
    │   │   └── authService.js     # Auth API client
    │   └── ...
    ├── .env.local             # Frontend environment config
    └── package.json
```

---

## Security Notes

- Passwords are hashed with bcrypt (12 salt rounds)
- JWT tokens expire after 7 days
- Tokens are stored in localStorage
- Never commit `.env` files to version control
- Use strong JWT secrets in production
- Consider using httpOnly cookies for tokens in production

---

## Next Steps

- Add password reset functionality
- Add email verification
- Add refresh tokens
- Add rate limiting
- Add session management
- Deploy to production

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review `auth-backend/README.md` for backend details
3. Check browser console and terminal logs for errors
