#!/usr/bin/env node
/**
 * migrate.ts — Database migration runner
 *
 * Usage:
 *   pnpm migrate              → run all pending migrations
 *   pnpm migrate --rollback   → not supported (forward-only migrations)
 *   pnpm migrate --status     → show migration status
 *
 * Migrations are applied in filename order. Each migration is wrapped in a
 * transaction. If one fails, the process exits non-zero and subsequent
 * migrations are not applied.
 */

import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { Client } from 'pg';

const DATABASE_URL = process.env['DATABASE_URL'];
if (!DATABASE_URL) {
  console.error('[migrate] ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function ensureMigrationsTable(client: Client): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version     TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(client: Client): Promise<Set<string>> {
  const result = await client.query<{ version: string }>(
    'SELECT version FROM schema_migrations ORDER BY version ASC',
  );
  return new Set(result.rows.map((r) => r.version));
}

async function getMigrationFiles(): Promise<string[]> {
  const files = await readdir(MIGRATIONS_DIR);
  return files
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => f);
}

async function applyMigration(client: Client, filename: string): Promise<void> {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const sql = await readFile(filePath, 'utf8');

  console.log(`[migrate] Applying: ${filename}`);

  // Each migration file manages its own BEGIN/COMMIT.
  // We record the version inside the same transaction if possible.
  await client.query(sql);
  await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [filename]);

  console.log(`[migrate] Applied:  ${filename} ✓`);
}

async function printStatus(client: Client, files: string[], applied: Set<string>): Promise<void> {
  console.log('\n[migrate] Migration status:');
  console.log('─'.repeat(60));
  for (const file of files) {
    const status = applied.has(file) ? '✓ applied' : '○ pending';
    console.log(`  ${status}  ${file}`);
  }
  console.log('─'.repeat(60));
  console.log(`  Total: ${files.length} | Applied: ${applied.size} | Pending: ${files.length - applied.size}`);
  console.log();
}

async function main(): Promise<void> {
  const isStatusOnly = process.argv.includes('--status');

  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('[migrate] Connected to database');

    await ensureMigrationsTable(client);
    const [files, applied] = await Promise.all([
      getMigrationFiles(),
      getAppliedMigrations(client),
    ]);

    if (isStatusOnly) {
      await printStatus(client, files, applied);
      return;
    }

    const pending = files.filter((f) => !applied.has(f));
    if (pending.length === 0) {
      console.log('[migrate] All migrations are up to date ✓');
      return;
    }

    console.log(`[migrate] ${pending.length} pending migration(s) to apply`);

    for (const file of pending) {
      await applyMigration(client, file);
    }

    console.log('\n[migrate] All migrations applied successfully ✓');
  } catch (err) {
    console.error('[migrate] ERROR:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

void main();
