#!/usr/bin/env node
/**
 * seed-dev-data.ts — Development seed script
 *
 * Creates realistic dev data for local development and testing.
 * Safe to run multiple times (idempotent via ON CONFLICT clauses).
 *
 * Usage: pnpm seed
 */

import { Client } from 'pg';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

const DATABASE_URL = process.env['DATABASE_URL'] ?? 'postgresql://gg_user:gg_dev_password@localhost:5432/gujarati_global';

const client = new Client({ connectionString: DATABASE_URL });

// Static UUIDs for seeded entities (reproducible across runs)
const SEED_IDS = {
  // Users
  adminUser: '00000000-0000-0000-0000-000000000001',
  moderatorUser: '00000000-0000-0000-0000-000000000002',
  user1: '00000000-0000-0000-0000-000000000010',
  user2: '00000000-0000-0000-0000-000000000011',
  user3: '00000000-0000-0000-0000-000000000012',
  user4: '00000000-0000-0000-0000-000000000013',
  user5: '00000000-0000-0000-0000-000000000014',

  // Cities
  cityHouston: '00000000-0000-0000-0001-000000000001',
  cityNyc: '00000000-0000-0000-0001-000000000002',
  citySanJose: '00000000-0000-0000-0001-000000000003',
  cityLondon: '00000000-0000-0000-0001-000000000004',
  cityToronto: '00000000-0000-0000-0001-000000000005',
  cityAhmedabad: '00000000-0000-0000-0001-000000000006',

  // Communities
  communityHouston: '00000000-0000-0000-0002-000000000001',
  communityNyc: '00000000-0000-0000-0002-000000000002',
  communitySanJose: '00000000-0000-0000-0002-000000000003',

  // Groups
  groupGarbaHouston: '00000000-0000-0000-0003-000000000001',
  groupStudentsNyc: '00000000-0000-0000-0003-000000000002',
  groupH1bSanJose: '00000000-0000-0000-0003-000000000003',
  groupCricketHouston: '00000000-0000-0000-0003-000000000004',

  // Events
  eventGarbaNight: '00000000-0000-0000-0004-000000000001',
  eventH1bWorkshop: '00000000-0000-0000-0004-000000000002',
  eventCricketTournament: '00000000-0000-0000-0004-000000000003',
};

type SeedUser = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  userType: string | null;
  bio: string | null;
  university: string | null;
  company: string | null;
  currentCity: string | null;
  currentCountry: string | null;
};

async function seedUsers(passwordHash: string): Promise<void> {
  console.log('[seed] Seeding users...');

  const users = [
    { id: SEED_IDS.adminUser, email: 'admin@gujaratiglobal.com', role: 'super_admin', displayName: 'Platform Admin' },
    { id: SEED_IDS.moderatorUser, email: 'mod@gujaratiglobal.com', role: 'moderator', displayName: 'Community Moderator' },
    { id: SEED_IDS.user1, email: 'priya.patel@example.com', role: 'user', displayName: 'Priya Patel' },
    { id: SEED_IDS.user2, email: 'raj.shah@example.com', role: 'user', displayName: 'Raj Shah' },
    { id: SEED_IDS.user3, email: 'neha.desai@example.com', role: 'user', displayName: 'Neha Desai' },
    { id: SEED_IDS.user4, email: 'kiran.mehta@example.com', role: 'user', displayName: 'Kiran Mehta' },
    { id: SEED_IDS.user5, email: 'amit.joshi@example.com', role: 'user', displayName: 'Amit Joshi' },
  ];

  for (const user of users) {
    await client.query(
      `INSERT INTO users (id, email, email_verified, password_hash, auth_provider, role, status)
       VALUES ($1, $2, true, $3, 'email', $4, 'active')
       ON CONFLICT (id) DO NOTHING`,
      [user.id, user.email, passwordHash, user.role],
    );
  }

  const profiles: SeedUser[] = [
    { id: SEED_IDS.adminUser, email: '', displayName: 'Platform Admin', role: 'super_admin', userType: null, bio: null, university: null, company: 'Gujarati Global', currentCity: 'Houston', currentCountry: 'USA' },
    { id: SEED_IDS.moderatorUser, email: '', displayName: 'Community Moderator', role: 'moderator', userType: 'organizer', bio: 'Helping the community stay safe and vibrant.', university: null, company: null, currentCity: 'New York', currentCountry: 'USA' },
    { id: SEED_IDS.user1, email: '', displayName: 'Priya Patel', role: 'user', userType: 'student', bio: 'CS grad student @ UH. Love garba, cricket, and chai ☕', university: 'University of Houston', company: null, currentCity: 'Houston', currentCountry: 'USA' },
    { id: SEED_IDS.user2, email: '', displayName: 'Raj Shah', role: 'user', userType: 'professional', bio: 'Software Engineer. H1B journey done ✓. Happy to help!', university: 'IIT Bombay', company: 'Google', currentCity: 'San Jose', currentCountry: 'USA' },
    { id: SEED_IDS.user3, email: '', displayName: 'Neha Desai', role: 'user', userType: 'family', bio: 'BA + Family person. Community organizer in NYC.', university: null, company: null, currentCity: 'New York', currentCountry: 'USA' },
    { id: SEED_IDS.user4, email: '', displayName: 'Kiran Mehta', role: 'user', userType: 'entrepreneur', bio: 'Founder at TechVentures. Always looking for talent and co-founders.', university: 'NIT Surat', company: 'TechVentures', currentCity: 'San Jose', currentCountry: 'USA' },
    { id: SEED_IDS.user5, email: '', displayName: 'Amit Joshi', role: 'user', userType: 'student', bio: 'MBA student at Columbia. Looking for roommates and connections in NYC!', university: 'Columbia Business School', company: null, currentCity: 'New York', currentCountry: 'USA' },
  ];

  for (const p of profiles) {
    await client.query(
      `UPDATE profiles SET
        display_name = $2,
        full_name = $2,
        bio = $3,
        user_type = $4,
        university = $5,
        company = $6,
        current_city = $7,
        current_country = $8,
        interests = $9,
        languages = $10,
        is_discoverable = true
      WHERE user_id = $1`,
      [
        p.id,
        p.displayName,
        p.bio,
        p.userType,
        p.university,
        p.company,
        p.currentCity,
        p.currentCountry,
        ['garba', 'cricket', 'technology', 'gujarati culture', 'networking'],
        ['Gujarati', 'Hindi', 'English'],
      ],
    );
  }

  console.log('[seed] Users seeded ✓');
}

async function seedCities(): Promise<void> {
  console.log('[seed] Seeding cities...');

  const cities = [
    { id: SEED_IDS.cityHouston, name: 'Houston', state: 'Texas', country: 'United States', code: 'US', tz: 'America/Chicago', pop: 2304580 },
    { id: SEED_IDS.cityNyc, name: 'New York City', state: 'New York', country: 'United States', code: 'US', tz: 'America/New_York', pop: 8336817 },
    { id: SEED_IDS.citySanJose, name: 'San Jose', state: 'California', country: 'United States', code: 'US', tz: 'America/Los_Angeles', pop: 1013240 },
    { id: SEED_IDS.cityLondon, name: 'London', state: 'England', country: 'United Kingdom', code: 'GB', tz: 'Europe/London', pop: 9002488 },
    { id: SEED_IDS.cityToronto, name: 'Toronto', state: 'Ontario', country: 'Canada', code: 'CA', tz: 'America/Toronto', pop: 2731571 },
    { id: SEED_IDS.cityAhmedabad, name: 'Ahmedabad', state: 'Gujarat', country: 'India', code: 'IN', tz: 'Asia/Kolkata', pop: 7681000 },
  ];

  for (const city of cities) {
    await client.query(
      `INSERT INTO cities (id, name, state_province, country, country_code, timezone, population)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (name, state_province, country_code) DO NOTHING`,
      [city.id, city.name, city.state, city.country, city.code, city.tz, city.pop],
    );
  }

  console.log('[seed] Cities seeded ✓');
}

async function seedCommunities(): Promise<void> {
  console.log('[seed] Seeding communities...');

  const communities = [
    { id: SEED_IDS.communityHouston, name: 'Gujarati Global Houston', slug: 'gg-houston', desc: 'The official Gujarati community for the Greater Houston area.', cityId: SEED_IDS.cityHouston, by: SEED_IDS.adminUser, isOfficial: true },
    { id: SEED_IDS.communityNyc, name: 'Gujarati Global NYC', slug: 'gg-nyc', desc: 'Gujarati community for the greater New York City metro area.', cityId: SEED_IDS.cityNyc, by: SEED_IDS.adminUser, isOfficial: true },
    { id: SEED_IDS.communitySanJose, name: 'Gujarati Global Silicon Valley', slug: 'gg-silicon-valley', desc: 'Tech professionals and students in the Bay Area.', cityId: SEED_IDS.citySanJose, by: SEED_IDS.adminUser, isOfficial: true },
  ];

  for (const c of communities) {
    await client.query(
      `INSERT INTO communities (id, name, slug, description, city_id, is_official, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [c.id, c.name, c.slug, c.desc, c.cityId, c.isOfficial, c.by],
    );
  }

  console.log('[seed] Communities seeded ✓');
}

async function seedGroups(): Promise<void> {
  console.log('[seed] Seeding groups...');

  const groups = [
    {
      id: SEED_IDS.groupGarbaHouston,
      communityId: SEED_IDS.communityHouston,
      name: 'Garba & Dandiya Houston',
      slug: 'garba-houston',
      desc: 'For all garba lovers in Houston. Events, practice sessions, and cultural discussions.',
      visibility: 'public',
      joinPolicy: 'open',
      tags: ['garba', 'dandiya', 'navratri', 'dance'],
      by: SEED_IDS.user1,
    },
    {
      id: SEED_IDS.groupStudentsNyc,
      communityId: SEED_IDS.communityNyc,
      name: 'Gujarati Students NYC',
      slug: 'gujarati-students-nyc',
      desc: 'For Gujarati students in NYC. Share resources, find roommates, airport pickups, and more.',
      visibility: 'public',
      joinPolicy: 'open',
      tags: ['students', 'housing', 'roommates', 'university'],
      by: SEED_IDS.user5,
    },
    {
      id: SEED_IDS.groupH1bSanJose,
      communityId: SEED_IDS.communitySanJose,
      name: 'H1B & Immigration Help — Bay Area',
      slug: 'h1b-bay-area',
      desc: 'A trusted space for H1B holders and applicants in Silicon Valley. Share experiences and get guidance.',
      visibility: 'public',
      joinPolicy: 'open',
      tags: ['h1b', 'immigration', 'visa', 'career'],
      by: SEED_IDS.user2,
    },
    {
      id: SEED_IDS.groupCricketHouston,
      communityId: SEED_IDS.communityHouston,
      name: 'Houston Gujarati Cricket League',
      slug: 'houston-cricket',
      desc: 'Competitive and social cricket in Houston. Weekend games, tournaments, and practice.',
      visibility: 'public',
      joinPolicy: 'open',
      tags: ['cricket', 'sports', 'weekend'],
      by: SEED_IDS.user4,
    },
  ];

  for (const g of groups) {
    await client.query(
      `INSERT INTO groups (id, community_id, name, slug, description, visibility, join_policy, tags, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [g.id, g.communityId, g.name, g.slug, g.desc, g.visibility, g.joinPolicy, g.tags, g.by],
    );
  }

  console.log('[seed] Groups seeded ✓');
}

async function seedMemberships(): Promise<void> {
  console.log('[seed] Seeding memberships...');

  const memberships = [
    // Garba Houston
    { groupId: SEED_IDS.groupGarbaHouston, userId: SEED_IDS.user1, role: 'owner' },
    { groupId: SEED_IDS.groupGarbaHouston, userId: SEED_IDS.user3, role: 'member' },
    // Students NYC
    { groupId: SEED_IDS.groupStudentsNyc, userId: SEED_IDS.user5, role: 'owner' },
    { groupId: SEED_IDS.groupStudentsNyc, userId: SEED_IDS.user3, role: 'moderator' },
    // H1B Bay Area
    { groupId: SEED_IDS.groupH1bSanJose, userId: SEED_IDS.user2, role: 'owner' },
    { groupId: SEED_IDS.groupH1bSanJose, userId: SEED_IDS.user4, role: 'member' },
    // Cricket Houston
    { groupId: SEED_IDS.groupCricketHouston, userId: SEED_IDS.user4, role: 'owner' },
    { groupId: SEED_IDS.groupCricketHouston, userId: SEED_IDS.user1, role: 'member' },
    { groupId: SEED_IDS.groupCricketHouston, userId: SEED_IDS.user2, role: 'member' },
  ];

  for (const m of memberships) {
    await client.query(
      `INSERT INTO group_memberships (group_id, user_id, role, status)
       VALUES ($1, $2, $3, 'active')
       ON CONFLICT (group_id, user_id) DO NOTHING`,
      [m.groupId, m.userId, m.role],
    );
  }

  console.log('[seed] Memberships seeded ✓');
}

async function seedEvents(): Promise<void> {
  console.log('[seed] Seeding events...');

  const events = [
    {
      id: SEED_IDS.eventGarbaNight,
      groupId: SEED_IDS.groupGarbaHouston,
      communityId: SEED_IDS.communityHouston,
      organizerId: SEED_IDS.user1,
      title: 'Navratri Garba Night 2026 — Houston',
      description: 'The biggest Navratri celebration in Houston! Nine nights of garba and dandiya. Traditional dress required. All ages welcome.',
      eventType: 'garba',
      tags: ['navratri', 'garba', 'dandiya', 'cultural'],
      venueName: 'George R. Brown Convention Center',
      venueAddress: '1001 Avenida De Las Americas, Houston, TX 77010',
      cityId: SEED_IDS.cityHouston,
      startsAt: '2026-10-02T18:00:00-05:00',
      endsAt: '2026-10-02T23:30:00-05:00',
      timezone: 'America/Chicago',
      maxAttendees: 2000,
      visibility: 'public',
    },
    {
      id: SEED_IDS.eventH1bWorkshop,
      groupId: SEED_IDS.groupH1bSanJose,
      communityId: SEED_IDS.communitySanJose,
      organizerId: SEED_IDS.user2,
      title: 'H1B Cap 2027 — Filing Strategy Workshop',
      description: 'Join our panel of experienced attorneys and H1B veterans for a workshop on cap season strategy, lottery odds, and alternatives.',
      eventType: 'career',
      tags: ['h1b', 'immigration', 'workshop', 'career'],
      venueName: 'Google Campus Community Center',
      venueAddress: 'Mountain View, CA',
      cityId: SEED_IDS.citySanJose,
      startsAt: '2026-04-15T10:00:00-07:00',
      endsAt: '2026-04-15T14:00:00-07:00',
      timezone: 'America/Los_Angeles',
      maxAttendees: 150,
      visibility: 'public',
    },
    {
      id: SEED_IDS.eventCricketTournament,
      groupId: SEED_IDS.groupCricketHouston,
      communityId: SEED_IDS.communityHouston,
      organizerId: SEED_IDS.user4,
      title: 'Houston Gujarati Cricket Summer Tournament 2026',
      description: 'T20 format tournament with 8 teams. Register your team of 15. Trophies, food, and a great time guaranteed!',
      eventType: 'cricket',
      tags: ['cricket', 'tournament', 'sports'],
      venueName: 'Hermann Park Cricket Ground',
      venueAddress: '6201 Almeda Rd, Houston, TX 77021',
      cityId: SEED_IDS.cityHouston,
      startsAt: '2026-05-30T08:00:00-05:00',
      endsAt: '2026-05-30T20:00:00-05:00',
      timezone: 'America/Chicago',
      maxAttendees: 200,
      visibility: 'public',
    },
  ];

  for (const e of events) {
    await client.query(
      `INSERT INTO events (id, group_id, community_id, organizer_id, title, description, event_type, tags,
                           venue_name, venue_address, city_id, starts_at, ends_at, timezone, max_attendees,
                           visibility, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'upcoming')
       ON CONFLICT (id) DO NOTHING`,
      [
        e.id, e.groupId, e.communityId, e.organizerId, e.title, e.description,
        e.eventType, e.tags, e.venueName, e.venueAddress, e.cityId,
        e.startsAt, e.endsAt, e.timezone, e.maxAttendees, e.visibility,
      ],
    );
  }

  // Seed RSVPs
  const rsvps = [
    { eventId: SEED_IDS.eventGarbaNight, userId: SEED_IDS.user1, status: 'going' },
    { eventId: SEED_IDS.eventGarbaNight, userId: SEED_IDS.user3, status: 'going' },
    { eventId: SEED_IDS.eventH1bWorkshop, userId: SEED_IDS.user2, status: 'going' },
    { eventId: SEED_IDS.eventH1bWorkshop, userId: SEED_IDS.user4, status: 'interested' },
    { eventId: SEED_IDS.eventCricketTournament, userId: SEED_IDS.user4, status: 'going' },
    { eventId: SEED_IDS.eventCricketTournament, userId: SEED_IDS.user1, status: 'going' },
  ];

  for (const r of rsvps) {
    await client.query(
      `INSERT INTO event_rsvps (event_id, user_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id) DO NOTHING`,
      [r.eventId, r.userId, r.status],
    );
  }

  console.log('[seed] Events seeded ✓');
}

async function seedPosts(): Promise<void> {
  console.log('[seed] Seeding posts...');

  const posts = [
    {
      authorId: SEED_IDS.user1,
      groupId: SEED_IDS.groupGarbaHouston,
      communityId: SEED_IDS.communityHouston,
      contentType: 'text',
      body: 'So excited for Navratri this year! 🎉 Who else is coming? Let\'s organize a group carpool from Sugarland.',
    },
    {
      authorId: SEED_IDS.user2,
      groupId: SEED_IDS.groupH1bSanJose,
      communityId: SEED_IDS.communitySanJose,
      contentType: 'text',
      body: 'H1B lottery results for FY2027 are scheduled for April. Start preparing your documents early. Happy to answer questions from the community!',
    },
    {
      authorId: SEED_IDS.user5,
      groupId: SEED_IDS.groupStudentsNyc,
      communityId: SEED_IDS.communityNyc,
      contentType: 'text',
      body: 'Looking for a roommate near Columbia/Morningside Heights for Fall 2026. Budget ~$1,500/month. DM me if interested! 🏠',
    },
    {
      authorId: SEED_IDS.user3,
      groupId: SEED_IDS.groupStudentsNyc,
      communityId: SEED_IDS.communityNyc,
      contentType: 'text',
      body: 'Welcome to new students in NYC! Come to our monthly chai meetup — first Sunday of every month at Chai Pani in the East Village 🍵',
    },
  ];

  for (const p of posts) {
    await client.query(
      `INSERT INTO posts (id, author_id, group_id, community_id, content_type, body, moderation_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'published')`,
      [randomUUID(), p.authorId, p.groupId, p.communityId, p.contentType, p.body],
    );
  }

  console.log('[seed] Posts seeded ✓');
}

async function seedResourceListings(): Promise<void> {
  console.log('[seed] Seeding resource listings...');

  const resources = [
    {
      authorId: SEED_IDS.user5,
      cityId: SEED_IDS.cityNyc,
      category: 'roommate',
      title: 'Looking for Gujarati Roommate — Columbia Heights, NYC',
      description: 'Seeking a clean, respectful Gujarati roommate for a 2BR apartment near Columbia. Vegetarian household preferred. Rent $1,500/month utilities included. Available from August 2026.',
      contactMethod: 'in_app',
    },
    {
      authorId: SEED_IDS.user1,
      cityId: SEED_IDS.cityHouston,
      category: 'airport_pickup',
      title: 'Airport Pickup Help — Houston IAH/HOU',
      description: 'New to Houston? I offer free airport pickups for Gujarati community members. Just drop me a message with your flight details. I have done 20+ pickups. Happy to help!',
      contactMethod: 'in_app',
    },
    {
      authorId: SEED_IDS.user2,
      cityId: SEED_IDS.citySanJose,
      category: 'h1b_help',
      title: 'Free H1B Consultation — Bay Area Tech Professionals',
      description: 'Went through the H1B process twice. Happy to review your situation and connect you with the right attorney. Not legal advice, just community support.',
      contactMethod: 'in_app',
    },
  ];

  for (const r of resources) {
    await client.query(
      `INSERT INTO resource_listings (id, author_id, city_id, category, title, description, contact_method, moderation_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'published')`,
      [randomUUID(), r.authorId, r.cityId, r.category, r.title, r.description, r.contactMethod],
    );
  }

  console.log('[seed] Resource listings seeded ✓');
}

async function main(): Promise<void> {
  console.log('[seed] Starting seed...');
  console.log(`[seed] Database: ${DATABASE_URL.replace(/:[^:@]+@/, ':***@')}`);

  await client.connect();

  const passwordHash = await bcrypt.hash('DevPassword123!', 12);

  try {
    await seedCities();
    await seedUsers(passwordHash);
    await seedCommunities();
    await seedGroups();
    await seedMemberships();
    await seedEvents();
    await seedPosts();
    await seedResourceListings();

    console.log('\n[seed] Seed complete ✓\n');
    console.log('  Dev accounts:');
    console.log('  ┌─────────────────────────────────┬──────────────────────┬─────────────┐');
    console.log('  │ Email                           │ Password             │ Role        │');
    console.log('  ├─────────────────────────────────┼──────────────────────┼─────────────┤');
    console.log('  │ admin@gujaratiglobal.com        │ DevPassword123!      │ super_admin │');
    console.log('  │ mod@gujaratiglobal.com          │ DevPassword123!      │ moderator   │');
    console.log('  │ priya.patel@example.com         │ DevPassword123!      │ user        │');
    console.log('  │ raj.shah@example.com            │ DevPassword123!      │ user        │');
    console.log('  │ neha.desai@example.com          │ DevPassword123!      │ user        │');
    console.log('  └─────────────────────────────────┴──────────────────────┴─────────────┘');
  } catch (err) {
    console.error('[seed] ERROR:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

void main();
