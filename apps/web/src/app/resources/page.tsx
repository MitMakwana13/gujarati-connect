'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import AppNav from '@/components/AppNav';
import { stagger, fadeUp, buttonTap, reduced } from '@/lib/motion';
import { EmptyState } from '@/components/ui/EmptyState';

const CATEGORIES = [
  { id: 'housing', emoji: '🏠', label: 'Housing', count: 142 },
  { id: 'airport', emoji: '✈️', label: 'Airport Pickups', count: 48 },
  { id: 'visa', emoji: '📋', label: 'H-1B / Visa Help', count: 93 },
  { id: 'student', emoji: '🎓', label: 'Student Support', count: 67 },
  { id: 'jobs', emoji: '💼', label: 'Job Referrals', count: 85 },
  { id: 'items', emoji: '🛋️', label: 'Used Items', count: 201 },
];

interface Listing { id: string; title: string; category: string; city: string; author: string; age: string; price: string; saved: boolean; contacted: boolean; trending: boolean; }

const MOCK_LISTINGS: Listing[] = [
  { id: '1', title: '2BR available near BU (Sep)', category: 'housing', city: 'Boston, MA', author: 'Priya M.', age: '3h', price: '$1,200/mo', saved: false, contacted: false, trending: false },
  { id: '2', title: 'Free airport pickup SFO — any airline', category: 'airport', city: 'San Francisco, CA', author: 'Raj P.', age: '8h', price: 'Free', saved: true, contacted: false, trending: true },
  { id: '3', title: 'H-1B RFE responses — 3 successful', category: 'visa', city: 'Remote', author: 'Neel D.', age: '1d', price: 'Free consult', saved: false, contacted: false, trending: true },
  { id: '4', title: 'IKEA desk + chair — moving out', category: 'items', city: 'New York, NY', author: 'Asha K.', age: '2d', price: '$80 OBO', saved: true, contacted: false, trending: false },
  { id: '5', title: 'Software engineer referrals — Meta/Google', category: 'jobs', city: 'Remote', author: 'Chirag S.', age: '4h', price: 'Free', saved: false, contacted: false, trending: true },
  { id: '6', title: 'GJ Student buddy system — BCU', category: 'student', city: 'Birmingham, UK', author: 'Foram P.', age: '6h', price: 'Free', saved: false, contacted: false, trending: false },
];

const CAT_COLORS: Record<string, string> = { housing: 'badge-saffron', airport: 'badge-teal', visa: 'badge-indigo', items: 'badge-indigo', jobs: 'badge-indigo', student: 'badge-teal' };
const CAT_LABELS: Record<string, string> = { housing: 'Housing', airport: 'Airport Pickup', visa: 'H-1B Help', items: 'Used Items', jobs: 'Job Referrals', student: 'Student Support' };

export default function ResourcesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const rm = useReducedMotion();
  const [listings, setListings] = useState(MOCK_LISTINGS);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');

  useEffect(() => { if (!isLoading && !user) router.push('/auth/login'); }, [user, isLoading, router]);
  if (isLoading || !user) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><span style={{ fontSize: 28 }}>⏳</span></div>;

  function toggleSave(id: string) { setListings(prev => prev.map(l => l.id === id ? { ...l, saved: !l.saved } : l)); }
  function markContacted(id: string) { setListings(prev => prev.map(l => l.id === id ? { ...l, contacted: true } : l)); }

  const shown = listings.filter(l => {
    const s = !search || l.title.toLowerCase().includes(search.toLowerCase()) || l.city.toLowerCase().includes(search.toLowerCase());
    const c = !selectedCat || l.category === selectedCat;
    return s && c;
  });

  const staggerV = rm ? reduced.stagger : stagger.normal;
  const itemV = rm ? reduced.fadeUp : fadeUp;

  return (
    <div>
      <AppNav />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        <motion.div variants={itemV} initial="hidden" animate="visible" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 36, marginBottom: 6 }}>Resource Board</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Community-powered listings — housing, rides, referrals, and more</p>
          </div>
          <motion.button id="post-resource-btn" className="btn btn-primary" whileTap={buttonTap} onClick={() => router.push('/resources/create')}>+ Post Listing</motion.button>
        </motion.div>

        {/* Category grid */}
        <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }} variants={staggerV} initial="hidden" animate="visible">
          {CATEGORIES.map(cat => (
            <motion.button
              id={`cat-${cat.id}`}
              key={cat.id}
              variants={rm ? undefined : itemV}
              whileHover={rm ? undefined : { y: -3, borderColor: 'var(--brand-saffron)' }}
              whileTap={buttonTap}
              onClick={() => setSelectedCat(selectedCat === cat.id ? '' : cat.id)}
              className="card"
              style={{
                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left',
                border: selectedCat === cat.id ? '1px solid var(--brand-saffron)' : '1px solid var(--border)',
                background: selectedCat === cat.id ? 'hsla(32,98%,55%,0.08)' : 'var(--bg-glass)',
              }}
            >
              <span style={{ fontSize: 26 }}>{cat.emoji}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{cat.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cat.count} listings</div>
              </div>
            </motion.button>
          ))}
        </motion.div>

        <motion.input variants={itemV} initial="hidden" animate="visible" id="resource-search" type="search" className="input" placeholder="🔍 Search listings…" style={{ marginBottom: 22 }} value={search} onChange={e => setSearch(e.target.value)} />

        {/* Trending */}
        {!selectedCat && !search && (
          <div style={{ marginBottom: 28 }}>
            <div className="section-header"><h2 className="section-title" style={{ fontSize: 16 }}>🔥 Trending Now</h2></div>
            <motion.div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} variants={staggerV} initial="hidden" animate="visible">
              {listings.filter(l => l.trending).map(item => <ListingRow key={item.id} item={item} onSave={toggleSave} onContact={markContacted} rm={!!rm} itemV={itemV} />)}
            </motion.div>
            <div className="divider" style={{ margin: '20px 0' }} />
            <div className="section-header"><h2 className="section-title" style={{ fontSize: 16 }}>All Listings</h2></div>
          </div>
        )}

        {shown.length > 0 ? (
          <motion.div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} variants={staggerV} initial="hidden" animate="visible">
            {shown.map(item => <ListingRow key={item.id} item={item} onSave={toggleSave} onContact={markContacted} rm={!!rm} itemV={itemV} />)}
          </motion.div>
        ) : (
          <EmptyState icon="📋" title="No listings found" description="Try adjusting your search or clearing the filter." action={{ label: 'Clear filters', onClick: () => { setSearch(''); setSelectedCat(''); } }} />
        )}
      </div>
    </div>
  );
}

function ListingRow({ item, onSave, onContact, rm, itemV }: { item: Listing; onSave: (id: string) => void; onContact: (id: string) => void; rm: boolean; itemV: object }) {
  return (
    <motion.div
      id={`listing-${item.id}`}
      className="card"
      variants={rm ? undefined : itemV as Parameters<typeof motion.div>[0]['variants']}
      whileHover={rm ? undefined : { y: -2, borderColor: 'var(--border-strong)' }}
      style={{ padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'center' }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{item.title}</span>
          <span className={`badge ${CAT_COLORS[item.category] ?? 'badge-indigo'}`} style={{ fontSize: 11 }}>{CAT_LABELS[item.category]}</span>
          {item.trending && <span className="badge badge-saffron" style={{ fontSize: 11 }}>🔥 Trending</span>}
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
          <span>📍 {item.city}</span>
          <span>👤 {item.author}</span>
          <span>🕐 {item.age}</span>
          <span style={{ color: 'var(--brand-saffron)', fontWeight: 600 }}>💰 {item.price}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        <motion.button
          id={`contact-${item.id}`}
          className={`btn btn-sm ${item.contacted ? 'btn-ghost' : 'btn-primary'}`}
          onClick={() => onContact(item.id)}
          whileTap={buttonTap}
          style={{ color: item.contacted ? 'var(--brand-teal)' : undefined }}
        >
          {item.contacted ? '✓ Contacted' : 'Contact'}
        </motion.button>
        <motion.button
          id={`save-${item.id}`}
          className="btn btn-ghost btn-sm"
          onClick={() => onSave(item.id)}
          whileTap={buttonTap}
          style={{ color: item.saved ? 'var(--brand-saffron)' : 'var(--text-muted)' }}
        >
          {item.saved ? '🔖 Saved' : '🔖 Save'}
        </motion.button>
      </div>
    </motion.div>
  );
}
