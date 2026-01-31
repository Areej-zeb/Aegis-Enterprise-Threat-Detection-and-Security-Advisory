/**
 * Quick test script for authentication endpoints
 * Run with: node test-auth.js
 */

const API_BASE = 'http://localhost:8000';

async function testAuth() {
  console.log('🧪 Testing Aegis Auth Backend\n');

  // Test 1: Health check
  console.log('1️⃣  Testing health endpoint...');
  try {
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    console.log('✓ Health check:', healthData.message);
  } catch (error) {
    console.error('✗ Health check failed:', error.message);
    console.log('\n⚠️  Make sure the backend is running: npm run dev\n');
    return;
  }

  // Test 2: Register new user
  console.log('\n2️⃣  Testing registration...');
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'TestPass123';
  
  try {
    const registerRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    const registerData = await registerRes.json();
    
    if (registerData.success) {
      console.log('✓ Registration successful');
      console.log('  Email:', registerData.user.email);
      console.log('  Token:', registerData.token.substring(0, 20) + '...');
    } else {
      console.log('✗ Registration failed:', registerData.message);
      return;
    }
  } catch (error) {
    console.error('✗ Registration error:', error.message);
    return;
  }

  // Test 3: Login with created user
  console.log('\n3️⃣  Testing login...');
  let token;
  try {
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    const loginData = await loginRes.json();
    
    if (loginData.success) {
      console.log('✓ Login successful');
      console.log('  Email:', loginData.user.email);
      token = loginData.token;
    } else {
      console.log('✗ Login failed:', loginData.message);
      return;
    }
  } catch (error) {
    console.error('✗ Login error:', error.message);
    return;
  }

  // Test 4: Get current user (protected route)
  console.log('\n4️⃣  Testing protected route (/auth/me)...');
  try {
    const meRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const meData = await meRes.json();
    
    if (meData.success) {
      console.log('✓ Protected route works');
      console.log('  User:', meData.user.email);
    } else {
      console.log('✗ Protected route failed:', meData.message);
    }
  } catch (error) {
    console.error('✗ Protected route error:', error.message);
  }

  // Test 5: Invalid login
  console.log('\n5️⃣  Testing invalid login...');
  try {
    const invalidRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'WrongPassword' })
    });
    const invalidData = await invalidRes.json();
    
    if (!invalidData.success && invalidRes.status === 401) {
      console.log('✓ Invalid login correctly rejected');
      console.log('  Message:', invalidData.message);
    } else {
      console.log('✗ Invalid login should have been rejected');
    }
  } catch (error) {
    console.error('✗ Invalid login test error:', error.message);
  }

  console.log('\n✅ All tests completed!\n');
}

testAuth();
