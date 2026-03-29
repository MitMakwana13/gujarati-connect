/**
 * server.ts — Fastify entry point
 *
 * Instantiates the app and binds it to the network port.
 * Handles graceful shutdown for zero-downtime deployments.
 */

import { buildApp } from './app.js';
import { config } from './config/index.js';

process.on('unhandledRejection', (err) => {
  console.error('[server] Unhandled Rejection:', err);
  process.exit(1);
});

async function main() {
  const app = await buildApp();

  // ── Graceful Shutdown ─────────────────────────────────────
  const gracefulShutdown = async (signal: string) => {
    app.log.info({ signal }, '[server] Received shutdown signal, closing server...');
    try {
      await app.close();
      app.log.info('[server] Server closed successfully');
      process.exit(0);
    } catch (err) {
      app.log.error({ err }, '[server] Error during graceful shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => { void gracefulShutdown('SIGINT'); });
  process.on('SIGTERM', () => { void gracefulShutdown('SIGTERM'); });

  // ── Server Start ──────────────────────────────────────────
  try {
    const address = await app.listen({
      port: config.port,
      host: config.host,
    });
    app.log.info(`[server] Started and listening on ${address}`);
    app.log.info(`[server] Environment: ${config.env}`);

    if (config.env !== 'production') {
      app.log.info(`[server] OpenAPI Docs: http://localhost:${config.port}/docs`);
    }
  } catch (err) {
    app.log.error({ err }, '[server] Failed to start server');
    process.exit(1);
  }
}

void main();
