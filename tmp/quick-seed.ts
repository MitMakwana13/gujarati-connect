import bcrypt from 'bcryptjs';
import { Client } from 'pg';

const DATABASE_URL = 'postgresql://gg_dev:gg_dev_password@localhost:5432/gujarati_global';
const client = new Client({ connectionString: DATABASE_URL });

const SEED_IDS = {
  adminUser: '00000000-0000-0000-0000-000000000001',
  moderatorUser: '00000000-0000-0000-0000-000000000002',
  user1: '00000000-0000-0000-0000-000000000010',
  user2: '00000000-0000-0000-0000-000000000011',
  user3: '00000000-0000-0000-0000-000000000012',
};

const users = [
  { id: SEED_IDS.adminUser, email: 'admin@gujaratiglobal.com', role: 'super_admin', displayName: 'Platform Admin' },
  { id: SEED_IDS.moderatorUser, email: 'mod@gujaratiglobal.com', role: 'moderator', displayName: 'Community Moderator' },
  { id: SEED_IDS.user1, email: 'priya.patel@example.com', role: 'user', displayName: 'Priya Patel' },
  { id: SEED_IDS.user2, email: 'raj.shah@example.com', role: 'user', displayName: 'Raj Shah' },
  { id: SEED_IDS.user3, email: 'neha.desai@example.com', role: 'user', displayName: 'Neha Desai' },
];

async function main() {
  await client.connect();
  const hash = await bcrypt.hash('DevPassword123!', 12);
  console.log('Generated hash:', hash);
  
  for (const user of users) {
    await client.query(
      `INSERT INTO users (id, email, email_verified, password_hash, auth_provider, role, status)
       VALUES ($1, $2, true, $3, 'email', $4, 'active')
       ON CONFLICT (id) DO UPDATE SET password_hash = $3, email = $2, status = 'active'`,
      [user.id, user.email, hash, user.role]
    );
    
    // Upsert profile
    await client.query(
      `INSERT INTO profiles (user_id, display_name, full_name, is_discoverable)
       VALUES ($1, $2, $2, true)
       ON CONFLICT (user_id) DO UPDATE SET display_name = $2`,
      [user.id, user.displayName]
    );
    
    console.log(`Seeded: ${user.email}`);
  }
  
  await client.end();
  console.log('\nDone! Sign in with any of these accounts:');
  console.log('  admin@gujaratiglobal.com / DevPassword123!');
  console.log('  priya.patel@example.com / DevPassword123!');
}

main().catch(console.error);
