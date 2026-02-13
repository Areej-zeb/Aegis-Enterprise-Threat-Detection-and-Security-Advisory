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
// Child Processes Management
// ============================================================================
let authProcess = null;
let pythonProcess = null;

function startAuthBackend() {
  return new Promise((resolve, reject) => {
    console.log("🚀 Starting Auth Backend (Node.js)...");
    
    // Use node directly to run the auth backend server
    authProcess = spawn("node", ["server.js"], {
      cwd: path.resolve(__dirname, "../../backend_auth"),
      stdio: "inherit",
      env: { 
        ...process.env,
        PORT: "5001"  // Explicitly set port for auth backend
      }
    });

    authProcess.on("error", (err) => {
      console.error("❌ Failed to start Auth backend:", err);
      reject(err);
    });

    authProcess.on("exit", (code) => {
      console.log(`⚠️  Auth backend exited with code ${code}`);
    });

    // Give auth backend time to start
    setTimeout(() => resolve(), 2000);
  });
}

function startPythonBackend() {
  return new Promise((resolve, reject) => {
    console.log("🚀 Starting Python FastAPI backend (IDS + Pentest)...");
    
    pythonProcess = spawn("python", ["-m", "uvicorn", "backend.ids.serve.app:app", "--host", "0.0.0.0", "--port", "8000"], {
      cwd: path.resolve(__dirname, "../../"),
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
// Proxy Setup
// ============================================================================
const authProxy = httpProxy.createProxyServer({
  target: "http://localhost:5001",
  changeOrigin: true
});

const pythonProxy = httpProxy.createProxyServer({
  target: "http://localhost:8000",
  changeOrigin: true,
  ws: true
});

authProxy.on("error", (err, req, res) => {
  console.error("Auth proxy error:", err);
  res.status(503).json({ error: "Auth backend unavailable" });
});

pythonProxy.on("error", (err, req, res) => {
  console.error("Python proxy error:", err);
  res.status(503).json({ error: "Python backend unavailable" });
});

// ============================================================================
// Route Proxying
// ============================================================================
// Auth routes proxy to port 5001
app.use("/api/auth", (req, res) => authProxy.web(req, res));

// Python backend routes
app.use("/api/detection", (req, res) => pythonProxy.web(req, res));
app.use("/api/evaluation", (req, res) => pythonProxy.web(req, res));
app.use("/api/pentest", (req, res) => pythonProxy.web(req, res));
app.use("/api/metrics", (req, res) => pythonProxy.web(req, res));
app.use("/api/models", (req, res) => pythonProxy.web(req, res));
app.use("/api/system", (req, res) => pythonProxy.web(req, res));
app.use("/api/explainability", (req, res) => pythonProxy.web(req, res));
app.use("/api/mock", (req, res) => pythonProxy.web(req, res));
app.use("/api/alerts", (req, res) => pythonProxy.web(req, res));

// WebSocket proxy
app.use("/ws", (req, res) => pythonProxy.web(req, res));

// ============================================================================
// Health Check Endpoints
// ============================================================================
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Unified Aegis backend is running",
    services: {
      auth: "running (port 5001)",
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
// Root Endpoint
// ============================================================================
app.get("/", (req, res) => {
  res.json({
    message: "Aegis Unified Backend",
    version: "1.0.0",
    services: {
      auth: {
        port: 5001,
        endpoints: ["/api/auth/login", "/api/auth/signup"]
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
// WebSocket Upgrade
// ============================================================================
const server = http.createServer(app);
server.on("upgrade", (req, socket, head) => {
  pythonProxy.ws(req, socket, head);
});

// ============================================================================
// Startup
// ============================================================================
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // Start child processes
    await startAuthBackend();
    await startPythonBackend();
    
    // Start Express server
    server.listen(PORT, () => {
      console.log(`\n✅ Aegis Unified Backend running on port ${PORT}`);
      console.log(`\n📍 Access Points:`);
      console.log(`   Frontend:      http://localhost:5173`);
      console.log(`   Unified API:   http://localhost:${PORT}`);
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
  if (authProcess) {
    authProcess.kill();
  }
  if (pythonProcess) {
    pythonProcess.kill();
  }
  server.close(() => {
    console.log("✅ Backend stopped");
    process.exit(0);
  });
});

start();
