/**
 * Browser-equivalent smoke test — exercises the same BFF proxy paths
 * that the browser uses, with a cookie jar for rt + _csrf cookies.
 *
 * Covers:
 *   1. Login (via BFF) → rt cookie set, AT in JSON
 *   2. Session restore (silent refresh via BFF) → uses rt cookie
 *   3. Silent refresh before expiry → re-rotates
 *   4. Logout → clears cookie, blacklists token
 *   5. Post-logout refresh → 401
 *   6. Create group, event, post, resource
 *   7. Discover 4 tabs
 *   8. Restaurant detail
 */

const BASE = 'http://localhost:3000';
const EMAIL = 'smoke-test@gujaratiglobal.dev';
const PASSWORD = 'SmokeTest1234!';

// ── Cookie Jar ──────────────────────────────────────────────────
const cookieJar = {};

function parseCookies(headers) {
  const raw = headers.getSetCookie?.() ?? [];
  for (const line of raw) {
    const [pair] = line.split(';');
    if (!pair) continue;
    const idx = pair.indexOf('=');
    if (idx > 0) {
      cookieJar[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
    }
  }
}

function cookieHeader() {
  return Object.entries(cookieJar)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

// ── HTTP Helpers ────────────────────────────────────────────────
async function bff(method, path, opts = {}) {
  const url = `${BASE}/api/backend/${path}`;
  const headers = {
    Cookie: cookieHeader(),
    ...opts.headers,
  };
  const fetchOpts = { method, headers, redirect: 'manual' };
  if (opts.body) {
    headers['Content-Type'] = 'application/json';
    fetchOpts.body = JSON.stringify(opts.body);
  }

  const res = await fetch(url, fetchOpts);
  parseCookies(res.headers);
  let json;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, json, headers: res.headers };
}

let passed = 0;
let failed = 0;
function assert(label, condition) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

// ── Smoke Tests ─────────────────────────────────────────────────
async function run() {
  console.log('\n=== Browser Smoke Tests ===\n');

  // ── 1. Login ────────────────────────────────────────────────
  console.log('1. Login');
  // First get CSRF
  const csrf1 = await bff('GET', 'auth/csrf');
  assert('GET /auth/csrf → 200', csrf1.status === 200);
  const csrfToken = csrf1.json?.data?.csrfToken;
  assert('CSRF token returned', !!csrfToken);
  assert('_csrf cookie set', !!cookieJar['_csrf']);

  // Login
  const login = await bff('POST', 'auth/login', {
    body: { email: EMAIL, password: PASSWORD },
  });
  assert('POST /auth/login → 200', login.status === 200);
  const at1 = login.json?.data?.tokens?.accessToken;
  const expiresIn = login.json?.data?.tokens?.expiresIn;
  assert('Access token returned', !!at1);
  assert('expiresIn returned', typeof expiresIn === 'number' && expiresIn > 0);
  assert('refreshToken NOT in body', !login.json?.data?.tokens?.refreshToken);
  assert('rt cookie set', !!cookieJar['rt']);
  assert('User object returned', !!login.json?.data?.user?.id);
  const userId = login.json?.data?.user?.id;
  console.log(`  → userId: ${userId}, expiresIn: ${expiresIn}s`);

  // ── 2. Session Restore (silent refresh) ──────────────────────
  console.log('\n2. Session Restore (silent refresh via rt cookie)');
  const csrf2 = await bff('GET', 'auth/csrf');
  const csrfToken2 = csrf2.json?.data?.csrfToken;
  const oldRt = cookieJar['rt'];

  const refresh1 = await bff('POST', 'auth/refresh', {
    headers: { 'X-CSRF-Token': csrfToken2 },
  });
  assert('POST /auth/refresh → 200', refresh1.status === 200);
  const at2 = refresh1.json?.data?.tokens?.accessToken;
  assert('New access token returned', !!at2);
  assert('rt cookie rotated', cookieJar['rt'] !== oldRt);
  assert('refreshToken NOT in body', !refresh1.json?.data?.tokens?.refreshToken);
  assert('User returned on refresh', !!refresh1.json?.data?.user?.id);

  // ── 3. Silent refresh again (simulates scheduled re-refresh) ──
  console.log('\n3. Silent Refresh (second rotation)');
  const csrf3 = await bff('GET', 'auth/csrf');
  const csrfToken3 = csrf3.json?.data?.csrfToken;
  const rt2 = cookieJar['rt'];

  const refresh2 = await bff('POST', 'auth/refresh', {
    headers: { 'X-CSRF-Token': csrfToken3 },
  });
  assert('POST /auth/refresh → 200', refresh2.status === 200);
  const at3 = refresh2.json?.data?.tokens?.accessToken;
  assert('Third access token', !!at3);
  assert('rt rotated again', cookieJar['rt'] !== rt2);

  // ── Revoked token check ───────────────────────────────────
  console.log('\n3b. Revoked (rotated-away) token returns 401');
  // Temporarily swap in the old rt to test revocation
  const currentRt = cookieJar['rt'];
  cookieJar['rt'] = oldRt;
  const csrf3b = await bff('GET', 'auth/csrf');
  const revokedRefresh = await bff('POST', 'auth/refresh', {
    headers: { 'X-CSRF-Token': csrf3b.json?.data?.csrfToken },
  });
  assert('Revoked rt → 401', revokedRefresh.status === 401);
  // Restore good rt
  cookieJar['rt'] = currentRt;

  // ── 4. Authenticated API calls ────────────────────────────
  console.log('\n4. Authenticated API — GET /users/me');
  const me = await bff('GET', 'users/me', {
    headers: { Authorization: `Bearer ${at3}` },
  });
  assert('GET /users/me → 200', me.status === 200);
  assert('Returns correct user', me.json?.data?.id === userId);

  // ── 5. Create flows ──────────────────────────────────────
  console.log('\n5. Create Flows');

  // Create group
  const createGroup = await bff('POST', 'groups', {
    headers: { Authorization: `Bearer ${at3}` },
    body: { name: `Smoke Group ${Date.now()}`, visibility: 'public', joinPolicy: 'open' },
  });
  assert('POST /groups → 201', createGroup.status === 201);
  const groupId = createGroup.json?.data?.id;
  assert('Group ID returned', !!groupId);

  // Create event
  const createEvent = await bff('POST', 'events', {
    headers: { Authorization: `Bearer ${at3}` },
    body: {
      title: `Smoke Event ${Date.now()}`,
      groupId,
      startsAt: new Date(Date.now() + 7 * 86400_000).toISOString(),
      timezone: 'America/New_York',
      visibility: 'public',
    },
  });
  assert('POST /events → 201', createEvent.status === 201);
  const eventId = createEvent.json?.data?.id;
  assert('Event ID returned', !!eventId);

  // Create post in the group
  const createPost = await bff('POST', 'posts', {
    headers: { Authorization: `Bearer ${at3}` },
    body: { groupId, contentType: 'text', body: 'Smoke test post content' },
  });
  assert('POST /posts → 201', createPost.status === 201);
  const postId = createPost.json?.data?.id;
  assert('Post ID returned', !!postId);

  // Create resource listing
  const createResource = await bff('POST', 'resources', {
    headers: { Authorization: `Bearer ${at3}` },
    body: {
      title: 'Smoke Test Resource',
      description: 'A resource listing created during browser smoke testing for validation purposes',
      category: 'other',
    },
  });
  assert('POST /resources → 201', createResource.status === 201);
  assert('Resource ID returned', !!createResource.json?.data?.id);

  // ── 6. Discover tabs ─────────────────────────────────────
  console.log('\n6. Discover Tabs');

  const discPeople = await bff('GET', 'discover/nearby/people?city=Test', {
    headers: { Authorization: `Bearer ${at3}` },
  });
  assert('GET /discover/nearby/people → 200', discPeople.status === 200);
  assert('Returns array', Array.isArray(discPeople.json?.data));

  const discGroups = await bff('GET', 'discover/nearby/groups?city=Test');
  assert('GET /discover/nearby/groups → 200', discGroups.status === 200);
  assert('Returns array', Array.isArray(discGroups.json?.data));

  const discEvents = await bff('GET', 'discover/nearby/events?city=Test');
  assert('GET /discover/nearby/events → 200', discEvents.status === 200);
  assert('Returns array', Array.isArray(discEvents.json?.data));

  const discRestaurants = await bff('GET', 'discover/nearby/restaurants?city=Test');
  assert('GET /discover/nearby/restaurants → 200', discRestaurants.status === 200);
  assert('Returns array', Array.isArray(discRestaurants.json?.data));

  // ── 7. Restaurant detail ──────────────────────────────────
  console.log('\n7. Restaurant Detail');
  const restList = await bff('GET', 'restaurants');
  assert('GET /restaurants → 200', restList.status === 200);
  const restaurants = restList.json?.data ?? [];
  if (restaurants.length > 0) {
    const slug = restaurants[0].slug;
    const detail = await bff('GET', `restaurants/${slug}`);
    assert(`GET /restaurants/${slug} → 200`, detail.status === 200);
    assert('Restaurant detail has name', !!detail.json?.data?.name);
  } else {
    console.log('  ⊘ No restaurants seeded — skipping detail test');
  }

  // ── 8. Logout ─────────────────────────────────────────────
  console.log('\n8. Logout');
  const csrf4 = await bff('GET', 'auth/csrf');
  const csrfToken4 = csrf4.json?.data?.csrfToken;
  const preLogoutRt = cookieJar['rt'];

  const logout = await bff('POST', 'auth/logout', {
    headers: { 'X-CSRF-Token': csrfToken4 },
  });
  assert('POST /auth/logout → 200', logout.status === 200);

  // Verify post-logout refresh fails
  const csrf5 = await bff('GET', 'auth/csrf');
  cookieJar['rt'] = preLogoutRt; // restore the blacklisted rt
  const postLogout = await bff('POST', 'auth/refresh', {
    headers: { 'X-CSRF-Token': csrf5.json?.data?.csrfToken },
  });
  assert('Post-logout refresh → 401', postLogout.status === 401);

  // ── Summary ──────────────────────────────────────────────
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(2);
});
