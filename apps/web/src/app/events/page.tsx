'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import AppNav from '@/components/AppNav';
import { useEvents, useRSVP, useCancelRSVP, type ApiEvent } from '@/hooks/useEvents';
import { stagger, fadeUp, buttonTap, scalePop, reduced } from '@/lib/motion';
import { EmptyState } from '@/components/ui/EmptyState';
import { PostCardSkeleton } from '@/components/ui/Skeleton';

const TYPE_BADGES: Record<string, string> = {
  garba: 'badge-saffron', career: 'badge-indigo', cricket: 'badge-teal',
  cultural: 'badge-indigo', meetup: 'badge-teal', social: 'badge-indigo',
  religious: 'badge-saffron', other: 'badge-indigo',
};
const TYPE_FILTERS = ['All', 'garba', 'career', 'cricket', 'cultural', 'social'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
function formatTime(iso: string, tz: string) {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: tz });
  } catch {
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
}

export default function EventsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const rm = useReducedMotion();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const { data: events = [], isLoading: eventsLoading, error } = useEvents();
  const rsvpMutation = useRSVP();
  const cancelRsvpMutation = useCancelRSVP();

  useEffect(() => { if (!isLoading && !user) router.push('/auth/login'); }, [user, isLoading, router]);
  if (isLoading || !user) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><span style={{ fontSize: 28 }}>⏳</span></div>;

  const shown = events.filter(e => {
    const s = !search || e.title.toLowerCase().includes(search.toLowerCase()) || (e.venue_name ?? '').toLowerCase().includes(search.toLowerCase());
    const f = filter === 'All' || e.event_type === filter;
    return s && f;
  });

  const attending = shown.filter(e => e.my_rsvp === 'going');
  const rest = shown.filter(e => e.my_rsvp !== 'going');

  const staggerV = rm ? reduced.stagger : stagger.normal;
  const itemV = rm ? reduced.fadeUp : fadeUp;

  function handleRsvp(evt: ApiEvent) {
    if (evt.my_rsvp === 'going') {
      cancelRsvpMutation.mutate({ id: evt.id });
    } else {
      rsvpMutation.mutate({ id: evt.id, status: 'going' });
    }
  }

  const isFull = (evt: ApiEvent) => evt.max_attendees !== null && evt.rsvp_count >= evt.max_attendees && evt.my_rsvp !== 'going';

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
          <input id="event-search" type="search" className="input" placeholder="🔍 Search events, venues…" value={search} onChange={e => setSearch(e.target.value)} />
          <div className="chip-bar">
            {TYPE_FILTERS.map(f => (
              <motion.button key={f} id={`filter-event-${f.toLowerCase()}`} className={`chip${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)} whileTap={buttonTap}>
                {f === 'All' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {eventsLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 14 }}>
            {Array.from({ length: 4 }).map((_, i) => <PostCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <EmptyState icon="⚠️" title="Could not load events" description="Make sure the API server is running." action={{ label: 'Retry', onClick: () => window.location.reload() }} />
        ) : (
          <>
            {attending.length > 0 && (
              <section style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 16, marginBottom: 14, color: 'var(--brand-teal)', fontWeight: 700 }}>✓ You are attending</h2>
                <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 14 }} variants={staggerV} initial="hidden" animate="visible">
                  {attending.map(e => <EventCard key={e.id} event={e} onToggle={handleRsvp} isFull={isFull(e)} rm={!!rm} itemV={itemV} isLoading={rsvpMutation.isPending || cancelRsvpMutation.isPending} />)}
                </motion.div>
              </section>
            )}

            {rest.length > 0 ? (
              <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 14 }} variants={staggerV} initial="hidden" animate="visible">
                {rest.map(e => <EventCard key={e.id} event={e} onToggle={handleRsvp} isFull={isFull(e)} rm={!!rm} itemV={itemV} isLoading={rsvpMutation.isPending || cancelRsvpMutation.isPending} />)}
              </motion.div>
            ) : shown.length === 0 ? (
              <EmptyState icon="🎉" title="No events found" description="Try a different filter or check back soon." action={{ label: 'Clear filters', onClick: () => { setSearch(''); setFilter('All'); } }} />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function EventCard({ event: evt, onToggle, isFull, rm, itemV, isLoading }: {
  event: ApiEvent;
  onToggle: (e: ApiEvent) => void;
  isFull: boolean;
  rm: boolean;
  itemV: object;
  isLoading: boolean;
}) {
  const pct = evt.max_attendees ? Math.min(100, Math.round((evt.rsvp_count / evt.max_attendees) * 100)) : 0;
  const isGoing = evt.my_rsvp === 'going';
  const typeBadge = TYPE_BADGES[evt.event_type ?? ''] ?? 'badge-indigo';

  return (
    <motion.div
      id={`event-card-${evt.id}`}
      className="card"
      variants={rm ? undefined : itemV as Parameters<typeof motion.div>[0]['variants']}
      whileHover={rm ? undefined : { y: -4, borderColor: 'var(--border-strong)' }}
      style={{ padding: 22, position: 'relative', overflow: 'hidden' }}
    >
      {isGoing && (
        <motion.div variants={scalePop} initial="hidden" animate="visible" style={{ position: 'absolute', top: 14, right: 14 }}>
          <span className="badge badge-teal">✓ Going</span>
        </motion.div>
      )}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
        {evt.event_type && <span className={`badge ${typeBadge}`}>{evt.event_type}</span>}
        {isFull && <span className="badge badge-neutral">Full</span>}
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, paddingRight: isGoing ? 70 : 0, lineHeight: 1.4 }}>{evt.title}</h3>
      {evt.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>{evt.description.substring(0, 120)}{evt.description.length > 120 ? '…' : ''}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
        <span>📅 {formatDate(evt.starts_at)} · {formatTime(evt.starts_at, evt.timezone)}</span>
        {evt.venue_name && <span>📍 {evt.venue_name}</span>}
        <span>👤 by {evt.organizer_name}</span>
      </div>
      {evt.max_attendees && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
            <span>👥 {evt.rsvp_count} attending</span>
            <span>{pct}% full</span>
          </div>
          <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
            <motion.div style={{ height: '100%', background: pct > 85 ? 'var(--brand-rose)' : 'var(--brand-saffron)', borderRadius: 4 }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, delay: 0.2 }} />
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <motion.button
          id={`rsvp-${evt.id}`}
          className={`btn btn-sm ${isGoing ? 'btn-ghost' : isFull ? 'btn-ghost' : 'btn-primary'}`}
          onClick={() => onToggle(evt)}
          whileTap={!isFull ? buttonTap : undefined}
          style={{ color: isGoing ? '#f87171' : isFull ? 'var(--text-muted)' : undefined }}
          disabled={(isFull && !isGoing) || isLoading}
        >
          {isGoing ? 'Cancel RSVP' : isFull ? 'Event Full' : '🎟️ RSVP'}
        </motion.button>
      </div>
    </motion.div>
  );
}
