# AEGIS System - Technical Description

## 1. System Overview

**Aegis** is a full-stack security monitoring dashboard for intrusion detection with real user authentication. It consists of two integrated microservices:

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Auth Backend** | Node.js/Express/MongoDB | JWT-based authentication & user management |
| **Dashboard Frontend** | React 18/Vite/TypeScript | Real-time threat visualization & monitoring |
| **IDS Backend** (Optional) | FastAPI/ML models | Threat detection via XGBoost/ensemble models |

---

## 2. Architecture

### 2.1 System Topology

```
┌─ Client Layer ─────────────────────────────────────┐
│  Browser (React SPA @ localhost:5173)              │
│  • React Router for client-side routing            │
│  • WebSocket for real-time alerts                  │
│  • REST API calls for data fetching               │
└────────────────────────────────────────────────────┘
          │ HTTP/WS
          ▼
┌─ API Gateway/Auth Layer ──────────────────────────┐
│  Auth Backend (Node.js @ localhost:8000)          │
│  • Express server with CORS enabled               │
│  • JWT token generation (7-day expiration)        │
│  • Bcrypt password hashing (12 salt rounds)       │
│  • Request/response validation                    │
└────────────────────────────────────────────────────┘
          │ HTTP
          ▼
┌─ Data Layer ──────────────────────────────────────┐
│  MongoDB (localhost:27017)                        │
│  • Collection: users (email, passwordHash)        │
│  • Email indexed for fast lookups                 │
│  • Automatic timestamps (createdAt)               │
└────────────────────────────────────────────────────┘

Optional:
┌─ Threat Detection Backend ────────────────────────┐
│  IDS Service (WebSocket @ localhost:8000/ws/*)   │
│  • Real-time alert streaming                     │
│  • ML model inference                             │
│  • System metrics collection                      │
└────────────────────────────────────────────────────┘
```

---

## 3. API Contracts

### 3.1 Authentication Endpoints

#### POST /auth/register
```
Request:
  {
    "email": "user@example.com",
    "password": "SecurePass123"
  }

Response (201):
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "createdAt": "2025-01-31T14:32:15Z"
    }
  }

Validation:
  • Email: RFC 5322 format
  • Password: ≥8 chars, 1 uppercase, 1 number
  • Email uniqueness enforced at DB level
```

#### POST /auth/login
```
Request:
  {
    "email": "user@example.com",
    "password": "SecurePass123"
  }

Response (200):
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "id": "...", "email": "..." }
  }

Error (401):
  {
    "success": false,
    "code": "invalid_credentials",
    "message": "Invalid email or password."
  }
```

#### GET /auth/me
```
Headers: Authorization: Bearer <token>

Response (200):
  {
    "success": true,
    "user": { "id": "...", "email": "...", "createdAt": "..." }
  }

Error (401): Missing or invalid token
```

---

### 3.2 Data Model Contracts

#### Alert Object
```typescript
interface Alert {
  id: string;              // UUID
  timestamp: string;       // ISO 8601
  src_ip: string;         // IPv4 address
  dst_ip: string;         // IPv4 address
  src_port: number;       // 0-65535
  dst_port: number;       // 0-65535
  protocol: string;       // "TCP", "UDP", "ICMP"
  attack_type: AttackType; // SYN_FLOOD | MITM_ARP | DNS_EXFILTRATION | BENIGN
  severity: Severity;     // low | medium | high | critical
  score: number;          // 0.0-1.0 (confidence)
  phase?: string;         // Attack phase (optional)
  label?: string;         // "attack" | "benign" (optional)
}
```

#### Metrics Object
```typescript
interface Metrics {
  total_alerts: number;
  active_alerts?: number;
  detection_rate?: number;        // 0-100 (%)
  avg_response_time?: number;     // milliseconds
  severity_distribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  attack_type_distribution: {
    SYN_FLOOD: number;
    MITM_ARP: number;
    DNS_EXFILTRATION: number;
    BENIGN: number;
  };
  total_flows?: number;
  time_range?: { from: string; to: string };
  last_updated?: string;
}
```

---

## 4. Database Schema

### MongoDB Collections

#### users
```json
{
  "_id": ObjectId,
  "email": String,           // Unique, lowercase, indexed
  "passwordHash": String,    // bcrypt hash ($2a$12$...)
  "createdAt": Date,         // Auto-set, indexed
  
  // Indexes:
  // { email: 1, unique: true }
  // { createdAt: 1 }
}
```

#### conversations (Future - Chat)
```json
{
  "_id": ObjectId,
  "userId": ObjectId,        // Reference to users
  "messages": [
    {
      "id": String,
      "timestamp": Date,
      "sender": "user" | "bot",
      "content": String,
      "intent"?: String,
      "entities"?: Array,
      "metadata"?: Object
    }
  ],
  "createdAt": Date,
  "updatedAt": Date,
  "isArchived": Boolean
}
```

---

## 5. Security Architecture

### 5.1 Authentication Flow

```
1. User Registration
   ├─ POST /auth/register with {email, password}
   ├─ Validate with express-validator
   ├─ Check email uniqueness in MongoDB
   ├─ Hash password: bcrypt.hash(password, 12)
   ├─ Save user: new User({email, passwordHash})
   └─ Return JWT token signed with HS256

2. User Login
   ├─ POST /auth/login with {email, password}
   ├─ Find user by email
   ├─ Compare: bcrypt.compare(password, hash)
   ├─ Sign JWT: jwt.sign({userId, email}, SECRET, {expiresIn: '7d'})
   └─ Return token

3. Authenticated Requests
   ├─ Browser stores token in localStorage
   ├─ Send: Authorization: Bearer <token>
   ├─ Middleware: jwt.verify(token, SECRET)
   ├─ Extract userId
   └─ Allow request

4. Token Expiry
   ├─ JWT expires after 7 days
   ├─ Frontend gets 401 Unauthorized
   ├─ Redirect to /login
   └─ User re-authenticates
```

### 5.2 Security Measures

| Layer | Implementation |
|-------|-----------------|
| **Password** | bcryptjs with 12 salt rounds (OWASP recommended) |
| **Tokens** | HS256 signed JWT with 7-day expiration |
| **Transport** | HTTPS (in production) |
| **CORS** | Restricted to localhost:5173 |
| **Input** | express-validator regex & length checks |
| **Database** | MongoDB connection URI in .env (never in code) |
| **Secrets** | JWT_SECRET generated with crypto.randomBytes(32) |

---

## 6. Frontend Architecture

### 6.1 React Component Hierarchy

```
App (Router)
├─ LoginPage
│  └─ AuthCardLayout
│     ├─ TextInput
│     ├─ PasswordInput
│     └─ PrimaryButton
├─ SignUpPage
│  └─ AuthCardLayout
│     ├─ TextInput
│     ├─ PasswordInput
│     ├─ PasswordStrengthBar
│     └─ PrimaryButton
└─ AppShell (Protected Routes)
   ├─ TopNav
   │  ├─ AegisLogo
   │  └─ UserMenu (Logout)
   └─ (Page Component)
      ├─ DashboardPage
      │  ├─ StatCard (KPI cards)
      │  ├─ ThreatsDetectedCard (Donut chart)
      │  ├─ AlertFrequencyChart (Line/bar chart)
      │  └─ RecentAlertCard (Alert items)
      ├─ LiveAlertsPage
      ├─ IDSPage
      ├─ MetricsPage
      ├─ SettingsPage
      └─ DetectionPage
```

### 6.2 State Management

```
Global Context (useAegisMode)
├─ isDarkMode: boolean
├─ userEmail?: string
├─ toggleMode(): void
└─ setUserEmail(email): void

Local State (Component hooks)
├─ useState for UI state (loading, errors, etc.)
├─ useEffect for data fetching
├─ useCallback for memoized functions
└─ useMemo for expensive calculations
```

### 6.3 Data Fetching Pattern

```javascript
// In DashboardPage.jsx
useEffect(() => {
  const loadData = async () => {
    try {
      // Try real API first
      const [metrics, alerts, health] = await Promise.all([
        getMetricsOverview(),        // GET /api/v1/overview
        fetchAlerts({page: 1}),      // GET /api/v1/alerts
        checkHealth()                 // GET /health
      ]);
      setState(data);
    } catch (err) {
      // Fallback to mock data
      const mockMetrics = generateMetricsOverview();
      const mockAlerts = generateRecentAlerts(4);
      setState(mockData);
    }
  };
  loadData();
}, []);
```

---

## 7. Key Technologies & Rationale

| Technology | Why |
|-----------|-----|
| **Express** | Lightweight, well-documented, perfect for REST APIs |
| **MongoDB** | NoSQL flexibility, easy scaling, JSON-like documents |
| **JWT** | Stateless auth, no server-side sessions, ideal for SPAs |
| **bcryptjs** | Industry-standard password hashing, slow-by-design |
| **React 18** | Component-based, large ecosystem, excellent for dashboards |
| **Vite** | Lightning-fast dev server, modern ES modules, HMR |
| **Recharts** | React-native charts, responsive, accessible |
| **TypeScript** | Type safety for complex data structures |
| **Lucide React** | Modern, customizable icons, tree-shakeable |

---

## 8. Data Flow Examples

### 8.1 User Registration Flow

```
User Input (UI)
    ↓
validatePassword() [8+ chars, 1 uppercase, 1 number]
    ↓ (Valid)
POST /auth/register {email, password}
    ↓
Express middleware [CORS, JSON parser]
    ↓
Route handler /auth/register
    ├─ express-validator checks
    ├─ Check user exists: User.findOne({email})
    ├─ Hash password: bcrypt.hash(password, 12)
    ├─ Save: new User({email, passwordHash}).save()
    └─ Sign JWT: jwt.sign({userId, email}, SECRET, {expiresIn: '7d'})
    ↓
Response: {success: true, token, user}
    ↓
Frontend [useAuthStore]
    ├─ localStorage.setItem('token', token)
    ├─ localStorage.setItem('user', JSON.stringify(user))
    └─ Navigate to /dashboard
    ↓
AppShell verifies token and renders DashboardPage
```

### 8.2 Alert Display Flow

```
User navigates to DashboardPage
    ↓
useEffect hook triggers
    ↓
fetchAlerts() calls GET /api/v1/alerts
    ↓
Backend queries Aegis IDS API
    ↓
Response: { alerts: [Alert, Alert, ...] }
    ↓
Frontend processes:
  ├─ Group by severity (high, medium, low)
  ├─ Sort by timestamp (newest first)
  ├─ Calculate metrics
  └─ Map attack_type to display names
    ↓
useState(alerts) updates
    ↓
Component re-renders
    ├─ RecentAlertCard x 4 (recent alerts)
    ├─ ThreatsDetectedCard (Donut chart with counts)
    └─ AlertFrequencyChart (Trend over time)
    ↓
User sees dashboard with live data
```

---

## 9. Error Handling

### Frontend
```typescript
try {
  const data = await fetchAlerts();
  setAlerts(data);
} catch (error) {
  setError(error.message);
  // Fallback to mock data
  setAlerts(generateRecentAlerts());
}
```

### Backend
```javascript
// Middleware error handler (last in chain)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    code: err.code || 'internal_error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

---

## 10. Performance Considerations

| Aspect | Approach |
|--------|----------|
| **JWT Tokens** | No database lookup on each request (stateless) |
| **Email Lookups** | MongoDB index on email field (O(log n)) |
| **Password Hashing** | Bcrypt deliberately slow (prevent brute force) |
| **API Caching** | Frontend stores alerts in useState, no polling |
| **Bundle Size** | Vite tree-shaking removes unused code |
| **Re-renders** | useCallback/useMemo prevent unnecessary updates |
| **Database** | MongoDB indexes on frequently queried fields |

---

## 11. Deployment Architecture

### Development
```bash
# Terminal 1: Auth Backend
cd auth-backend
npm run dev    # node --watch server.js

# Terminal 2: Frontend
cd aegis-dashboard
npm run dev    # vite dev server on port 5173

# Terminal 3: MongoDB
mongod         # or: brew services start mongodb-community
```

### Production
```bash
# Backend
npm run build  # (if TypeScript)
npm start      # node server.js

# Frontend
npm run build  # Creates dist/ folder with optimized bundle
# Serve dist/ via CDN + compress with gzip
```

### Docker Compose
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    ports: ["27017:27017"]
    volumes: ["mongo_data:/data/db"]
  
  auth-backend:
    build: ./auth-backend
    ports: ["8000:8000"]
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/aegis_auth
      - JWT_SECRET=${JWT_SECRET}
    depends_on: [mongodb]
  
  frontend:
    build: ./aegis-dashboard
    ports: ["5173:5173"]
    environment:
      - VITE_AEGIS_API_BASE_URL=http://auth-backend:8000
```

---

## 12. Key Type Definitions

```typescript
// Single source of truth for attack types
type AttackType = "SYN_FLOOD" | "MITM_ARP" | "DNS_EXFILTRATION" | "BENIGN"
type Severity = "low" | "medium" | "high" | "critical"

// API response envelope
interface ApiEnvelope<T> {
  data: T | null;
  error: { code: string; message: string } | null;
  meta?: any;
}

// JWT payload
interface JwtPayload {
  userId: ObjectId;
  email: string;
  iat: number;     // Issued at
  exp: number;     // Expiration time
}

// Model status
interface ModelStatus {
  name: string;     // "syn_xgb", "mitm_xgb", "dns_ensemble"
  loaded: boolean;
  f1_score?: number;
  accuracy?: number;
}
```

---

## 13. Integration Points

### Backend → Frontend
- REST API: `/api/v1/alerts`, `/api/v1/overview`, etc.
- WebSocket: `ws://localhost:8000/ws/alerts` (optional real-time)

### Frontend → Backend
- HTTP GET/POST calls with Bearer token in Authorization header
- localStorage for token persistence across page reloads

### Backend → Database
- Mongoose ODM for type-safe queries
- Connection pooling via Mongoose

### Frontend → Aegis IDS (Optional)
- Calls IDS backend for real threat data
- Falls back to mock data if unavailable

---

## 14. Configuration

### Environment Variables

**Backend (.env)**
```
MONGODB_URI=mongodb://127.0.0.1:27017/aegis_auth
JWT_SECRET=your-random-string-generated-with-crypto.randomBytes(32).toString('hex')
PORT=8000
NODE_ENV=development
```

**Frontend (.env.local)**
```
VITE_AEGIS_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
```

---

## 15. Testing Strategy

| Layer | Approach |
|-------|----------|
| **Backend Auth** | Jest + Supertest for API endpoints |
| **Password Hashing** | Unit tests for bcrypt functionality |
| **Frontend Components** | React Testing Library for component logic |
| **API Integration** | Mocking with MSW (Mock Service Worker) |
| **E2E** | Cypress for full user workflows |
| **Security** | OWASP Top 10 checklist |

---

## 16. Monitoring & Debugging

### Backend
```javascript
// Console logs with timestamps
console.log(`✓ Server running on http://localhost:${PORT}`);
console.error(`✗ Error: ${error.message}`);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

### Frontend
```typescript
// Browser DevTools
// - Network tab: Monitor API calls
// - Console: Check for errors
// - React DevTools: Inspect component state
// - Redux DevTools: (if used) trace state changes

// Custom logging
console.log('[DashboardPage] Loading metrics...');
console.error('[API] Failed to fetch alerts:', error);
```

---

## Summary

**Aegis** is a production-ready security dashboard that combines:
- **Secure authentication** (bcrypt + JWT)
- **Real-time threat visualization** (React + Recharts)
- **Scalable backend** (Node.js + MongoDB)
- **Responsive design** (Mobile, tablet, desktop)
- **Optional integration** with ML-based IDS

The architecture supports easy extension with chatbot, webhooks, and advanced analytics.

