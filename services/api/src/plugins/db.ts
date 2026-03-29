/**
 * plugins/db.ts — PostgreSQL connection pool plugin
 *
 * Registers `fastify.db` as a shared pg.Pool instance.
 * All queries must use parameterized queries — no raw string interpolation.
 */

import fp from 'fastify-plugin';
import { Pool, type QueryResult, type QueryResultRow } from 'pg';
import type { FastifyInstance } from 'fastify';
import { config } from '../config/index.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: PgPool;
  }
}

export interface PgPool {
  query<T extends QueryResultRow>(sql: string, values?: unknown[]): Promise<QueryResult<T>>;
  transaction<T>(fn: (client: import('pg').PoolClient) => Promise<T>): Promise<T>;
  end(): Promise<void>;
}

export const dbPlugin = fp(
  async (app: FastifyInstance) => {
    const pool = new Pool({
      connectionString: config.database.url,
      min: config.database.poolMin,
      max: config.database.poolMax,
      idleTimeoutMillis: config.database.idleTimeoutMs,
      connectionTimeoutMillis: config.database.connectionTimeoutMs,
    });

    pool.on('error', (err) => {
      app.log.error({ err }, '[db] Unexpected error on idle client');
    });

    pool.on('connect', () => {
      app.log.debug('[db] New client connected to pool');
    });

    // Test connectivity at startup
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    app.log.info('[db] Database connection established');

    const pgPool: PgPool = {
      query: <T extends QueryResultRow>(sql: string, values?: unknown[]) =>
        pool.query<T>(sql, values),
      transaction: async <T>(fn: (client: import('pg').PoolClient) => Promise<T>) => {
        const txClient = await pool.connect();
        try {
          await txClient.query('BEGIN');
          const result = await fn(txClient);
          await txClient.query('COMMIT');
          return result;
        } catch (err) {
          await txClient.query('ROLLBACK');
          throw err;
        } finally {
          txClient.release();
        }
      },
      end: () => pool.end(),
    };

    app.decorate('db', pgPool);

    app.addHook('onClose', async () => {
      await pool.end();
      app.log.info('[db] Database pool closed');
    });
  },
  { name: 'db' },
);
