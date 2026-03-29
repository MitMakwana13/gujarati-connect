import { test } from 'vitest';
import { build } from '../src/app'; // assuming a build helper exists or we can inject Fastify

// Normally we would use tap or vitest to run fastify.inject()

test('Security Headers', async ({ expect }) => {
  const app = await build();
  
  const response = await app.inject({
    method: 'GET',
    url: '/health'
  });

  expect(response.headers['x-frame-options']).toBeDefined();
  expect(response.headers['content-security-policy']).toBeDefined();
  expect(response.headers['strict-transport-security']).toBeDefined();
  
  await app.close();
});

test('Rate Limiting (429)', async ({ expect }) => {
  const app = await build();
  
  // Spam login endpoint
  let lastStatus = 200;
  for (let i = 0; i < 20; i++) {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'test@example.com', password: 'password123' }
    });
    lastStatus = response.statusCode;
    if (lastStatus === 429) break;
  }

  expect(lastStatus).toBe(429);
  
  await app.close();
});
