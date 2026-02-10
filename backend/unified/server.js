import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import httpProxy from "http-proxy";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================================
// Node.js Auth Routes (Port 5000)
// ============================================================================
import { connectDB } from "../../backend_auth/config/db.js";
import authRoutes from "../../backend_auth/routes/auth.js";

// Connect to MongoDB
connectDB();

// Auth routes
app.use("/api/auth", authRoutes);

// ============================================================================
// Python FastAPI Services (IDS + Pentest)
// ============================================================================
// These run as child processes and are proxied through this Express server

let pythonProcess = null;

function startPythonBackend() {
  return new Promise((resolve, reject) => {
    console.log("🚀 Starting Python FastAPI backend (IDS + Pentest)...");
    
    const pythonScript = path.join(__dirname, "../ids/serve/app.py");
    
    pythonProcess = spawn("python", ["-m", "uvicorn", "backend.ids.serve.app:app", "--host", "0.0.0.0", "--port", "8000"], {
      cwd: path.join(__dirname, "../../"),
      stdio: "inherit",
      env: { ...process.env, PYTHONUNBUFFERED: "1" }
    });

    pythonProcess.on("error", (err) => {
      console.error("❌ Failed to start Python backend:", err);
      reject(err);
    });

    pythonProcess.on("exit", (code) => {
      console.log(`⚠️  Python backend exited with code ${code}`);
    });

    // Give Python time to start
    setTimeout(() => resolve(), 3000);
  });
}

// ============================================================================
// Health Check Endpoints
// ============================================================================
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Unified Aegis backend is running",
    services: {
      auth: "running (port 5000)",
      ids: "running (port 8000)",
      pentest: "running (port 8000)"
    }
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "unified-backend",
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// Proxy Routes to Python Backend
// ============================================================================
// All /api/detection, /api/evaluation, /api/pentest, /ws routes are proxied to Python

const proxy = httpProxy.createProxyServer({
  target: "http://localhost:8000",
  changeOrigin: true,
  ws: true
});

proxy.on("error", (err, req, res) => {
  console.error("Proxy error:", err);
  res.status(503).json({ error: "Python backend unavailable" });
});

// Proxy all detection, evaluation, pentest, and metrics endpoints
app.use("/api/detection", (req, res) => proxy.web(req, res));
app.use("/api/evaluation", (req, res) => proxy.web(req, res));
app.use("/api/pentest", (req, res) => proxy.web(req, res));
app.use("/api/metrics", (req, res) => proxy.web(req, res));
app.use("/api/models", (req, res) => proxy.web(req, res));
app.use("/api/system", (req, res) => proxy.web(req, res));
app.use("/api/explainability", (req, res) => proxy.web(req, res));
app.use("/api/mock", (req, res) => proxy.web(req, res));
app.use("/api/alerts", (req, res) => proxy.web(req, res));

// Proxy WebSocket connections
app.use("/ws", (req, res) => proxy.web(req, res));

// Upgrade WebSocket connections
const server = http.createServer(app);
server.on("upgrade", (req, socket, head) => {
  proxy.ws(req, socket, head);
});

// ============================================================================
// Root Endpoint
// ============================================================================
app.get("/", (req, res) => {
  res.json({
    message: "Aegis Unified Backend",
    version: "1.0.0",
    services: {
      auth: {
        port: 5000,
        endpoints: ["/api/auth/login", "/api/auth/signup", "/api/auth/forgot-password"]
      },
      ids: {
        port: 8000,
        endpoints: ["/api/detection/live", "/api/metrics/overview", "/api/alerts"]
      },
      pentest: {
        port: 8000,
        endpoints: ["/api/pentest/scan", "/api/pentest/results/{scan_id}"]
      }
    },
    docs: "http://localhost:8000/docs"
  });
});

// ============================================================================
// Startup
// ============================================================================
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // Start Python backend
    await startPythonBackend();
    
    // Start Express server
    server.listen(PORT, () => {
      console.log(`\n✅ Aegis Unified Backend running on port ${PORT}`);
      console.log(`\n📍 Access Points:`);
      console.log(`   Auth API:      http://localhost:${PORT}/api/auth`);
      console.log(`   IDS API:       http://localhost:8000/api/detection`);
      console.log(`   Pentest API:   http://localhost:8000/api/pentest`);
      console.log(`   API Docs:      http://localhost:8000/docs`);
      console.log(`   Health Check:  http://localhost:${PORT}/health\n`);
    });
  } catch (err) {
    console.error("Failed to start backend:", err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down...");
  if (pythonProcess) {
    pythonProcess.kill();
  }
  server.close(() => {
    console.log("✅ Backend stopped");
    process.exit(0);
  });
});

start();
