import { test, vi } from 'vitest';
import { buildApp } from '../src/app';
import { emailService } from '../src/services/email.service';

vi.mock('../src/services/email.service', () => ({
  emailService: {
    sendOtpEmail: vi.fn().mockResolvedValue(undefined),
  },
}));

test('Registration triggers OTP email', async ({ expect }) => {
  const app = await buildApp();
  
  // Create a unique email to avoid conflicts with static seed data or previous test runs
  const testEmail = `newuser_${Date.now()}@test.com`;

  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: {
      email: testEmail,
      password: 'StrongPassword123!',
      displayName: 'Test User',
    },
  });

  expect(response.statusCode).toBe(201);
  const json = response.json();
  expect(json.data.message).toBe('Account created. Please verify your email.');

  // Ensure email service was called
  expect(emailService.sendOtpEmail).toHaveBeenCalledWith(
    testEmail,
    expect.any(String), // The OTP is randomly generated
    expect.anything()   // Logger
  );

  await app.close();
});
