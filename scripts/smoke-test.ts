#!/usr/bin/env node
/**
 * smoke-test.ts — Lightweight production smoke test
 *
 * Validates core routes and API reachability using fetch.
 *
 * Usage:
 * pnpm smoke:prod
 */

const FRONTEND_URL = process.env.SMOKE_FRONTEND_URL || 'http://localhost:3000';
const API_URL = process.env.SMOKE_API_URL || 'http://localhost:4000/api/v1';
const EMAIL = process.env.SMOKE_EMAIL || 'priya.patel@example.com';
const PASSWORD = process.env.SMOKE_PASSWORD || 'DevPassword123!';

let hasFailed = false;
let accessToken = '';

function log(message: string) {
  console.log(`[SMOKE] ${message}`);
}

function error(message: string, details?: any) {
  console.error(`[SMOKE] ❌ ERROR: ${message}`);
  if (details) console.error(details);
  hasFailed = true;
}

async function run() {
  log(`Starting smoke test...`);
  log(`Frontend URL: ${FRONTEND_URL}`);
  log(`API URL: ${API_URL}`);
  log(`User: ${EMAIL}`);
  console.log();

  // 1. Frontend URL loads
  try {
    log(`Testing Frontend URL...`);
    const res = await fetch(FRONTEND_URL);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    log(`✅ Frontend loads successfully.`);
  } catch (err: any) {
    error(`Frontend failed to load`, err.message);
  }

  // 2. Backend health URL returns ok
  try {
    log(`Testing Backend Health...`);
    // Assuming health check is at the root of the Fastify app /health
    const healthUrl = new URL('/health', API_URL).toString().replace('/api/v1/health', '/health');
    const res = await fetch(healthUrl);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error(`Health status is ${data.status}`);
    log(`✅ Backend is healthy.`);
  } catch (err: any) {
    error(`Backend health check failed`, err.message);
  }

  // 3. Login endpoint works with seeded credentials
  try {
    log(`Testing Login...`);
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    }
    const data = await res.json();
    accessToken = data.data.tokens.accessToken;
    if (!accessToken) throw new Error('No access token in response');
    log(`✅ Login successful.`);
  } catch (err: any) {
    error(`Login failed`, err.message);
    // Cannot proceed without auth token for the rest
    log(`Aborting authenticated tests due to login failure.`);
    process.exit(1);
  }

  const authHeaders = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  // 4. Authenticated /users/me works
  try {
    log(`Testing /users/me...`);
    const res = await fetch(`${API_URL}/users/me`, { headers: authHeaders });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    log(`✅ /users/me works.`);
  } catch (err: any) {
    error(`/users/me failed`, err.message);
  }

  // 5. Events endpoint works
  try {
    log(`Testing /events...`);
    const res = await fetch(`${API_URL}/events`, { headers: authHeaders });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    log(`✅ /events works.`);
  } catch (err: any) {
    error(`/events failed`, err.message);
  }

  // 6. Groups endpoint works
  try {
    log(`Testing /groups...`);
    const res = await fetch(`${API_URL}/groups`, { headers: authHeaders });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    log(`✅ /groups works.`);
  } catch (err: any) {
    error(`/groups failed`, err.message);
  }

  // 7. Resources endpoint works
  try {
    log(`Testing /resources...`);
    const res = await fetch(`${API_URL}/resources`, { headers: authHeaders });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    log(`✅ /resources works.`);
  } catch (err: any) {
    error(`/resources failed`, err.message);
  }

  // 8. Posts endpoint works
  try {
    log(`Testing /posts...`);
    const res = await fetch(`${API_URL}/posts`, { headers: authHeaders });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    log(`✅ /posts works.`);
  } catch (err: any) {
    error(`/posts failed`, err.message);
  }

  // 9. Discover endpoint works
  try {
    log(`Testing /users/discover...`);
    const res = await fetch(`${API_URL}/users/discover`, { headers: authHeaders });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    log(`✅ /users/discover works.`);
  } catch (err: any) {
    error(`/users/discover failed`, err.message);
  }

  // 10. Notifications endpoint works
  try {
    log(`Testing /notifications...`);
    const res = await fetch(`${API_URL}/notifications`, { headers: authHeaders });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    log(`✅ /notifications works.`);
  } catch (err: any) {
    error(`/notifications failed`, err.message);
  }

  // 11. Safe Mutation: Create Post, Like, Comment, and Cleanup
  let createdPostId = '';
  try {
    log(`Testing Post Creation (Mutation)...`);
    const createRes = await fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ content: `[SMOKE] Automated test post ${Date.now()}`, scope: 'public' }),
    });
    if (!createRes.ok) throw new Error(`Create post failed with status ${createRes.status}`);
    const postData = await createRes.json();
    createdPostId = postData.data.id;
    log(`✅ Post created (${createdPostId}).`);

    log(`Testing Post Like...`);
    const likeRes = await fetch(`${API_URL}/posts/${createdPostId}/like`, { method: 'POST', headers: authHeaders });
    if (!likeRes.ok) throw new Error(`Like post failed with status ${likeRes.status}`);
    log(`✅ Post liked.`);

    log(`Testing Post Comment...`);
    const commentRes = await fetch(`${API_URL}/posts/${createdPostId}/comments`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ content: '[SMOKE] Automated test comment' }),
    });
    if (!commentRes.ok) throw new Error(`Comment failed with status ${commentRes.status}`);
    log(`✅ Comment created.`);

  } catch (err: any) {
    error(`Mutation test failed`, err.message);
  } finally {
    // Cleanup
    if (createdPostId) {
      try {
        log(`Cleaning up test post...`);
        const delRes = await fetch(`${API_URL}/posts/${createdPostId}`, { method: 'DELETE', headers: authHeaders });
        if (!delRes.ok) throw new Error(`Cleanup failed with status ${delRes.status}`);
        log(`✅ Cleanup successful.`);
      } catch (err: any) {
        error(`Failed to cleanup post ${createdPostId}`, err.message);
      }
    }
  }

  // 12. Logout
  try {
    log(`Testing Logout...`);
    const res = await fetch(`${API_URL}/auth/logout`, { method: 'POST', headers: authHeaders });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    log(`✅ Logout works.`);
  } catch (err: any) {
    error(`/auth/logout failed`, err.message);
  }

  console.log();
  if (hasFailed) {
    log(`❌ Smoke test finished with errors.`);
    process.exit(1);
  } else {
    log(`🎉 All smoke tests passed successfully!`);
    process.exit(0);
  }
}

void run();
