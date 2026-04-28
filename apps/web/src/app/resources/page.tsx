'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import AppNav from '@/components/AppNav';
import { useResources, type ApiResource } from '@/hooks/useResources';
import { stagger, fadeUp, buttonTap, reduced } from '@/lib/motion';
import { EmptyState } from '@/components/ui/EmptyState';
import { PostCardSkeleton } from '@/components/ui/Skeleton';

const CATEGORY_ICONS: Record<string, string> = {
  housing: '🏠', roommate: '🛏️', airport_pickup: '✈️', used_items: '📦',
  referral: '💼', student_help: '🎓', h1b_help: '📋', local_service: '🔧', other: '📌',
};
const CATEGORY_LABELS: Record<string, string> = {
  housing: 'Housing', roommate: 'Roommate', airport_pickup: 'Airport Pickup',
  used_items: 'Used Items', referral: 'Referral', student_help: 'Student Help',
  h1b_help: 'H1B / Visa', local_service: 'Local Service', other: 'Other',
};
const CATEGORIES = Object.keys(CATEGORY_LABELS);

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return '1 day ago';
  return `${d} days ago`;
}

export default function ResourcesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const rm = useReducedMotion();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const { data: resources = [], isLoading: resLoading, error } = useResources();

  useEffect(() => { if (!isLoading && !user) router.push('/auth/login'); }, [user, isLoading, router]);
  if (isLoading || !user) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><span style={{ fontSize: 28 }}>⏳</span></div>;

  const shown = resources.filter(r => {
    const s = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    const f = filter === 'All' || r.category === filter;
    return s && f && r.is_active;
  });

  const staggerV = rm ? reduced.stagger : stagger.normal;
  const itemV = rm ? reduced.fadeUp : fadeUp;

  function toggleSave(id: string) {
    setSavedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div>
      <AppNav />
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 24px' }}>
        <motion.div variants={itemV} initial="hidden" animate="visible" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 36, marginBottom: 6 }}>Resource Board</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Housing, airport pickups, H1B help, and more</p>
          </div>
          <motion.button id="post-resource-btn" className="btn btn-primary" whileTap={buttonTap} onClick={() => router.push('/resources/create')}>+ Post Listing</motion.button>
        </motion.div>

        <motion.div variants={itemV} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          <input id="resource-search" type="search" className="input" placeholder="🔍 Search listings…" value={search} onChange={e => setSearch(e.target.value)} />
          <div className="chip-bar">
            <button className={`chip${filter === 'All' ? ' active' : ''}`} onClick={() => setFilter('All')}>All</button>
            {CATEGORIES.map(c => (
              <button key={c} className={`chip${filter === c ? ' active' : ''}`} onClick={() => setFilter(c)}>
                {CATEGORY_ICONS[c]} {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </motion.div>

        {resLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
            {Array.from({ length: 6 }).map((_, i) => <PostCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <EmptyState icon="⚠️" title="Could not load resources" description="Please try again in a moment." action={{ label: 'Retry', onClick: () => window.location.reload() }} />
        ) : shown.length === 0 ? (
          <EmptyState icon="📋" title="No listings found" description={filter !== 'All' ? `No ${CATEGORY_LABELS[filter]} listings right now.` : 'No listings match your search.'} action={{ label: 'Clear filters', onClick: () => { setSearch(''); setFilter('All'); } }} />
        ) : (
          <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }} variants={staggerV} initial="hidden" animate="visible">
            {shown.map(r => (
              <ResourceCard key={r.id} resource={r} isSaved={savedIds.has(r.id)} onSave={toggleSave} rm={!!rm} itemV={itemV} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function ResourceCard({ resource: r, isSaved, onSave, rm, itemV }: {
  resource: ApiResource;
  isSaved: boolean;
  onSave: (id: string) => void;
  rm: boolean;
  itemV: object;
}) {
  const [contactShown, setContactShown] = useState(false);

  return (
    <motion.div
      id={`resource-card-${r.id}`}
      className="card"
      variants={rm ? undefined : itemV as Parameters<typeof motion.div>[0]['variants']}
      whileHover={rm ? undefined : { y: -4, borderColor: 'var(--border-strong)' }}
      style={{ padding: 22, position: 'relative' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 22 }}>{CATEGORY_ICONS[r.category] ?? '📌'}</span>
          <span className="badge badge-indigo" style={{ fontSize: 11 }}>{CATEGORY_LABELS[r.category] ?? r.category}</span>
        </div>
        <button
          id={`save-${r.id}`}
          className="btn btn-ghost btn-sm"
          style={{ color: isSaved ? 'var(--brand-saffron)' : 'var(--text-muted)', fontSize: 18, padding: '4px 6px', lineHeight: 1 }}
          onClick={() => onSave(r.id)}
          title={isSaved ? 'Saved locally' : 'Save locally'}
        >
          {isSaved ? '★' : '☆'}
        </button>
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, lineHeight: 1.4 }}>{r.title}</h3>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>{r.description.substring(0, 150)}{r.description.length > 150 ? '…' : ''}</p>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {r.price && <span>💰 ${parseFloat(r.price).toLocaleString()} {r.currency}</span>}
        <span>🕒 {timeAgo(r.created_at)}</span>
        {r.author_display_name && <span>👤 {r.author_display_name}</span>}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {contactShown ? (
          <div style={{ fontSize: 13, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-sm)', flex: 1 }}>
            {r.contact_detail ? (
              <span>{r.contact_method === 'email' ? '📧' : r.contact_method === 'phone' ? '📱' : '💬'} {r.contact_detail}</span>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>Contact via in-app message</span>
            )}
          </div>
        ) : (
          <motion.button
            id={`contact-${r.id}`}
            className="btn btn-primary btn-sm"
            whileTap={buttonTap}
            onClick={() => setContactShown(true)}
          >
            {r.contact_method === 'in_app' ? '💬 Contact' : r.contact_method === 'email' ? '📧 Email' : '📱 Call'}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
