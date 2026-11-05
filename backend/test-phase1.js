import http from 'http';
import { app, server } from './server.js';
import User from './models/User.js';

const PORT = 5001;

function makeRequest({ method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch (e) {
            parsed = raw;
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );

    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n=== RUNNING PHASE 1 AUTHENTICATION TESTS ===\n');
  let testUserToken = '';
  let cookieHeader = '';
  // Give MongoDB connection a moment to establish
  await new Promise((resolve) => setTimeout(resolve, 800));

  try {
    // 1. Health check
    console.log('[Test 1] Health Check...');
    const health = await makeRequest({ method: 'GET', path: '/api/health' });
    console.assert(health.statusCode === 200, 'Health check failed');
    console.log('✓ Health check passed:', health.body);

    // 2. Clean up old test user if exists
    await User.deleteOne({ email: 'testphase1@connecthub.io' });

    // 3. Register user
    console.log('\n[Test 2] User Registration...');
    const regRes = await makeRequest({
      method: 'POST',
      path: '/api/auth/register',
      body: {
        name: 'Phase 1 Tester',
        email: 'testphase1@connecthub.io',
        password: 'Password123!',
      },
    });
    console.assert(regRes.statusCode === 201, `Registration failed: ${JSON.stringify(regRes.body)}`);
    console.assert(regRes.body.success === true, 'Success flag false');
    console.assert(regRes.body.user.email === 'testphase1@connecthub.io', 'Email mismatch');
    console.log('✓ Registration passed. User created:', regRes.body.user.name);

    // 4. Duplicate email rejection
    console.log('\n[Test 3] Duplicate Email Rejection...');
    const dupRes = await makeRequest({
      method: 'POST',
      path: '/api/auth/register',
      body: {
        name: 'Another User',
        email: 'testphase1@connecthub.io',
        password: 'Password123!',
      },
    });
    console.assert(dupRes.statusCode === 400, 'Duplicate check failed');
    console.log('✓ Duplicate registration successfully rejected:', dupRes.body.message);

    // 5. Login with invalid password
    console.log('\n[Test 4] Login with Wrong Password...');
    const badLogin = await makeRequest({
      method: 'POST',
      path: '/api/auth/login',
      body: {
        email: 'testphase1@connecthub.io',
        password: 'WrongPassword!',
      },
    });
    console.assert(badLogin.statusCode === 401, 'Wrong password did not fail');
    console.log('✓ Wrong password rejected:', badLogin.body.message);

    // 6. Login with correct password
    console.log('\n[Test 5] Login with Valid Credentials...');
    const goodLogin = await makeRequest({
      method: 'POST',
      path: '/api/auth/login',
      body: {
        email: 'testphase1@connecthub.io',
        password: 'Password123!',
      },
    });
    console.assert(goodLogin.statusCode === 200, 'Valid login failed');
    console.assert(goodLogin.body.token, 'Token missing');
    testUserToken = goodLogin.body.token;

    // Extract cookie from Set-Cookie header
    if (goodLogin.headers['set-cookie']) {
      const setCookies = goodLogin.headers['set-cookie'];
      const tokenCookie = setCookies.find((c) => c.startsWith('token='));
      if (tokenCookie) {
        cookieHeader = tokenCookie.split(';')[0];
      }
    }
    console.log('✓ Login succeeded. Token received and Cookie issued.');

    // 7. Protected route /api/auth/me with Bearer token
    console.log('\n[Test 6] Access /api/auth/me with Authorization Header...');
    const meRes = await makeRequest({
      method: 'GET',
      path: '/api/auth/me',
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    console.assert(meRes.statusCode === 200, 'Get Me with Bearer failed');
    console.assert(meRes.body.user.email === 'testphase1@connecthub.io', 'User email mismatch in /me');
    console.log('✓ /me with Bearer header passed:', meRes.body.user.name);

    // 8. Protected route with HTTP-only cookie
    console.log('\n[Test 7] Access /api/auth/me with Cookie Header...');
    const meCookieRes = await makeRequest({
      method: 'GET',
      path: '/api/auth/me',
      headers: { Cookie: cookieHeader },
    });
    console.assert(meCookieRes.statusCode === 200, 'Get Me with Cookie failed');
    console.log('✓ /me with Cookie header passed.');

    // 9. Update profile
    console.log('\n[Test 8] Update Profile...');
    const updateRes = await makeRequest({
      method: 'PUT',
      path: '/api/auth/profile',
      headers: { Authorization: `Bearer ${testUserToken}` },
      body: {
        status: 'busy',
        customStatus: 'Testing Phase 1 in progress 🧪',
        bio: 'Updated bio for automated test verification.',
      },
    });
    console.assert(updateRes.statusCode === 200, 'Profile update failed');
    console.assert(updateRes.body.user.status === 'busy', 'Status update failed');
    console.assert(updateRes.body.user.customStatus === 'Testing Phase 1 in progress 🧪', 'Custom status mismatch');
    console.log('✓ Profile successfully updated in MongoDB:', updateRes.body.user.status, '-', updateRes.body.user.customStatus);

    // 10. Test seeded demo user login
    console.log('\n[Test 9] Test Seeded Demo Account Login (Alex Turner)...');
    const alexLogin = await makeRequest({
      method: 'POST',
      path: '/api/auth/login',
      body: {
        email: 'alex@connecthub.io',
        password: 'Password123!',
      },
    });
    console.assert(alexLogin.statusCode === 200, 'Alex login failed');
    console.log('✓ Seeded user login passed:', alexLogin.body.user.name, `(${alexLogin.body.user.email})`);

    // Clean up
    await User.deleteOne({ email: 'testphase1@connecthub.io' });
    console.log('\n===========================================');
    console.log('🎉 ALL PHASE 1 AUTHENTICATION TESTS PASSED!');
    console.log('===========================================\n');
  } catch (err) {
    console.error('Test failed with error:', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests();
