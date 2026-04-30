# Database Backup and Restore Plan

This document outlines the backup strategy, manual dump procedure, and restore decision tree for the Railway Postgres database.

## 1. Automated Backups
Railway Postgres automatically provisions periodic snapshots.
- Ensure that the Railway project has backups enabled for the Postgres service.
- Go to the **Postgres service** -> **Settings** -> **Backups** to verify the snapshot frequency and retention policy.

## 2. Manual Backups (pg_dump)
Before performing any risky or major migrations, always take a manual database dump.

### Prerequisites
You need PostgreSQL client tools installed locally to run `pg_dump`.

### Creating a Dump
```bash
# Retrieve the DATABASE_URL from your Railway Postgres service settings
DATABASE_URL="postgres://postgres:<PASSWORD>@<HOST>.railway.app:<PORT>/railway"

# Take a schema and data dump
pg_dump $DATABASE_URL -F c -f "gujarati_global_backup_$(date +%F_%H%M%S).dump"
```

## 3. Restore Procedure
Do not restore directly over the production database unless absolutely necessary and verified. 

### Step 1: Restore to a Temporary Database
1. Create a new, temporary Postgres service in Railway (e.g., `postgres-restore-test`).
2. Get the connection URL for the temporary database.
3. Restore the dump:
   ```bash
   TEST_DATABASE_URL="postgres://..."
   pg_restore -d $TEST_DATABASE_URL -1 gujarati_global_backup_xxx.dump
   ```

### Step 2: Verification
1. Connect the temporary database to a local API instance (`DATABASE_URL=$TEST_DATABASE_URL pnpm dev`).
2. Run `curl http://localhost:4000/health` to ensure basic connectivity.
3. Verify data integrity manually (check `users`, `posts`, `profiles`).

### Step 3: Production Rollback
If the restore is verified and production must be rolled back:
1. Temporarily scale the Vercel app and Railway worker to 0, or enable maintenance mode, to prevent data mutation during the restore.
2. If safe, restore the dump directly into the production database using `pg_restore --clean`.
3. Alternative: Swap the `DATABASE_URL` environment variables in the API service to point to the newly restored temporary database, effectively making it the new production database.

## 4. Rollback Decision Tree
- **Did a migration fail cleanly without corrupting data?**
  - Run the `down` migration script or fix the forward migration. Do not restore from backup.
- **Did an application bug corrupt specific rows?**
  - Extract the affected rows from the manual dump and run an `UPDATE/INSERT` script. Do not overwrite the entire database.
- **Did a catastrophic failure wipe the database or corrupt schemas?**
  - Execute a full restore from the latest snapshot or manual dump.

## Checklist
- [x] Automated backups verified in Railway dashboard.
- [x] Manual `pg_dump` command tested.
- [x] Restore procedure documented.
- [x] Responsible owner identified: Primary Lead Engineer.
