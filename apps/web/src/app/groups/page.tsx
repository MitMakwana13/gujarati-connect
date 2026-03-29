'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import AppNav from '@/components/AppNav';
import { stagger, fadeUp, cardHover, buttonTap, reduced } from '@/lib/motion';
import { EmptyState } from '@/components/ui/EmptyState';

interface Group { id: string; name: string; emoji: string; members: number; description: string; tags: string[]; joined: boolean; activity: string; city: string; }

const MOCK_GROUPS: Group[] = [
  { id: '1', name: 'Bay Area Gujaratis', emoji: '🌉', members: 3400, description: 'The Bay Area community hub for professionals, events, and Navratri celebrations.', tags: ['Professional', 'Social'], joined: true, activity: '12 posts today', city: 'San Francisco, CA' },
  { id: '2', name: 'GJ Startup Network', emoji: '🚀', members: 1200, description: 'Entrepreneurs, investors, and builders from the Gujarati startup ecosystem.', tags: ['Business', 'Networking'], joined: false, activity: '8 posts today', city: 'Global' },
  { id: '3', name: 'Jain Community USA', emoji: '🕉️', members: 890, description: 'Connecting Jains across the US for spirituality, culture, and celebrations.', tags: ['Religion', 'Culture'], joined: false, activity: '3 posts today', city: 'USA-wide' },
  { id: '4', name: 'NYC Gujarati Youth', emoji: '🗽', members: 650, description: 'Young Gujaratis in New York City — cricket, bhajans, and career growth.', tags: ['Social', 'Youth'], joined: true, activity: '5 posts today', city: 'New York, NY' },
  { id: '5', name: 'UK Patidars', emoji: '🇬🇧', members: 2100, description: 'The largest Patidar community group in the United Kingdom.', tags: ['Social', 'UK'], joined: false, activity: '6 posts today', city: 'London, UK' },
  { id: '6', name: 'Canada Gujarati Network', emoji: '🍁', members: 1800, description: 'Housing resources, immigration help, and community events across Canada.', tags: ['Immigration', 'Canada'], joined: false, activity: '4 posts today', city: 'Canada' },
];

const FILTERS = ['All', 'Professional', 'Social', 'Religion', 'Business', 'Youth'];

export default function GroupsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const rm = useReducedMotion();
  const [groups, setGroups] = useState(MOCK_GROUPS);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => { if (!isLoading && !user) router.push('/auth/login'); }, [user, isLoading, router]);
  if (isLoading || !user) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><span style={{ fontSize: 28 }}>⏳</span></div>;

  function toggleJoin(id: string) {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, joined: !g.joined, members: g.joined ? g.members - 1 : g.members + 1 } : g));
  }

  const shown = groups.filter(g => {
    const s = !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.description.toLowerCase().includes(search.toLowerCase()) || g.city.toLowerCase().includes(search.toLowerCase());
    const f = filter === 'All' || g.tags.some(t => t.toLowerCase().includes(filter.toLowerCase()));
    return s && f;
  });
  const myGroups = shown.filter(g => g.joined);
  const discover = shown.filter(g => !g.joined);
  const staggerV = rm ? reduced.stagger : stagger.normal;
  const itemV = rm ? reduced.fadeUp : fadeUp;

  return (
    <div>
      <AppNav />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <motion.div variants={itemV} initial="hidden" animate="visible" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 36, marginBottom: 6 }}>Groups</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Find your community — by city, interest, or culture</p>
          </div>
          <motion.button id="create-group-btn" className="btn btn-primary" whileTap={buttonTap} onClick={() => router.push('/groups/create')}>+ Create Group</motion.button>
        </motion.div>

        <motion.div variants={itemV} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          <input id="group-search" type="search" className="input" placeholder="🔍 Search by name, city, or topic…" value={search} onChange={e => setSearch(e.target.value)} />
          <div className="chip-bar">
            {FILTERS.map(f => (
              <motion.button key={f} id={`filter-${f.toLowerCase()}`} className={`chip${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)} whileTap={buttonTap}>{f}</motion.button>
            ))}
          </div>
        </motion.div>

        {myGroups.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <div className="section-header"><h2 className="section-title">My Groups</h2><span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{myGroups.length} joined</span></div>
            <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }} variants={staggerV} initial="hidden" animate="visible">
              {myGroups.map(g => <GroupCard key={g.id} group={g} onToggle={toggleJoin} rm={!!rm} itemV={itemV} />)}
            </motion.div>
          </section>
        )}

        {discover.length > 0 ? (
          <section>
            <div className="section-header"><h2 className="section-title">Discover Groups</h2><span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{discover.length} suggestions</span></div>
            <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }} variants={staggerV} initial="hidden" animate="visible">
              {discover.map(g => <GroupCard key={g.id} group={g} onToggle={toggleJoin} rm={!!rm} itemV={itemV} />)}
            </motion.div>
          </section>
        ) : shown.length === 0 ? (
          <EmptyState icon="👥" title="No groups found" description="Try a different search or filter." action={{ label: 'Clear filters', onClick: () => { setSearch(''); setFilter('All'); } }} />
        ) : null}
      </div>
    </div>
  );
}

function GroupCard({ group, onToggle, rm, itemV }: { group: Group; onToggle: (id: string) => void; rm: boolean; itemV: object }) {
  return (
    <motion.div
      id={`group-card-${group.id}`}
      className="card"
      variants={rm ? undefined : itemV as Parameters<typeof motion.div>[0]['variants']}
      whileHover={rm ? undefined : { y: -4, borderColor: 'var(--border-strong)', boxShadow: '0 8px 32px hsla(222,22%,4%,0.7)' }}
      style={{ padding: 22 }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ width: 50, height: 50, borderRadius: 13, background: 'var(--bg-elevated)', display: 'grid', placeItems: 'center', fontSize: 26, flexShrink: 0 }}>{group.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{group.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
            <span>👥 {group.members.toLocaleString()} members</span>
            <span>📍 {group.city}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--brand-teal)', marginTop: 4 }}>💬 {group.activity}</div>
        </div>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>{group.description}</p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {group.tags.map(t => <span key={t} className="badge badge-indigo" style={{ fontSize: 11 }}>{t}</span>)}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {group.joined ? (
          <>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>View Group</button>
            <motion.button id={`leave-group-${group.id}`} className="btn btn-ghost btn-sm" onClick={() => onToggle(group.id)} whileTap={{ scale: 0.96 }} style={{ color: 'var(--text-muted)' }}>Leave</motion.button>
          </>
        ) : (
          <motion.button id={`join-group-${group.id}`} className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => onToggle(group.id)} whileTap={{ scale: 0.96 }}>Join Group</motion.button>
        )}
      </div>
    </motion.div>
  );
}
