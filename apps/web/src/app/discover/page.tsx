'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import AppNav from '@/components/AppNav';
import { api } from '@/lib/api';
import { stagger, fadeUp, buttonTap, reduced } from '@/lib/motion';
import { PostCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

const USER_TYPES = ['All', 'student', 'professional', 'entrepreneur', 'family', 'organizer'];
const TYPE_LABELS: Record<string, string> = {
  student: 'Student', professional: 'Professional', entrepreneur: 'Entrepreneur',
  family: 'Family', organizer: 'Organizer',
};

interface DiscoverUser {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  current_city: string | null;
  current_country: string | null;
  user_type: string | null;
  interests: string[] | null;
  languages: string[] | null;
  created_at: string;
}

export default function DiscoverPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const rm = useReducedMotion();

  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [connectState, setConnectState] = useState<Record<string, 'sent' | 'sending'>>({});

  useEffect(() => { if (!isLoading && !user) router.push('/auth/login'); }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(false);
    const params: Record<string, string> = { limit: '50' };
    if (typeFilter !== 'All') params['userType'] = typeFilter;
    api.getDiscoverUsers(params)
      .then((res: any) => setUsers(res.data ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [user, typeFilter]);

  if (isLoading || !user) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><span style={{ fontSize: 28 }}>⏳</span></div>;

  const shown = users.filter(u =>
    !search || u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.current_city?.toLowerCase().includes(search.toLowerCase()) ||
    u.bio?.toLowerCase().includes(search.toLowerCase())
  );

  function handleConnect(userId: string) {
    setConnectState(prev => ({ ...prev, [userId]: 'sending' }));
    // Local-only demo interaction — no connections table in DB
    setTimeout(() => {
      setConnectState(prev => ({ ...prev, [userId]: 'sent' }));
    }, 600);
  }

  const staggerV = rm ? reduced.stagger : stagger.normal;
  const itemV = rm ? reduced.fadeUp : fadeUp;

  return (
    <div>
      <AppNav />
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 24px' }}>
        <motion.div variants={itemV} initial="hidden" animate="visible" style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 36, marginBottom: 6 }}>Discover</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Find and connect with Gujaratis by city, interests, and background</p>
        </motion.div>

        <motion.div variants={itemV} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          <input
            id="discover-search"
            type="search"
            className="input"
            placeholder="🔍 Search by name, city, or bio…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="chip-bar">
            {USER_TYPES.map(t => (
              <motion.button
                key={t}
                className={`chip${typeFilter === t ? ' active' : ''}`}
                onClick={() => setTypeFilter(t)}
                whileTap={buttonTap}
              >
                {t === 'All' ? 'All' : TYPE_LABELS[t] ?? t}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {Array.from({ length: 6 }).map((_, i) => <PostCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <EmptyState icon="⚠️" title="Could not load users" description="Please try again in a moment." action={{ label: 'Retry', onClick: () => window.location.reload() }} />
        ) : shown.length === 0 ? (
          <EmptyState icon="🔍" title="No people found" description="Try a different search or filter." action={{ label: 'Clear filters', onClick: () => { setSearch(''); setTypeFilter('All'); } }} />
        ) : (
          <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }} variants={staggerV} initial="hidden" animate="visible">
            {shown.map(u => (
              <motion.div
                key={u.id}
                id={`user-card-${u.id}`}
                className="card"
                variants={rm ? undefined : itemV as any}
                whileHover={rm ? undefined : { y: -4, borderColor: 'var(--border-strong)' }}
                style={{ padding: 22 }}
              >
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-saffron), var(--brand-indigo))', display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 800, color: 'var(--text-inverse)', flexShrink: 0 }}>
                    {(u.display_name ?? 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{u.display_name ?? 'User'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {u.current_city && <span>📍 {u.current_city}{u.current_country ? `, ${u.current_country}` : ''}</span>}
                      {u.user_type && <span className="badge badge-indigo" style={{ fontSize: 10 }}>{TYPE_LABELS[u.user_type] ?? u.user_type}</span>}
                    </div>
                  </div>
                </div>

                {u.bio && <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>{u.bio.substring(0, 120)}{u.bio.length > 120 ? '…' : ''}</p>}

                {u.interests && u.interests.length > 0 && (
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                    {u.interests.slice(0, 4).map(tag => <span key={tag} className="badge badge-teal" style={{ fontSize: 10 }}>{tag}</span>)}
                  </div>
                )}

                {u.languages && u.languages.length > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                    🗣️ {u.languages.join(', ')}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  {connectState[u.id] === 'sent' ? (
                    <span className="btn btn-sm btn-ghost" style={{ color: 'var(--brand-teal)' }}>✓ Request Sent</span>
                  ) : (
                    <motion.button
                      id={`connect-${u.id}`}
                      className="btn btn-sm btn-indigo"
                      whileTap={buttonTap}
                      onClick={() => handleConnect(u.id)}
                      disabled={connectState[u.id] === 'sending'}
                    >
                      {connectState[u.id] === 'sending' ? 'Sending…' : '🤝 Connect'}
                    </motion.button>
                  )}
                  <motion.button
                    className="btn btn-sm btn-ghost"
                    whileTap={buttonTap}
                    onClick={() => router.push(`/profile/${u.id}`)}
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    View Profile
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
