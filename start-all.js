#!/usr/bin/env node
/**
 * Aegis IDS - Unified Startup Script (Cross-platform)
 * Starts: Auth Backend (5000) + Main Backend (8000) + Frontend (5173)
 * 
 * Usage:
 *   node start-all.js
 *   or
 *   npm run start:all (if added to package.json)
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const projectRoot = __dirname;
const processes = [];

// Cleanup function
function cleanup() {
  log('\n🛑 Stopping all services...', 'yellow');
  processes.forEach(proc => {
    try {
      proc.kill();
    } catch (e) {
      // Ignore
    }
  });
  log('✅ All services stopped', 'green');
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Check prerequisites
function checkCommand(cmd) {
  try {
    require('child_process').execSync(`which ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

log('\n==========================================', 'bright');
log('🛡️  Aegis IDS - Starting All Services', 'bright');
log('==========================================\n', 'bright');

if (!checkCommand('node')) {
  log('❌ Node.js not found! Please install Node.js first.', 'red');
  process.exit(1);
}

if (!checkCommand('python') && !checkCommand('python3')) {
  log('❌ Python not found! Please install Python first.', 'red');
  process.exit(1);
}

log('✅ Prerequisites check passed\n', 'green');

// 1. Start Auth Backend
log('[1/3] 🔐 Starting Auth Backend (port 5000)...', 'cyan');
const authDir = path.join(projectRoot, 'backend_auth');

if (!fs.existsSync(path.join(authDir, 'node_modules'))) {
  log('📦 Installing auth backend dependencies...', 'yellow');
  const install = spawn('npm', ['install'], { cwd: authDir, stdio: 'inherit', shell: true });
  install.on('close', () => {
    startAuth();
  });
} else {
  startAuth();
}

function startAuth() {
  const authProc = spawn('npm', ['start'], {
    cwd: authDir,
    stdio: 'inherit',
    shell: true,
    detached: false
  });
  processes.push(authProc);
  setTimeout(() => {
    log('✅ Auth Backend started\n', 'green');
    startMain();
  }, 2000);
}

// 2. Start Main Backend
function startMain() {
  log('[2/3] 🚀 Starting Main Backend (port 8000)...', 'cyan');
  
  const venvPath = process.platform === 'win32' 
    ? path.join(projectRoot, 'venv', 'Scripts', 'python.exe')
    : path.join(projectRoot, 'venv', 'bin', 'python');
  
  if (!fs.existsSync(venvPath)) {
    log('❌ Virtual environment not found!', 'red');
    log('Please create it first:', 'yellow');
    log('   python -m venv venv', 'yellow');
    log('   source venv/bin/activate  (or venv\\Scripts\\activate on Windows)', 'yellow');
    log('   pip install -r requirements.txt', 'yellow');
    cleanup();
    return;
  }

  const backendDir = path.join(projectRoot, 'backend', 'ids', 'serve');
  const mainProc = spawn(venvPath, ['-m', 'uvicorn', 'app:app', '--reload', '--host', '0.0.0.0', '--port', '8000'], {
    cwd: backendDir,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PYTHONPATH: projectRoot, MODE: 'demo' }
  });
  processes.push(mainProc);
  
  setTimeout(() => {
    log('✅ Main Backend started\n', 'green');
    startFrontend();
  }, 3000);
}

// 3. Start Frontend
function startFrontend() {
  log('[3/3] 🎨 Starting Frontend (port 5173)...', 'cyan');
  const frontendDir = path.join(projectRoot, 'frontend_react');
  
  if (!fs.existsSync(path.join(frontendDir, 'node_modules'))) {
    log('📦 Installing frontend dependencies...', 'yellow');
    const install = spawn('npm', ['install'], { cwd: frontendDir, stdio: 'inherit', shell: true });
    install.on('close', () => {
      startFrontendDev();
    });
  } else {
    startFrontendDev();
  }
}

function startFrontendDev() {
  log('\n==========================================', 'bright');
  log('✅ All services starting!', 'green');
  log('==========================================\n', 'bright');
  log('🌐 Frontend:    http://localhost:5173', 'cyan');
  log('🔐 Auth API:     http://localhost:5000', 'cyan');
  log('🚀 Main API:     http://localhost:8000', 'cyan');
  log('📚 API Docs:     http://localhost:8000/docs', 'cyan');
  log('\nPress Ctrl+C to stop all services', 'yellow');
  log('==========================================\n', 'bright');
  
  const frontendProc = spawn('npm', ['run', 'dev'], {
    cwd: path.join(projectRoot, 'frontend_react'),
    stdio: 'inherit',
    shell: true
  });
  processes.push(frontendProc);
}

