/**
 * config/index.ts — Environment configuration
 *
 * All env vars read and validated here. Fails fast at startup if required
 * vars are missing. Never import process.env anywhere else in the service.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`[config] Required environment variable "${key}" is not set`);
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

function optionalIntEnv(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`[config] Environment variable "${key}" must be a valid integer`);
  }
  return parsed;
}

export const config = {
  env: optionalEnv('NODE_ENV', 'development') as 'development' | 'production' | 'test',
  port: optionalIntEnv('PORT', 3001),
  host: optionalEnv('HOST', '0.0.0.0'),

  database: {
    url: requireEnv('DATABASE_URL'),
    poolMin: optionalIntEnv('DB_POOL_MIN', 2),
    poolMax: optionalIntEnv('DB_POOL_MAX', 20),
    idleTimeoutMs: optionalIntEnv('DB_IDLE_TIMEOUT_MS', 30000),
    connectionTimeoutMs: optionalIntEnv('DB_CONNECTION_TIMEOUT_MS', 5000),
  },

  redis: {
    url: requireEnv('REDIS_URL'),
    queueUrl: optionalEnv('REDIS_QUEUE_URL', 'redis://localhost:6380'),
  },

  jwt: {
    accessSecret: requireEnv('JWT_ACCESS_SECRET'),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
    accessExpiry: optionalEnv('JWT_ACCESS_EXPIRY', '15m'),
    refreshExpiry: optionalEnv('JWT_REFRESH_EXPIRY', '30d'),
  },

  otp: {
    expirySeconds: optionalIntEnv('OTP_EXPIRY_SECONDS', 600),
  },

  cors: {
    origins: optionalEnv('CORS_ORIGINS', 'http://localhost:3000').split(','),
  },

  rateLimit: {
    global: {
      max: optionalIntEnv('RATE_LIMIT_GLOBAL_MAX', 1000),
      windowMs: optionalIntEnv('RATE_LIMIT_GLOBAL_WINDOW_MS', 60000),
    },
    auth: {
      max: optionalIntEnv('RATE_LIMIT_AUTH_MAX', 10),
      windowMs: optionalIntEnv('RATE_LIMIT_AUTH_WINDOW_MS', 900000),
    },
    post: {
      max: optionalIntEnv('RATE_LIMIT_POST_MAX', 30),
      windowMs: optionalIntEnv('RATE_LIMIT_POST_WINDOW_MS', 60000),
    },
    upload: {
      max: optionalIntEnv('RATE_LIMIT_UPLOAD_MAX', 20),
      windowMs: optionalIntEnv('RATE_LIMIT_UPLOAD_WINDOW_MS', 60000),
    },
    message: {
      max: optionalIntEnv('RATE_LIMIT_MESSAGE_MAX', 60),
      windowMs: optionalIntEnv('RATE_LIMIT_MESSAGE_WINDOW_MS', 60000),
    },
  },

  media: {
    storageConnectionString: optionalEnv('AZURE_STORAGE_CONNECTION_STRING', 'UseDevelopmentStorage=true'),
    containerName: optionalEnv('AZURE_STORAGE_CONTAINER_MEDIA', 'media'),
    cdnBaseUrl: optionalEnv('CDN_BASE_URL', 'http://localhost:10000/devstoreaccount1/media'),
  },

  features: {
    pushNotifications: optionalEnv('FEATURE_PUSH_NOTIFICATIONS', 'false') === 'true',
    aiModeration: optionalEnv('FEATURE_AI_MODERATION', 'false') === 'true',
    nearbyDiscovery: optionalEnv('FEATURE_NEARBY_DISCOVERY', 'false') === 'true',
  },

  bcryptRounds: optionalIntEnv('BCRYPT_ROUNDS', 12),

  /** Feed fanout threshold. Groups >= this size use hybrid strategy. */
  feedFanoutThreshold: optionalIntEnv('FEED_FANOUT_THRESHOLD', 10000),

  /** In days. Redis feed sorted set TTL for inactive users. */
  feedTtlDays: optionalIntEnv('FEED_TTL_DAYS', 7),
} as const;

export type Config = typeof config;
