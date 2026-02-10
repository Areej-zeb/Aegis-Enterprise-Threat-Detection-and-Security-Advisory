# Aegis Authentication Backend

Node.js/Express backend for user authentication with MongoDB Atlas.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   - Copy `.env.example` to `.env` (or create `.env` manually)
   - The `.env` file should contain:
     ```

3. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

The server will run on `http://localhost:5000`

## API Endpoints

### POST `/api/auth/signup`
Register a new user.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "Signup successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### POST `/api/auth/login`
Login with email and password.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

## Database

- **Database:** `aegis`
- **Collection:** `users`

Users are stored with:
- `name` (String, required)
- `email` (String, required, unique)
- `password` (String, hashed with bcrypt)
- `createdAt` and `updatedAt` (automatic timestamps)

## Security

- Passwords are hashed using bcrypt (10 rounds)
- JWT tokens expire after 7 days
- CORS enabled for frontend communication
- Environment variables for sensitive data

## Fallback Admin Account

For emergency access when the database is unavailable, a hardcoded fallback account is available:

- **Email:** `admin@aegis.local`
- **Password:** `admin123`

⚠️ **Note:** This is for development/emergency use only. In production, consider removing or securing this fallback account.

