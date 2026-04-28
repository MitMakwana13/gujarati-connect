import { Client } from 'pg';

async function main() {
  const client = new Client({ connectionString: 'postgresql://gg_user:gg_dev_password@localhost:5432/gujarati_global' });
  await client.connect();
  const res = await client.query('UPDATE users SET email_verified = true');
  console.log(`Verified ${res.rowCount} users.`);
  await client.end();
}

main().catch(console.error);
