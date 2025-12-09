# Aegis Dashboard

A modern, responsive security dashboard for the Aegis Intrusion Detection System (IDS). Built with React, Vite, and Recharts, featuring a dark SaaS aesthetic optimized for real-time threat monitoring.

## Features

### 🔐 Authentication
- **Real User Authentication**: MongoDB-backed user registration and login
- **Secure Password Storage**: Bcrypt hashing with 12 salt rounds
- **JWT Tokens**: 7-day expiration with Bearer token authentication
- **Protected Routes**: Dashboard access requires valid authentication
- **User Management**: Logout functionality and session handling

### 🎯 Core Functionality
- **Real-time Threat Detection**: Live monitoring of 5 SME-critical cyberattacks
  - SYN Flood
  - ARP-based MITM
  - Brute-force login attempts
  - DNS exfiltration
  - Application-layer (L7) anomalies
- **Live Alerts Feed**: Auto-refreshing alert stream with filtering and search
- **IDS Analytics**: Multi-tab interface with Overview, Live Alerts, Explainability, Analytics, and Threat Intel
- **Interactive Dashboards**: KPI cards, threat charts, and distribution visualizations
- **Settings Management**: Comprehensive configuration for alerts, notifications, and integrations

### 📱 Responsive Design
- **Desktop (≥1440px)**: Full-featured table views with detailed columns
- **Tablet (1024px)**: Optimized 2-column layouts with wrapped controls
- **Mobile (≤768px)**: Touch-friendly card views replacing tables
- **Small Mobile (≤480px)**: Compact layouts with optimized spacing
- **Mobile Menu**: Slide-out sidebar with backdrop overlay and escape key support

### 🎨 UI/UX Highlights
- Dark SaaS aesthetic with neon accents (purple, cyan, emerald)
- Smooth animations and transitions
- Responsive severity badges with color coding
- Interactive charts with hover states
- Mobile-optimized card views for alerts
- No horizontal scroll at any breakpoint

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool with HMR
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **React Router** - Client-side routing
- **TypeScript** - Type safety (partial)
- **CSS3** - Custom styling with media queries

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- MongoDB (local or Atlas) - **Required for authentication**
- Aegis Backend API (optional - falls back to mock data)

### Quick Start

**For complete setup with authentication, see [QUICKSTART.md](../QUICKSTART.md) in the root directory.**

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure API**
   
   The `.env.local` file should already contain:
   ```env
   VITE_AEGIS_API_BASE_URL=http://localhost:8000
   ```
   
   This points to the authentication backend. Make sure the auth backend is running (see below).

3. **Start the auth backend** (Required)
   
   In a separate terminal:
   ```bash
   cd ../auth-backend
   npm install
   npm run dev
   ```
   
   See [auth-backend/README.md](../auth-backend/README.md) for detailed backend setup.

4. **Start development server**
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:5173`

5. **Create an account**
   - Navigate to http://localhost:5173
   - Click "Create one" to register
   - Login with your credentials

6. **Build for production**
   ```bash
   npm run build
   ```

### Authentication

The dashboard now uses **real authentication** with MongoDB:
- User registration with email/password
- Secure password hashing (bcrypt)
- JWT-based authentication
- Protected routes
- Logout functionality

**No more dummy login!** You must create an account to access the dashboard.

## Project Structure

```
aegis-dashboard/
├── src/
│   ├── api/              # API client and mock data
│   ├── assets/           # Images and static assets
│   ├── components/       # Reusable React components
│   │   ├── alerts/       # Alert-related components
│   │   ├── buttons/      # Button components
│   │   ├── cards/        # Card components
│   │   ├── charts/       # Chart components (Recharts)
│   │   ├── feedback/     # Loading and error states
│   │   ├── form/         # Form inputs and controls
│   │   └── layout/       # Layout components (AppShell, Sidebar)
│   ├── pages/            # Page components
│   │   ├── DashboardPage.jsx      # Main dashboard with KPIs
│   │   ├── LiveAlertsPage.jsx     # Real-time alerts feed
│   │   ├── IDSPage.jsx            # IDS analytics (5 tabs)
│   │   ├── OverviewPage.jsx       # System overview
│   │   ├── SettingsPage.tsx       # Settings (4 tabs)
│   │   └── ...
│   ├── utils/            # Utility functions and mock data generators
│   ├── App.jsx           # Main app component with routing
│   ├── index.css         # Global styles and responsive CSS
│   └── main.jsx          # App entry point
├── public/               # Static assets
└── package.json          # Dependencies and scripts
```

## Key Pages

### Dashboard
- 8 KPI cards (Active Alerts, Total Detections, Response Time, Detection Rate, Model Health, Agent Status, Top Attack Types, Risk Score)
- Threats Detected line chart
- Advisory Insights
- Pentesting Summary
- Recent Alerts

### Live Alerts
- Auto-refreshing alerts feed (5s interval)
- Search and filter by severity/attack type
- Responsive table (desktop) / card view (mobile)
- Alert frequency chart

### IDS Page (5 Tabs)
1. **Overview**: Architecture info, security metrics, distributions
2. **Live Alerts**: Detailed alert table with selection and details panel
3. **Explainability**: ML model explanations for detections
4. **Analytics**: Threat trends and metrics over time
5. **Threat Intel**: Top IPs and threat intelligence

### Settings (4 Tabs)
1. **General**: System preferences and display options
2. **Alerts & Detection**: Sensitivity slider, thresholds, auto-response
3. **Notifications**: Email, Slack, webhook configurations
4. **Integrations**: SIEM, ticketing, and external service connections

## Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Desktop XL | ≥1440px | Full multi-column layouts, wide tables |
| Desktop | 1200-1439px | Slightly condensed layouts |
| Tablet | 992-1199px | 2-column grids, wrapped controls |
| Tablet SM | 768-991px | Single column, stacked elements |
| Mobile | 481-768px | Card views, full-width buttons, mobile menu |
| Mobile SM | ≤480px | Compact spacing, smaller fonts |

## Development

### Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

### Mock Data

When the backend API is unavailable, the dashboard uses mock data generators located in `src/utils/mockDataGenerator.ts`. This includes:
- Recent alerts with realistic timestamps
- Metrics overview with severity counts
- Monthly threat trends
- Attack type distributions

### Styling

The project uses vanilla CSS with a custom design system:
- **Colors**: Dark backgrounds (#020617, #0f172a) with neon accents
- **Typography**: System fonts with careful hierarchy
- **Spacing**: Consistent 4px/8px grid
- **Animations**: Smooth transitions (0.2s ease)
- **Responsive**: Mobile-first approach with min-width media queries

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

When adding new features:
1. Follow the existing component structure
2. Maintain responsive design at all breakpoints
3. Use the established color palette and spacing
4. Test with both API and mock data
5. Ensure no horizontal scroll on mobile

## License

[Your License Here]
