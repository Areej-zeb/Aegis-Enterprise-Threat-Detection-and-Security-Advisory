# Aegis Auth Backend

Node.js + Express + MongoDB authentication backend for the Aegis Dashboard.

## Features

- User registration with email and password
- Secure password hashing with bcrypt (12 salt rounds)
- JWT-based authentication
- Protected routes with token verification
- Input validation and error handling
- CORS enabled for frontend integration

## Prerequisites

1. **Node.js** (v18 or higher)
2. **MongoDB** (local or Atlas)

### Installing MongoDB Locally

**Windows:**
- Download from: https://www.mongodb.com/try/download/community
- Install and run as a service, or manually start with: `mongod`

**macOS (with Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

Verify MongoDB is running:
```bash
mongosh
# or
mongo
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd auth-backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `auth-backend` directory:

```bash
cp .env.example .env
```

Edit `.env` and set your values:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/aegis_auth
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=8000
```

**Important:** Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:8000`

## API Endpoints

### Health Check
```
GET /health
```
Returns server status.

### Register User
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one number

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (409):**
```json
{
  "success": false,
  "message": "Email already registered"
}
```

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Get Current User (Protected)
```
GET /auth/me
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Testing the Backend

### Using curl:

**Register:**
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"TestPass123\"}"
```

**Login:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"TestPass123\"}"
```

**Get User (replace TOKEN):**
```bash
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Project Structure

```
auth-backend/
├── config/
│   └── database.js       # MongoDB connection
├── middleware/
│   ├── auth.js           # JWT verification middleware
│   └── errorHandler.js   # Global error handler
├── models/
│   └── User.js           # User schema
├── routes/
│   └── auth.js           # Auth endpoints
├── .env                  # Environment variables (create this)
├── .env.example          # Example environment variables
├── .gitignore
├── package.json
├── README.md
└── server.js             # Main application entry
```

## Security Notes

- Passwords are hashed with bcrypt (12 salt rounds)
- JWT tokens expire after 7 days
- Email addresses are stored in lowercase
- Input validation on all endpoints
- CORS configured for frontend origin only
- Never commit `.env` file to version control

## Troubleshooting

**MongoDB connection failed:**
- Ensure MongoDB is running: `mongosh` or `mongo`
- Check MONGODB_URI in `.env`
- For Windows, check MongoDB service is started

**Port already in use:**
- Change PORT in `.env` to another value (e.g., 8080)
- Update `VITE_AEGIS_API_BASE_URL` in frontend `.env.local`

**JWT errors:**
- Ensure JWT_SECRET is set in `.env`
- Token may have expired (7 day expiry)
