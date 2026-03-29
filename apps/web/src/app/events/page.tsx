'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import AppNav from '@/components/AppNav';
import { stagger, fadeUp, buttonTap, scalePop, reduced } from '@/lib/motion';
import { EmptyState } from '@/components/ui/EmptyState';

interface Event { id: string; title: string; date: string; time: string; city: string; rsvp: number; capacity: number; type: string; going: boolean; status: 'upcoming' | 'today' | 'full'; description: string; }

const MOCK_EVENTS: Event[] = [
  { id: '1', title: 'Navratri & Garba Night — Chicago', date: 'Sat, Apr 5', time: '7:00 PM', city: 'Chicago, IL', rsvp: 320, capacity: 500, type: 'Garba', going: false, status: 'upcoming', description: 'Join 320+ Gujaratis for the biggest Garba night in Chicago. Dandiya, DJ, and authentic food.' },
  { id: '2', title: 'GJ Career Mixer — NYC', date: 'Sun, Apr 13', time: '6:30 PM', city: 'New York, NY', rsvp: 180, capacity: 200, type: 'Career', going: false, status: 'upcoming', description: 'Speed networking with Gujarati professionals across tech, finance, and consulting.' },
  { id: '3', title: 'Bay Area Cricket Tournament', date: 'Sat, Apr 19', time: '9:00 AM', city: 'San Jose, CA', rsvp: 96, capacity: 100, type: 'Cricket', going: false, status: 'full', description: 'Annual 6-team cricket tournament. Register your team before spots fill up.' },
  { id: '4', title: 'London Gujarati Cultural Evening', date: 'Fri, Apr 25', time: '7:30 PM', city: 'London, UK', rsvp: 255, capacity: 400, type: 'Cultural', going: false, status: 'upcoming', description: 'A vibrant evening of classical music, traditional food, and community connections.' },
  { id: '5', title: 'Houston Diwali Celebration', date: 'Sat, May 3', time: '6:00 PM', city: 'Houston, TX', rsvp: 410, capacity: 600, type: 'Cultural', going: false, status: 'upcoming', description: 'A massive Diwali extravaganza with fireworks, rangoli contest, and starlit dinner.' },
  { id: '6', title: 'GJ Student Mixer — Boston', date: 'Fri, May 9', time: '7:00 PM', city: 'Boston, MA', rsvp: 65, capacity: 150, type: 'Career', going: false, status: 'today', description: 'Connect with fellow Gujarati students at BU, Northeastern, Harvard, and MIT.' },
];

const STATUS_CONFIG = {
  upcoming: { label: 'Upcoming', class: 'badge-indigo' },
  today: { label: '🔥 Today', class: 'badge-saffron' },
  full: { label: 'Full', class: 'badge-neutral' },
};

const TYPE_BADGES: Record<string, string> = { Garba: 'badge-saffron', Career: 'badge-indigo', Cricket: 'badge-teal', Cultural: 'badge-indigo' };
const TYPE_FILTERS = ['All', 'Garba', 'Career', 'Cricket', 'Cultural'];

export default function EventsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const rm = useReducedMotion();
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => { if (!isLoading && !user) router.push('/auth/login'); }, [user, isLoading, router]);
  if (isLoading || !user) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><span style={{ fontSize: 28 }}>⏳</span></div>;

  function toggleRSVP(id: string) {
    setEvents(prev => prev.map(e => e.id === id && e.status !== 'full' ? { ...e, going: !e.going, rsvp: e.going ? e.rsvp - 1 : e.rsvp + 1 } : e));
  }

  const shown = events.filter(e => {
    const s = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.city.toLowerCase().includes(search.toLowerCase());
    const f = filter === 'All' || e.type === filter;
    return s && f;
  });
  const attending = shown.filter(e => e.going);
  const rest = shown.filter(e => !e.going);
  const staggerV = rm ? reduced.stagger : stagger.normal;
  const itemV = rm ? reduced.fadeUp : fadeUp;

  return (
    <div>
      <AppNav />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        <motion.div variants={itemV} initial="hidden" animate="visible" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 36, marginBottom: 6 }}>Events</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Garba nights, career meetups, cricket, and more</p>
          </div>
          <motion.button id="create-event-btn" className="btn btn-primary" whileTap={buttonTap} onClick={() => router.push('/events/create')}>+ Host Event</motion.button>
        </motion.div>

        <motion.div variants={itemV} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          <input id="event-search" type="search" className="input" placeholder="🔍 Search events, cities…" value={search} onChange={e => setSearch(e.target.value)} />
          <div className="chip-bar">
            {TYPE_FILTERS.map(f => (
              <motion.button key={f} id={`filter-event-${f.toLowerCase()}`} className={`chip${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)} whileTap={buttonTap}>{f}</motion.button>
            ))}
          </div>
        </motion.div>

        {attending.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, marginBottom: 14, color: 'var(--brand-teal)', fontWeight: 700 }}>✓ You are attending</h2>
            <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 14 }} variants={staggerV} initial="hidden" animate="visible">
              {attending.map(e => <EventCard key={e.id} event={e} onToggle={toggleRSVP} rm={!!rm} itemV={itemV} />)}
            </motion.div>
          </section>
        )}

        {rest.length > 0 ? (
          <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 14 }} variants={staggerV} initial="hidden" animate="visible">
            {rest.map(e => <EventCard key={e.id} event={e} onToggle={toggleRSVP} rm={!!rm} itemV={itemV} />)}
          </motion.div>
        ) : shown.length === 0 ? (
          <EmptyState icon="🎉" title="No events found" description="Try a different filter or check back soon." action={{ label: 'Clear filters', onClick: () => { setSearch(''); setFilter('All'); } }} />
        ) : null}
      </div>
    </div>
  );
}

function EventCard({ event: evt, onToggle, rm, itemV }: { event: Event; onToggle: (id: string) => void; rm: boolean; itemV: object }) {
  const pct = Math.round((evt.rsvp / evt.capacity) * 100);
  const statusCfg = STATUS_CONFIG[evt.status];
  return (
    <motion.div
      id={`event-card-${evt.id}`}
      className="card"
      variants={rm ? undefined : itemV as Parameters<typeof motion.div>[0]['variants']}
      whileHover={rm ? undefined : { y: -4, borderColor: 'var(--border-strong)' }}
      style={{ padding: 22, position: 'relative', overflow: 'hidden' }}
    >
      {evt.going && (
        <motion.div variants={scalePop} initial="hidden" animate="visible" style={{ position: 'absolute', top: 14, right: 14 }}>
          <span className="badge badge-teal">✓ Going</span>
        </motion.div>
      )}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
        <span className={`badge ${TYPE_BADGES[evt.type] ?? 'badge-indigo'}`}>{evt.type}</span>
        <span className={`badge ${statusCfg.class}`}>{statusCfg.label}</span>
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, paddingRight: evt.going ? 70 : 0, lineHeight: 1.4 }}>{evt.title}</h3>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>{evt.description}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
        <span>📅 {evt.date} · {evt.time}</span>
        <span>📍 {evt.city}</span>
      </div>
      {/* Capacity bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
          <span>👥 {evt.rsvp} attending</span>
          <span>{pct}% full</span>
        </div>
        <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
          <motion.div
            style={{ height: '100%', background: pct > 85 ? 'var(--brand-rose)' : 'var(--brand-saffron)', borderRadius: 4 }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-secondary btn-sm">Details</button>
        <motion.button
          id={`rsvp-${evt.id}`}
          className={`btn btn-sm ${evt.going ? 'btn-ghost' : evt.status === 'full' ? 'btn-ghost' : 'btn-primary'}`}
          onClick={() => onToggle(evt.id)}
          whileTap={evt.status !== 'full' ? buttonTap : undefined}
          style={{ color: evt.going ? '#f87171' : evt.status === 'full' ? 'var(--text-muted)' : undefined }}
          disabled={evt.status === 'full' && !evt.going}
        >
          {evt.going ? 'Cancel RSVP' : evt.status === 'full' ? 'Event Full' : '🎟️ RSVP'}
        </motion.button>
      </div>
    </motion.div>
  );
}
