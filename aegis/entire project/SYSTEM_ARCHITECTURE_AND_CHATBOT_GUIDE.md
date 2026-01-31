# AEGIS System - Complete Architecture, Features & Chatbot Integration Guide

## Executive Summary

**Aegis** is a modern, full-stack **Security Dashboard** with real authentication that monitors network threats in real-time. It consists of:
- **Frontend**: React 18 + Vite dashboard with responsive design
- **Backend**: Node.js + Express + MongoDB authentication system
- **Purpose**: Detect and display 5 types of cyber attacks (SYN Flood, ARP MITM, DNS Exfiltration, Brute-force, L7 Anomalies)

This document provides:
1. Complete architecture overview
2. All existing features and functionalities
3. Detailed chatbot integration strategy
4. Code structure breakdown

---

# PART 1: SYSTEM ARCHITECTURE

## 1.1 Project Structure

```
aegis/
├── frontend code/
│   ├── auth-backend/              # Node.js authentication microservice
│   │   ├── config/
│   │   │   └── database.js        # MongoDB connection
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verification
│   │   │   └── errorHandler.js    # Centralized error handling
│   │   ├── models/
│   │   │   └── User.js            # MongoDB User schema
│   │   ├── routes/
│   │   │   └── auth.js            # Auth endpoints (register, login, /me)
│   │   ├── server.js              # Express server entry point
│   │   ├── .env                   # Configuration (MONGODB_URI, JWT_SECRET, PORT)
│   │   └── package.json           # 117 packages with Express, Mongoose, JWT, bcrypt
│   │
│   ├── aegis-dashboard/           # React + Vite frontend (SPA)
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   ├── aegisClient.ts # Type-safe API client for Aegis IDS
│   │   │   │   └── mock.js        # Mock data fallback
│   │   │   │
│   │   │   ├── components/        # Reusable UI components
│   │   │   │   ├── alerts/        # Alert display components
│   │   │   │   ├── buttons/       # Buttons (Primary, etc.)
│   │   │   │   ├── cards/         # Card containers (Metrics, Threats)
│   │   │   │   ├── charts/        # Data visualizations (Recharts)
│   │   │   │   ├── common/        # Shared components (Badges, Pills, Headers)
│   │   │   │   ├── feedback/      # UI feedback (Password strength, labels)
│   │   │   │   ├── form/          # Form inputs (TextInput, CheckboxWithText)
│   │   │   │   ├── ids/           # IDS-specific components
│   │   │   │   └── layout/        # Layout wrappers (AppShell, TopNav, Auth)
│   │   │   │
│   │   │   ├── pages/             # Full-page components
│   │   │   │   ├── LoginPage.jsx  # Authentication entry
│   │   │   │   ├── SignUpPage.jsx # Registration
│   │   │   │   ├── DashboardPage.jsx    # Main dashboard (KPIs, alerts, charts)
│   │   │   │   ├── IDSPage.jsx         # IDS-specific interface
│   │   │   │   ├── DetectionPage.jsx   # Detection details
│   │   │   │   ├── LiveAlertsPage.jsx  # Real-time alerts stream
│   │   │   │   ├── MetricsPage.jsx     # Performance metrics
│   │   │   │   ├── SettingsPage.tsx    # User settings & integrations
│   │   │   │   └── NotFoundPage.tsx    # 404 fallback
│   │   │   │
│   │   │   ├── utils/             # Utility functions
│   │   │   │   ├── authService.js       # Auth token management
│   │   │   │   ├── mockDataGenerator.ts # Generate synthetic alerts/metrics
│   │   │   │   ├── formatters.ts        # Data formatting helpers
│   │   │   │   ├── severityUtils.ts     # Severity level logic
│   │   │   │   └── idsStatusHelper.ts   # IDS status utilities
│   │   │   │
│   │   │   ├── hooks/             # Custom React hooks
│   │   │   │   ├── useWebSocketAlerts.ts    # WebSocket real-time alerts
│   │   │   │   ├── useMockIdsStream.ts      # Mock data streaming
│   │   │   │   └── useModelsStatus.ts       # Model health monitoring
│   │   │   │
│   │   │   ├── types/
│   │   │   │   └── attackTypes.ts # Single source of truth for attack types
│   │   │   │
│   │   │   ├── config/
│   │   │   │   └── api.ts         # API endpoints & configuration
│   │   │   │
│   │   │   ├── store/
│   │   │   │   └── useAegisMode.tsx # Global state (context provider)
│   │   │   │
│   │   │   ├── services/
│   │   │   │   └── aegisApi.ts    # Type-safe API client functions
│   │   │   │
│   │   │   ├── App.jsx            # Main routing & cursor glow effect
│   │   │   ├── main.jsx           # React DOM entry point
│   │   │   ├── index.css          # Global styles
│   │   │   └── vite-env.d.ts      # Vite TypeScript definitions
│   │   │
│   │   ├── public/                # Static assets
│   │   ├── vite.config.js         # Vite configuration
│   │   ├── tsconfig.json          # TypeScript config
│   │   ├── package.json           # React, Vite, Recharts, Lucide
│   │   └── .env.local             # Frontend config
│   │
│   ├── README.md                  # Project overview
│   ├── SETUP.md                   # Installation guide
│   ├── QUICKSTART.md              # 5-minute setup
│   ├── docker-compose.yml         # Docker orchestration
│   └── .env                       # Project-level config
└── query                          # (External)
```

---

## 1.2 Technology Stack

### Backend (auth-backend)
| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | v18+ |
| Server | Express | ^4.18.2 |
| Database | MongoDB + Mongoose | ^8.0.0 |
| Authentication | JWT (jsonwebtoken) | ^9.0.2 |
| Password Hashing | bcryptjs | ^2.4.3 |
| CORS | cors | ^2.8.5 |
| Input Validation | express-validator | ^7.0.1 |
| Config Management | dotenv | ^16.3.1 |

### Frontend (aegis-dashboard)
| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | React | ^19.1.1 |
| Build Tool | Vite | Latest |
| Language | JavaScript (with TypeScript) | ESNext |
| Routing | React Router | ^7.9.6 |
| Data Viz | Recharts | ^3.5.1 |
| Icons | Lucide React | ^0.554.0 |
| Styling | CSS3 (Custom) | - |
| Database Lib | MongoDB | ^7.0.0 |

---

## 1.3 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ USER BROWSER (localhost:5173)                                   │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ React App (App.jsx + Router)                              │ │
│ │ ┌──────────────────────────────────────────────────────┐ │ │
│ │ │ Pages (Login, Dashboard, IDS, Settings, etc.)      │ │ │
│ │ │  - DashboardPage: Displays KPIs, alerts, charts    │ │ │
│ │ │  - IDSPage: IDS-specific threat interface          │ │ │
│ │ │  - LiveAlertsPage: Real-time alert stream          │ │ │
│ │ │  - SettingsPage: Configuration & integrations      │ │ │
│ │ └──────────────────────────────────────────────────────┘ │ │
│ │ ┌──────────────────────────────────────────────────────┐ │ │
│ │ │ State Management (useAegisMode Context Provider)   │ │ │
│ │ │  - Global app state (mode, user, settings)          │ │ │
│ │ └──────────────────────────────────────────────────────┘ │ │
│ │ ┌──────────────────────────────────────────────────────┐ │ │
│ │ │ Custom Hooks                                        │ │ │
│ │ │  - useWebSocketAlerts: Real-time alert connection  │ │ │
│ │ │  - useMockIdsStream: Synthetic data for demo       │ │ │
│ │ │  - useModelsStatus: Model health monitoring        │ │ │
│ │ └──────────────────────────────────────────────────────┘ │ │
│ └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
        │                                           │
        │ (HTTP + WebSocket)                        │
        ▼                                           ▼
┌────────────────────────────┐      ┌──────────────────────────────┐
│ AUTH BACKEND               │      │ AEGIS IDS BACKEND (Optional) │
│ (localhost:8000)           │      │ (WebSocket: ws://...)        │
│ ┌──────────────────────┐   │      │                              │
│ │ Express Server       │   │      │ - Real-time threat data      │
│ │                      │   │      │ - Alert stream               │
│ ├──────────────────────┤   │      │ - Model status               │
│ │ Auth Routes:         │   │      │ - System metrics             │
│ │ - /auth/register     │   │      └──────────────────────────────┘
│ │ - /auth/login        │   │
│ │ - /auth/me           │   │
│ │ - /health            │   │
│ ├──────────────────────┤   │
│ │ Middleware:          │   │
│ │ - JWT verification   │   │
│ │ - Error handling     │   │
│ │ - CORS               │   │
│ ├──────────────────────┤   │
│ │ Input Validation     │   │
│ │ - Email format       │   │
│ │ - Password strength  │   │
│ │ - Email uniqueness   │   │
│ └──────────────────────┘   │
└────────────────────────────┘
        │
        ▼
┌────────────────────────────┐
│ MongoDB (localhost:27017)  │
│                            │
│ Collection: users          │
│  - email (unique index)    │
│  - passwordHash (bcrypt)   │
│  - createdAt              │
└────────────────────────────┘
```

---

## 1.4 Authentication Flow

```
1. USER REGISTRATION
   ├─ User enters email + password
   ├─ Frontend validates (8+ chars, 1 uppercase, 1 number)
   ├─ POST /auth/register → Backend
   ├─ Backend validates with express-validator
   ├─ Hash password with bcrypt (12 salt rounds)
   ├─ Create user in MongoDB
   └─ Return JWT token (7-day expiration)

2. USER LOGIN
   ├─ User enters credentials
   ├─ POST /auth/login → Backend
   ├─ Find user by email in MongoDB
   ├─ Compare password with hash (bcrypt)
   ├─ Generate JWT token
   └─ Return token to frontend

3. AUTHENTICATED REQUESTS
   ├─ Frontend stores token (localStorage)
   ├─ Set Authorization header: "Bearer <token>"
   ├─ Backend middleware: authenticateToken()
   ├─ Verify JWT signature
   ├─ Extract userId from token
   └─ Allow request or return 401/403

4. TOKEN EXPIRY
   ├─ JWT expires after 7 days
   ├─ Frontend detects 401 response
   ├─ Redirect to login page
   └─ User must re-authenticate
```

---

# PART 2: EXISTING FEATURES & FUNCTIONALITIES

## 2.1 Dashboard Features

### 2.1.1 Real-time Threat Monitoring
The dashboard displays **5 critical attack types**:

| Attack Type | Description | Detection Method |
|------------|-------------|------------------|
| **SYN Flood** | DDoS attack flooding with SYN packets | XGBoost model (syn_xgb) |
| **ARP MITM** | Man-in-the-middle via ARP spoofing | XGBoost model (mitm_xgb) |
| **DNS Exfiltration** | Data exfiltration via DNS queries | Ensemble model (dns_ensemble) |
| **Brute-force** | Credential attack with multiple login attempts | Pattern detection |
| **L7 Anomalies** | Application-layer protocol violations | Behavioral analysis |

**Supported Attack Type Code Values:**
```typescript
type AttackType = "SYN_FLOOD" | "MITM_ARP" | "DNS_EXFILTRATION" | "BENIGN"
```

### 2.1.2 Dashboard Pages & Sections

#### DashboardPage.jsx (Main Dashboard)
**Purpose**: Central command center with KPI overview and threat intelligence

**Key Elements:**
1. **Top KPI Cards**:
   - Total Alerts count
   - Detection Rate %
   - Active Threats
   - Average Response Time

2. **Model Health Card**:
   - F1 Score: 0.79
   - ROC AUC: 0.85
   - Precision: 0.82
   - Recall: 0.76
   - Status indicator (stable/degraded)
   - Last updated timestamp

3. **Agent Status Card**:
   - Online/Offline status
   - Last heartbeat (seconds ago)
   - CPU Usage %
   - Memory Usage (GB)
   - Throughput (Mbps)
   - Agent ID

4. **Risk Score Card**:
   - Overall risk score (0-100)
   - Risk level (low/moderate/high/critical)
   - Input summary (active alerts, exposed services, findings)

5. **Threats Detected Chart**:
   - Interactive Recharts visualization
   - Shows threat distribution by type
   - Displays count and percentage
   - Severity color coding

6. **Alert Frequency Chart**:
   - Line/bar chart showing alerts over time
   - Grouped by severity (high/medium/low)
   - Monthly trend analysis
   - Click to drill-down

7. **Recent Alerts Feed**:
   - Live-updating list of latest 4 alerts
   - Each alert shows:
     - Timestamp
     - Source/Destination IPs
     - Attack type with icon
     - Severity badge (color-coded)
     - Score/confidence %
   - Sort by newest first

**Backend Integration:**
- `getMetricsOverview()`: Fetches KPI data
- `fetchAlerts()`: Gets recent alerts
- `checkHealth()`: Verifies system status
- Falls back to mock data if API unavailable

---

#### LiveAlertsPage.jsx (Real-time Alert Stream)
**Purpose**: Monitor all alerts as they occur

**Features:**
- WebSocket connection for real-time updates
- Infinite scroll or pagination
- Filter by severity level
- Search by IP address or attack type
- Responsive card view on mobile
- Sortable columns on desktop

**Data Displayed per Alert:**
```typescript
interface Alert {
  id: string;
  timestamp: string;        // ISO format
  src_ip: string;          // Source IP
  dst_ip: string;          // Destination IP
  src_port: number;        // Source port
  dst_port: number;        // Destination port
  protocol: string;        // TCP/UDP/ICMP
  attack_type: AttackType; // One of 5 types
  severity: Severity;      // low/medium/high/critical
  score: number;           // 0.0-1.0 confidence
  phase?: string;          // Attack phase (optional)
  label?: string;          // "attack" or "benign"
}
```

---

#### IDSPage.jsx (IDS-Specific Interface)
**Purpose**: Intrusion Detection System detail view

**Features:**
- Model status indicators
- Attack type breakdown
- Detection accuracy metrics
- System health monitoring
- Network flow analysis

---

#### SettingsPage.tsx (Configuration)
**Purpose**: User preferences and system configuration

**Settings Categories:**
1. **Alert Settings**:
   - Notification preferences
   - Alert filtering rules
   - Severity thresholds

2. **Integration Settings**:
   - Third-party tool connections
   - Webhook endpoints
   - Export options

3. **User Profile**:
   - Email management
   - Password change
   - Session management

4. **System Configuration**:
   - Model parameters
   - Data retention policies
   - Logging levels

---

#### MetricsPage.jsx
**Purpose**: Performance and operational metrics

**Displays:**
- Detection accuracy over time
- False positive rate
- Model performance trends
- System resource utilization
- Throughput metrics

---

#### DetectionPage.jsx
**Purpose**: Detailed analysis of individual detections

---

### 2.1.3 Authentication System

#### LoginPage.jsx
- Email/password input with validation
- Remember me option
- Link to sign up
- Error messaging
- Loading state during auth request
- Redirect to dashboard on success

#### SignUpPage.jsx
- Registration form with:
  - Email field
  - Password with strength indicator
  - Confirm password
  - Terms acceptance checkbox
- Real-time password validation
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 number
- Error handling and messaging
- Link to login page

---

## 2.2 UI/UX Components

### Reusable Component Library

#### Layout Components (`components/layout/`)
- **AppShell.jsx**: Main app container with navigation
- **TopNav.jsx**: Header navigation with logo, user menu, logout
- **AuthCardLayout.jsx**: Login/signup form wrapper
- **AegisLogo.jsx**: Branded logo component

#### Card Components (`components/cards/`)
- **MetricsSummaryCard.tsx**: KPI display with value, label, trend
- **ThreatsDetectedCard.tsx**: Attack distribution with severity colors

#### Chart Components (`components/charts/`)
- **AlertFrequencyChart.tsx**: Recharts line/bar chart
- **ThreatsChart.jsx**: Donut/pie chart for attack types
- **ThreatsDetectedCard.tsx**: Combined card + chart

#### Common Components (`components/common/`)
- **StatCard.tsx**: Generic stat display card
- **StatusPill.tsx**: Inline status indicator (online/offline/degraded)
- **SeverityBadge.tsx**: Color-coded severity label
- **PageHeader.tsx**: Page title + description
- **ErrorAlert.tsx**: Error message display

#### Form Components (`components/form/`)
- **TextInput.jsx**: Standard text field with label
- **PasswordInput.jsx**: Password field with show/hide toggle
- **CheckboxWithText.jsx**: Checkbox with label
- **FormField.jsx**: Wrapper for form inputs

#### Button Components (`components/buttons/`)
- **PrimaryButton.jsx**: Main CTA button with hover effects

#### Alert Components (`components/alerts/`)
- **RecentAlertCard.jsx**: Individual alert display
- **AlertToast.tsx**: Toast notification for new alerts

#### Feedback Components (`components/feedback/`)
- **PasswordStrengthBar.jsx**: Visual password strength meter
- **MatchLabel.jsx**: Password match indicator

---

## 2.3 Data & Mock Systems

### Real Data Flow
```
Backend API (/api/v1/*)
    ↓
aegisClient.ts (Type-safe API functions)
    ↓
React Components (useEffect hooks)
    ↓
UI Display
```

### Mock Data System
When backend is unavailable:
1. **mockDataGenerator.ts** generates synthetic data:
   - `generateRecentAlerts()`: Creates fake alerts with IPs, ports, types
   - `generateMonthlyThreats()`: Monthly threat counts
   - `generateMetricsOverview()`: KPI aggregates
   - `ThreatSimulator`: Continuous data generation

2. **useMockIdsStream.ts** hook:
   - Simulates real-time alert stream
   - Updates dashboard data continuously
   - Testing/demo mode

3. **Mock data includes**:
   - Random IPs (192.168.x.x)
   - Random ports (80, 443, 22, 53, 3389, 8080)
   - Random attack types (SYN, ARP, DNS, benign)
   - Random severity levels

---

## 2.4 API Endpoints

### Authentication Backend (Port 8000)

#### Health Check
```
GET /health
Response: { success: true, message: "Aegis Auth Backend is running", timestamp: "..." }
```

#### User Registration
```
POST /auth/register
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response (201):
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "createdAt": "2025-01-31T..."
  }
}

Error (400/409):
{
  "success": false,
  "code": "email_in_use|weak_password|invalid_email",
  "message": "Error description"
}
```

#### User Login
```
POST /auth/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com"
  }
}

Error (401):
{
  "success": false,
  "code": "invalid_credentials",
  "message": "Invalid email or password."
}
```

#### Get Current User
```
GET /auth/me
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "createdAt": "2025-01-31T..."
  }
}

Error (401):
{
  "success": false,
  "message": "Token not provided"
}
```

### Aegis IDS Backend (Optional, WebSocket)

**WebSocket URL**: `ws://localhost:8000/ws/alerts` (if available)

**Real-time alert stream with Attack data structures**

---

## 2.5 State Management

### Global Context: useAegisMode.tsx
```typescript
interface AegisModeContextType {
  isDarkMode: boolean;
  toggleMode: () => void;
  userEmail?: string;
  setUserEmail: (email: string) => void;
  // Other global state
}
```

**Usage in Components:**
```jsx
const { isDarkMode, toggleMode } = useAegisMode();
```

---

## 2.6 Responsive Design

### Breakpoints
```css
Desktop:        ≥ 1440px  (Full-featured UI)
Tablet:         1024px    (2-column layouts, wrapped controls)
Mobile:         ≤ 768px   (Card views, vertical stacking)
Small Mobile:   ≤ 480px   (Compact layouts, optimized spacing)
```

### Mobile Features
- Slide-out navigation menu with backdrop
- Touch-friendly spacing
- Card-based alert views (instead of tables)
- Escape key to close menus
- No horizontal scrolling

---

# PART 3: CHATBOT INTEGRATION STRATEGY

## 3.1 Chatbot Architecture Overview

### Proposed Chatbot Solution

```
┌─────────────────────────────────────────────────────────────┐
│ React Frontend (Existing Dashboard)                         │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Chat Widget Component                                 │ │
│ │ ├─ Floating chat button (bottom-right)              │ │
│ │ ├─ Chat window (expandable)                         │ │
│ │ ├─ Message history                                 │ │
│ │ ├─ Input field with send button                   │ │
│ │ └─ Typing indicator & message status               │ │
│ └────────────────────────────────────────────────────────┘ │
│        │                                                    │
│        │ WebSocket/HTTP                                    │
│        ▼                                                    │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Chat Service Layer (aegisApi.ts)                      │ │
│ │ ├─ sendMessage(message, context)                    │ │
│ │ ├─ getAlertSummary()                               │ │
│ │ ├─ getThreatIntelligence()                         │ │
│ │ └─ getSystemStatus()                               │ │
│ └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
        │
        │ (HTTP API)
        ▼
┌──────────────────────────────────────────────────────────┐
│ Chatbot Backend Microservice (NEW)                       │
│ Port: 8001                                              │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Express Server                                      │ │
│ ├──────────────────────────────────────────────────────┤ │
│ │ Routes:                                             │ │
│ │ - POST /chat/message       (Process user message)  │ │
│ │ - POST /chat/context       (Get dashboard context) │ │
│ │ - GET  /chat/history/:id   (Message history)      │ │
│ │ - POST /chat/feedback      (User feedback)         │ │
│ ├──────────────────────────────────────────────────────┤ │
│ │ Middleware:                                         │ │
│ │ - JWT authentication                               │ │
│ │ - Rate limiting                                    │ │
│ │ - Message validation                               │ │
│ │ - CORS                                              │ │
│ ├──────────────────────────────────────────────────────┤ │
│ │ Core Logic:                                         │ │
│ │ - Intent Detection                                 │ │
│ │ - Entity Extraction (IPs, attack types, etc.)     │ │
│ │ - Context Management                              │ │
│ │ - Response Generation                             │ │
│ └──────────────────────────────────────────────────────┘ │
│        │                                                  │
│        ├──→ Calls auth-backend /auth/me (verify user) │
│        │                                                  │
│        ├──→ Calls Aegis IDS API (/api/v1/*)         │
│        │                                                  │
│        └──→ MongoDB (chat_conversations collection)     │
│                                                          │
└──────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────┐
│ NLP/LLM Engine (Optional)                                │
│ ├─ OpenAI GPT (or local LLM)                           │
│ ├─ Intent classifier (BERT/TF)                         │
│ ├─ Entity extractor (spaCy)                            │
│ └─ Response ranking (BM25)                             │
└──────────────────────────────────────────────────────────┘
```

---

## 3.2 Chatbot Capabilities

### 3.2.1 Core Features

#### 1. **Alert & Threat Queries**
```
User: "What are the recent high-severity alerts?"
Bot: "I found 5 high-severity alerts in the last 2 hours:
    • SYN Flood from 192.168.1.50 → 10.0.0.1:80 (99% confidence)
    • ARP MITM from 192.168.1.100 (94% confidence)
    • DNS Exfiltration detected..."

User: "Which attack type is most common today?"
Bot: "Based on today's data:
    • SYN Flood: 42% (127 alerts)
    • MITM ARP: 31% (94 alerts)
    • DNS Exfiltration: 18% (54 alerts)"
```

#### 2. **Alert Investigation**
```
User: "Tell me about the alert from 192.168.1.50"
Bot: "Alert details:
    Source: 192.168.1.50:54321
    Destination: 10.0.0.1:80
    Attack Type: SYN Flood
    Severity: HIGH
    Score: 0.99
    Time: 2025-01-31 14:32:15 UTC
    Protocol: TCP
    Related alerts: 3 more from same source in 5 min"

User: "Block this IP"
Bot: "I can help with that. Would you like me to:
    1. Generate firewall rule
    2. Add to blocklist
    3. Escalate to security team"
```

#### 3. **System Status Checks**
```
User: "What's the system status?"
Bot: "System Health Overview:
    ✓ API Server: Online
    ✓ Model Engine: Running (3 models loaded)
    • SYN Detection: 0.79 F1 Score
    • MITM Detection: 0.82 F1 Score
    • DNS Detection: 0.85 F1 Score
    ✓ Database: Connected
    ✓ IDS Agents: 1 online (aegis-edge-01)
    Overall Risk Score: 62 (Moderate)"

User: "How's the CPU usage?"
Bot: "Agent aegis-edge-01:
    CPU: 34% (Good)
    Memory: 1.2 GB (Normal)
    Throughput: 4.1 Mbps
    Last heartbeat: 12 seconds ago"
```

#### 4. **Analytics & Reporting**
```
User: "Show me threat trends this month"
Bot: "Monthly threat trend:
    Week 1: 234 alerts (Avg 33/day)
    Week 2: 289 alerts (Avg 41/day) ↑
    Week 3: 267 alerts (Avg 38/day)
    Week 4: 145 alerts (Avg 36/day) ↓
    Total this month: 935 alerts
    Trend: Stable (month-over-month ±5%)"

User: "What's our detection rate?"
Bot: "Detection Performance:
    Overall Detection Rate: 87.3%
    False Positive Rate: 4.2%
    Average Response Time: 2.3 seconds
    Best detector: DNS Model (89% recall)
    Needs improvement: ARP detector (76% recall)"
```

#### 5. **Incident Response**
```
User: "I see a spike in alerts, what happened?"
Bot: "Alert Analysis:
    • 89 new alerts in the last 10 minutes (↑ 300% above baseline)
    • Primary attack: SYN Flood (71 alerts)
    • Source cluster: 192.168.1.0/24
    • Target: 10.0.0.1:80 (HTTP)
    • Confidence: 98% (likely coordinated attack)
    
    Recommendations:
    1. Check DDoS mitigation status
    2. Review firewall logs for patterns
    3. Consider blocking source /24 subnet
    4. Alert incident response team"

User: "Block the entire 192.168.1.0/24 subnet"
Bot: "Firewall rule generated:
    Type: IP Blocklist
    Target: 192.168.1.0/24
    Reason: SYN Flood attack cluster
    Status: Ready to deploy
    Would you like me to apply this rule now?"
```

#### 6. **Help & Training**
```
User: "What is a SYN Flood attack?"
Bot: "SYN Flood Attack Overview:
    A DDoS attack that exploits the TCP three-way handshake.
    
    How it works:
    1. Attacker sends many SYN packets with spoofed IPs
    2. Server responds with SYN-ACK for each request
    3. Server waits for ACK (which never comes)
    4. Server's connection table fills up
    5. Legitimate connections are rejected
    
    Detection:
    Our SYN detection model looks for:
    - High number of SYN packets
    - Low ACK response ratio
    - Rapid connection attempts
    - Similar source patterns
    
    Mitigation:
    - SYN cookies
    - Rate limiting
    - Firewall filtering
    - DDoS protection services"

User: "How do I use the dashboard?"
Bot: "Welcome! Here's a quick guide:
    📊 Dashboard: Overview of all alerts and metrics
    🚨 Live Alerts: Real-time threat feed
    🔧 Settings: Configure notifications and rules
    📈 Metrics: Performance analysis
    
    Common tasks:
    • View alerts: Go to Live Alerts page
    • Filter by severity: Use severity dropdown
    • Investigate IP: Click on alert details
    • Download report: Settings → Export"
```

---

### 3.2.2 Intent Classification

**Intent Categories**:

| Intent | Examples | Response Type |
|--------|----------|---------------|
| `QUERY_ALERTS` | "Show recent alerts", "High severity attacks" | Query + Format data |
| `INVESTIGATE_ALERT` | "Tell me about alert #123", "Alert from IP X" | Fetch + Analyze |
| `CHECK_STATUS` | "System status?", "Model health?", "Agent online?" | Query system state |
| `VIEW_METRICS` | "Show trends", "Detection rate", "False positives" | Calculate metrics |
| `INCIDENT_RESPONSE` | "Block IP", "Escalate", "Generate rule" | Generate recommendation |
| `GET_HELP` | "What is SYN Flood?", "How do I...?" | Knowledge base |
| `MANAGE_SETTINGS` | "Set alert threshold", "Change notification" | Update config |
| `EXPORT_DATA` | "Download report", "Export alerts" | Generate file |
| `SMALL_TALK` | "Hello", "How are you?", "Thanks" | Friendly response |

---

### 3.2.3 Entity Extraction

**Entities the bot recognizes**:

```typescript
interface ExtractedEntity {
  type: EntityType;
  value: string;
  confidence: number;
}

type EntityType = 
  | "IP_ADDRESS"      // 192.168.1.50, 10.0.0.1
  | "PORT_NUMBER"     // 80, 443, 22
  | "ATTACK_TYPE"     // SYN Flood, ARP MITM, DNS Exfiltration
  | "SEVERITY"        // high, critical, medium, low
  | "TIME_RANGE"      // "last 2 hours", "today", "this week"
  | "DOMAIN"          // example.com
  | "PROTOCOL"        // TCP, UDP, ICMP
  | "METRIC"          // F1 score, ROC AUC, detection rate
  | "ALERT_ID"        // alert-123-456
  | "THRESHOLD"       // "90%", "2 minutes"
  | "ACTION"          // block, whitelist, ignore, escalate
```

**Examples**:
```
Input: "Block IP 192.168.1.50 for SYN Flood attack"
Extracted:
  - IP_ADDRESS: "192.168.1.50"
  - ATTACK_TYPE: "SYN_FLOOD"
  - ACTION: "block"

Input: "Show me high severity alerts from the last 2 hours"
Extracted:
  - SEVERITY: "high"
  - TIME_RANGE: "last 2 hours"
  - INTENT: "QUERY_ALERTS"
```

---

## 3.3 Implementation Plan

### Phase 1: Basic Chat UI (Week 1)

**Frontend Changes:**

1. **Create Chat Widget Component**
```
src/components/chat/
├── ChatWidget.jsx         # Main chat bubble + window
├── ChatWindow.tsx         # Chat interface
├── MessageBubble.tsx      # Individual message display
├── MessageInput.tsx       # User input field
├── TypingIndicator.tsx    # Typing animation
└── ChatHeader.tsx         # Title + close button
```

2. **Add to DashboardPage.jsx**
```jsx
import ChatWidget from '../components/chat/ChatWidget';

function DashboardPage() {
  // ... existing code ...
  return (
    <div>
      {/* Existing dashboard content */}
      <ChatWidget />
    </div>
  );
}
```

3. **Create Chat Service**
```
src/services/chatService.ts
├─ sendMessage(message: string): Promise<ChatResponse>
├─ getHistory(): Promise<ChatMessage[]>
├─ clearHistory(): Promise<void>
└─ fetchContextData(): Promise<DashboardContext>
```

4. **Styling**
- Chat bubble: Fixed bottom-right corner
- Window: 400px × 600px, expandable
- Responsive: Mobile takes 90% width
- Dark theme to match dashboard

---

### Phase 2: Backend Chatbot Service (Week 2)

**New Microservice: Chat Backend**

1. **Create chatbot-backend folder**
```
chatbot-backend/
├── server.js           # Express server
├── .env               # Config (PORT=8001, AUTH_URL, etc.)
├── package.json       # Dependencies
├── routes/
│   └── chat.js        # Chat endpoints
├── middleware/
│   ├── auth.js        # JWT verification
│   └── errorHandler.js
├── services/
│   ├── messageProcessor.js    # Intent detection
│   ├── contextBuilder.js      # Dashboard context
│   ├── responseGenerator.js   # Generate responses
│   └── entityExtractor.js     # Extract entities
├── models/
│   └── Conversation.js        # MongoDB schema
├── knowledge/
│   ├── faq.json               # FAQ data
│   ├── attack_types.json      # Attack definitions
│   └── system_info.json       # System documentation
└── utils/
    ├── formatters.js          # Format responses
    └── validators.js          # Validate input
```

2. **MongoDB Schema - Conversation**
```javascript
const conversationSchema = {
  userId: ObjectId,          // From JWT
  messages: [
    {
      id: String,
      timestamp: Date,
      sender: "user" | "bot",
      content: String,
      intent?: String,
      entities?: Array,
      metadata?: Object
    }
  ],
  createdAt: Date,
  updatedAt: Date,
  isArchived: Boolean
}
```

3. **Chat API Endpoints**
```
POST   /chat/message              # Send message & get response
GET    /chat/history              # Get conversation history
DELETE /chat/history              # Clear history
POST   /chat/context              # Get current dashboard context
POST   /chat/feedback             # User rates bot response
GET    /chat/suggestions          # Get suggested questions
```

---

### Phase 3: NLP & Intent Recognition (Week 3)

**Natural Language Processing**

1. **Install NLP Libraries**
```bash
npm install compromise natural wink-pos-tagger
npm install axios  # For calling Aegis API
```

2. **Intent Detection Algorithm**
```javascript
// services/messageProcessor.js

const intents = {
  "QUERY_ALERTS": {
    keywords: ["alert", "threat", "attack", "detection", "show", "recent"],
    patterns: /show\s+(me\s+)?((recent|latest|high|critical)\s+)?alerts/i
  },
  "CHECK_STATUS": {
    keywords: ["status", "health", "online", "running", "working"],
    patterns: /what.{0,20}(status|health|working)/i
  },
  // ... more intents
};

function detectIntent(message) {
  for (const [intent, config] of Object.entries(intents)) {
    if (config.patterns.test(message)) {
      return intent;
    }
  }
  return "UNKNOWN";
}
```

3. **Entity Extraction**
```javascript
// services/entityExtractor.js

const patterns = {
  IP_ADDRESS: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  PORT: /(?::)?(\d{1,5})\b/g,
  ATTACK_TYPE: /(SYN|MITM|DNS|brute|anomal|flood)/gi,
  SEVERITY: /(critical|high|medium|low)\b/gi,
  TIME_RANGE: /(last\s+\d+\s+(hours|days|minutes)|today|this\s+(week|month|year))/gi
};

function extractEntities(message) {
  const entities = [];
  for (const [type, pattern] of Object.entries(patterns)) {
    const matches = message.matchAll(pattern);
    for (const match of matches) {
      entities.push({
        type,
        value: match[0],
        position: match.index
      });
    }
  }
  return entities;
}
```

---

### Phase 4: Context & Response Generation (Week 4)

**Smart Response Generation**

1. **Context Builder**
```javascript
// services/contextBuilder.js

async function buildContext(userId) {
  // Fetch real data from Aegis dashboard API
  const context = {
    metrics: await fetchMetrics(),
    recentAlerts: await fetchAlerts(limit: 10),
    systemStatus: await checkHealth(),
    modelHealth: await fetchModelStatus(),
    agentStatus: await fetchAgentStatus(),
    timestamp: new Date()
  };
  return context;
}
```

2. **Response Generator**
```javascript
// services/responseGenerator.js

async function generateResponse(intent, entities, context) {
  switch (intent) {
    case "QUERY_ALERTS":
      return await handleAlertQuery(entities, context);
    
    case "CHECK_STATUS":
      return await handleStatusCheck(context);
    
    case "INVESTIGATE_ALERT":
      return await handleAlertInvestigation(entities, context);
    
    default:
      return getDefaultResponse(message);
  }
}

async function handleAlertQuery(entities, context) {
  const severity = entities.find(e => e.type === "SEVERITY")?.value || "all";
  const timeRange = entities.find(e => e.type === "TIME_RANGE")?.value || "last 24h";
  
  const alerts = context.recentAlerts.filter(a => {
    return severity === "all" || a.severity === severity.toLowerCase();
  });
  
  return {
    type: "alert_list",
    content: formatAlerts(alerts),
    metadata: {
      count: alerts.length,
      severity,
      timeRange
    }
  };
}
```

---

### Phase 5: Frontend Integration (Week 5)

**Connect Frontend to Chat Backend**

1. **Update aegisApi.ts**
```typescript
// src/services/aegisApi.ts

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  content: string;
  timestamp: string;
  type?: string;  // "text" | "alert_list" | "status" | etc.
}

export async function sendChatMessage(message: string): Promise<ChatMessage> {
  const token = localStorage.getItem("token");
  const response = await fetch(`${CHAT_API_BASE_URL}/chat/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ message })
  });
  
  if (!response.ok) throw new Error("Chat request failed");
  return response.json();
}

export async function getChatHistory(): Promise<ChatMessage[]> {
  const token = localStorage.getItem("token");
  const response = await fetch(`${CHAT_API_BASE_URL}/chat/history`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error("Failed to load history");
  return response.json();
}
```

2. **Create Chat Hook**
```typescript
// src/hooks/useChat.ts

import { useState, useCallback } from "react";
import { sendChatMessage, getChatHistory, ChatMessage } from "../services/aegisApi";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (message: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Add user message immediately
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: "user",
        content: message,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMsg]);
      
      // Get bot response
      const botMsg = await sendChatMessage(message);
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const history = await getChatHistory();
      setMessages(history);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  }, []);

  return { messages, loading, error, send, loadHistory };
}
```

3. **ChatWidget Component**
```jsx
// src/components/chat/ChatWidget.jsx

import { useState, useEffect } from "react";
import { useChat } from "../../hooks/useChat";
import ChatWindow from "./ChatWindow";
import { MessageCircle } from "lucide-react";
import "./ChatWidget.css";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, loading, error, send, loadHistory } = useChat();

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  return (
    <>
      {/* Chat bubble button */}
      <button
        className="chat-bubble"
        onClick={() => setIsOpen(!isOpen)}
        title="Open chat assistant"
      >
        <MessageCircle size={24} />
        {messages.length > 0 && (
          <span className="chat-badge">{messages.length}</span>
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <ChatWindow
          messages={messages}
          loading={loading}
          error={error}
          onSend={send}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
```

---

## 3.4 Advanced Features (Future)

### Machine Learning Enhancements
1. **Intent Classification**: Use TensorFlow.js for client-side intent detection
2. **Sentiment Analysis**: Understand user frustration/satisfaction
3. **Chatbot Training**: Learn from user feedback to improve responses
4. **Conversational Context**: Remember multi-turn conversations

### Integration Features
1. **Slack Integration**: Send alerts to Slack via chatbot
2. **Email Reports**: Generate and email reports based on chat queries
3. **Webhook Actions**: Execute automated actions (block IP, escalate, etc.)
4. **API Automation**: Create custom rules from natural language

### Analytics
1. **Chat Analytics**: Track common questions, intents, user satisfaction
2. **Performance Metrics**: Bot response time, resolution rate
3. **Trending Topics**: Identify emerging threats based on chat
4. **User Insights**: Behavior patterns, preferences

---

# PART 4: CODEBASE ORGANIZATION

## 4.1 File-by-File Overview

### Backend (auth-backend/)

**server.js** (~50 lines)
- Express app initialization
- CORS configuration (allows localhost:5173)
- Routes mounting
- Database connection
- Server startup

**config/database.js**
- MongoDB connection with Mongoose
- Error handling
- Connection logging

**middleware/auth.js**
- JWT verification middleware
- Token extraction from Authorization header
- User ID injection into req.user

**middleware/errorHandler.js**
- Centralized error handling
- Status code mapping
- Error response formatting

**models/User.js**
- Mongoose schema for users
- Fields: email, passwordHash, createdAt
- Email validation regex
- Database indexes

**routes/auth.js** (~210 lines)
- POST /auth/register - User registration
- POST /auth/login - User login
- GET /auth/me - Get current user
- Input validation with express-validator
- Password hashing with bcrypt
- JWT token generation
- Error responses with specific codes

---

### Frontend (aegis-dashboard/)

**src/App.jsx**
- React Router setup
- Route definitions
- Custom cursor glow effect
- Provides AegisModeProvider context

**src/main.jsx**
- React DOM render
- App.jsx mounting
- Vite entry point

**src/index.css**
- Global styles
- CSS variables for theming
- Responsive utilities
- Cursor glow animation

**src/config/api.ts**
- API base URLs
- WebSocket URLs
- Endpoint constants
- Environment configuration

**src/pages/LoginPage.jsx**
- Email/password form
- Calls /auth/login endpoint
- Token storage in localStorage
- Redirect to dashboard on success

**src/pages/SignUpPage.jsx**
- Registration form
- Password strength validation
- Email validation
- Calls /auth/register endpoint

**src/pages/DashboardPage.jsx** (~800 lines)
- Main dashboard with 6 KPI cards
- Metrics overview
- Recent alerts feed
- Charts (threats, alert frequency)
- Model health status
- Agent status monitoring
- Risk score calculation
- Data refresh logic
- Mock data fallback

**src/pages/IDSPage.jsx**
- Intrusion Detection System interface
- Model status display
- Attack type breakdown

**src/pages/LiveAlertsPage.jsx**
- Real-time alert stream
- Pagination/infinite scroll
- Filtering by severity
- Search functionality
- WebSocket integration (optional)

**src/pages/SettingsPage.tsx**
- User profile management
- Alert notification settings
- Integration configuration
- System preferences

**src/pages/MetricsPage.jsx**
- Performance metrics
- Detection accuracy trends
- Model performance over time
- System resource utilization

**src/pages/DetectionPage.jsx**
- Individual detection details
- Full alert investigation

**src/pages/NotFoundPage.tsx**
- 404 error page

**src/api/aegisClient.ts** (~600 lines)
- Type-safe API client functions
- Health check endpoint
- System status endpoint
- Detection input/result interfaces
- Model status endpoint
- Alerts and metrics endpoints
- TypeScript types for all responses
- Error handling with ApiEnvelope pattern

**src/services/aegisApi.ts**
- Wrapper around aegisClient.ts
- Helper functions for common API calls
- Type normalization
- Mock data fallback

**src/services/authService.js**
- Token management
- Login/logout logic
- Session persistence
- Token refresh (if needed)

**src/hooks/useWebSocketAlerts.ts** (~150 lines)
- Custom hook for WebSocket connections
- Automatic reconnection with backoff
- Alert parsing and handling
- Connection state management
- Configurable retry logic

**src/hooks/useMockIdsStream.ts**
- Simulates real-time alert stream
- Updates dashboard continuously
- Used when backend unavailable
- Demo/testing mode

**src/hooks/useModelsStatus.ts**
- Monitors model health
- Fetches model status periodically
- Updates component state

**src/utils/mockDataGenerator.ts** (~150 lines)
- generateMonthlyThreats(): Threat data for 12 months
- generateRecentAlerts(count): Creates N fake alerts
- generateMetricsOverview(): Aggregates metrics
- ThreatSimulator: Continuous simulation
- Random IP generation
- Random attack type selection

**src/utils/authService.js**
- Token storage/retrieval
- Login/logout handling
- Session management

**src/utils/formatters.ts**
- Format timestamps
- Format IP addresses
- Format percentages
- Currency formatting (if needed)

**src/utils/severityUtils.ts**
- Map severity to colors
- Severity level comparisons
- Severity badges

**src/utils/idsStatusHelper.ts**
- IDS status calculations
- Health checks
- Status formatting

**src/utils/errorHelper.js**
- Parse error responses
- User-friendly error messages
- Error logging

**src/types/attackTypes.ts** (~60 lines)
- AttackType union type (SYN_FLOOD | MITM_ARP | DNS_EXFILTRATION | BENIGN)
- Severity type (low | medium | high | critical)
- Alert interface
- Metrics interface
- Validation helpers
- Display name mapping
- Constant array of attack types

**src/store/useAegisMode.tsx**
- React Context for global state
- Dark/light mode toggle
- User email storage
- Global settings

**src/components/** (100+ files)
- Reusable UI component library
- Well-organized by category
- Responsive designs
- Lucide React icons
- CSS modules for styling

---

## 4.2 Data Type Definitions

### Core Types (Single Source of Truth)

```typescript
// Attack Types
type AttackType = "SYN_FLOOD" | "MITM_ARP" | "DNS_EXFILTRATION" | "BENIGN"
type Severity = "low" | "medium" | "high" | "critical"

// Alert (from backend)
interface Alert {
  id: string;
  timestamp: string;
  src_ip: string;
  dst_ip: string;
  src_port: number;
  dst_port: number;
  protocol: string;
  attack_type: AttackType;
  severity: Severity;
  score: number;       // 0.0-1.0
  phase?: string;
  label?: string;      // "attack" | "benign"
}

// Metrics Overview
interface Metrics {
  total_alerts: number;
  active_alerts?: number;
  detection_rate?: number;
  avg_response_time?: number;
  severity_distribution: Record<Severity, number>;
  attack_type_distribution: Record<string, number>;
  total_flows?: number;
  time_range?: { from: string; to: string };
  last_updated?: string;
}

// Model Status
interface ModelStatus {
  name: string;
  loaded: boolean;
  path?: string;
  error?: string | null;
}

// System Health
interface HealthStatus {
  status: string;
  uptime_seconds: number;
  version: string;
  components: { [key: string]: string };
}
```

---

## 4.3 Key Dependencies

### Backend
```json
{
  "express": "^4.18.2",              // Web framework
  "mongoose": "^8.0.0",              // MongoDB ORM
  "bcryptjs": "^2.4.3",              // Password hashing
  "jsonwebtoken": "^9.0.2",          // JWT tokens
  "cors": "^2.8.5",                  // CORS middleware
  "dotenv": "^16.3.1",               // Environment variables
  "express-validator": "^7.0.1"      // Input validation
}
```

### Frontend
```json
{
  "react": "^19.1.1",                // UI framework
  "react-router-dom": "^7.9.6",      // Routing
  "recharts": "^3.5.1",              // Data visualization
  "lucide-react": "^0.554.0",        // Icons
  "mongodb": "^7.0.0"                // DB client (optional)
}
```

---

## 4.4 Configuration Management

### Environment Variables

**Backend (.env)**
```env
MONGODB_URI=mongodb://127.0.0.1:27017/aegis_auth
JWT_SECRET=your-generated-secret-here
PORT=8000
NODE_ENV=development
```

**Frontend (.env.local)**
```env
VITE_AEGIS_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
```

---

## 4.5 Build & Deployment

### Frontend (Vite)
```bash
npm run dev      # Development server (hot reload)
npm run build    # Production build (output: dist/)
npm run preview  # Preview production build locally
```

### Backend (Node.js)
```bash
npm start        # Start server (node server.js)
npm run dev      # Development with auto-reload (node --watch)
```

### Docker
```bash
docker-compose up    # Start all services
```

---

# PART 5: GETTING STARTED WITH CHATBOT

## 5.1 Quick Start: Minimal Chatbot

### Step 1: Create Chat Backend

```bash
cd "g:\aegis\entire project\frontend code"
mkdir chatbot-backend
cd chatbot-backend
npm init -y
npm install express cors dotenv mongoose jsonwebtoken bcryptjs
```

### Step 2: Create Basic Server

**chatbot-backend/server.js**
```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Chatbot backend running' });
});

// Echo endpoint (simplest chatbot)
app.post('/chat/message', (req, res) => {
  const { message } = req.body;
  
  // Simple keyword matching
  let response = "I'm learning...";
  
  if (message.toLowerCase().includes('alert')) {
    response = "There are 5 high-severity alerts in the last hour.";
  } else if (message.toLowerCase().includes('status')) {
    response = "System status: All services online ✓";
  } else if (message.toLowerCase().includes('threat')) {
    response = "Most common threat today: SYN Flood (42%)";
  }
  
  res.json({
    id: Date.now().toString(),
    sender: 'bot',
    content: response,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`✓ Chatbot backend running on port ${PORT}`);
});
```

### Step 3: Add Chat UI to Frontend

**aegis-dashboard/src/components/chat/ChatWidget.jsx**
```jsx
import { useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import './ChatWidget.css';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', content: 'Hi! I\'m the Aegis security assistant. Ask me about alerts, threats, or system status.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8001/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const botMsg = await res.json();
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="chat-bubble"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MessageCircle size={24} />
      </button>

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h3>Aegis Assistant</h3>
            <button onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`message message--${msg.sender}`}>
                {msg.content}
              </div>
            ))}
            {loading && <div className="message message--bot">Thinking...</div>}
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              placeholder="Ask about alerts, threats..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} disabled={loading}>
              <Send size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
```

**aegis-dashboard/src/components/chat/ChatWidget.css**
```css
.chat-bubble {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #06b6d4);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s;
  z-index: 1000;
}

.chat-bubble:hover {
  transform: scale(1.1);
}

.chat-window {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 400px;
  height: 600px;
  background: #1a1a2e;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 5px 30px rgba(0, 0, 0, 0.4);
  z-index: 1000;
}

.chat-header {
  padding: 16px;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  padding: 10px 14px;
  border-radius: 8px;
  max-width: 85%;
  word-wrap: break-word;
}

.message--user {
  align-self: flex-end;
  background: #7c3aed;
  color: white;
}

.message--bot {
  align-self: flex-start;
  background: #333;
  color: #ccc;
}

.chat-input-area {
  padding: 12px;
  border-top: 1px solid #333;
  display: flex;
  gap: 8px;
}

.chat-input-area input {
  flex: 1;
  padding: 10px;
  border: 1px solid #444;
  border-radius: 6px;
  background: #2a2a3e;
  color: white;
  font-size: 14px;
}

.chat-input-area button {
  padding: 10px;
  background: #7c3aed;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: opacity 0.2s;
}

.chat-input-area button:hover {
  opacity: 0.8;
}

@media (max-width: 600px) {
  .chat-window {
    width: 90%;
    height: 80vh;
    right: 5%;
    bottom: 70px;
  }
}
```

### Step 4: Update Dashboard

**aegis-dashboard/src/pages/DashboardPage.jsx**

Add at the bottom of the component:
```jsx
import ChatWidget from '../components/chat/ChatWidget';

// In the return statement, add:
<ChatWidget />
```

---

## 5.2 Next Steps for Full Chatbot

1. **Add Intent Recognition**: Replace keyword matching with NLP
2. **Connect to Real Data**: Query alerts from backend API
3. **Store Conversations**: Save to MongoDB
4. **Add Context**: Include dashboard data in responses
5. **Improve Responses**: Template-based response generation
6. **Add Features**: Entities, actions, analytics

---

# Summary

This document provides a complete blueprint for the **Aegis Security Dashboard** system and a practical guide to integrating a **conversational chatbot** assistant. The chatbot can:

- Answer questions about security threats
- Provide real-time alerts and metrics
- Assist with incident response
- Offer threat intelligence
- Help users navigate the dashboard

**Key Files to Review:**
- `auth-backend/server.js` - Backend entry point
- `aegis-dashboard/src/App.jsx` - Frontend routing
- `aegis-dashboard/src/pages/DashboardPage.jsx` - Main dashboard
- `aegis-dashboard/src/types/attackTypes.ts` - Type definitions
- `aegis-dashboard/src/api/aegisClient.ts` - API client

**To Start Development:**
1. Review this document
2. Understand the current architecture
3. Follow Phase 1 (Chat UI) implementation above
4. Progress through phases 2-5 incrementally

