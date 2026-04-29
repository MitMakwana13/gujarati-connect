'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import AppNav from '@/components/AppNav';
import { stagger, fadeUp, buttonTap, reduced } from '@/lib/motion';
import { EmptyState } from '@/components/ui/EmptyState';
import { PostCardSkeleton } from '@/components/ui/Skeleton';

type DiscoverUser = {
  id: string;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  current_city?: string | null;
  current_country?: string | null;
  user_type?: string | null;
  interests?: string[] | null;
  languages?: string[] | null;
};

const USER_TYPES = ['all', 'student', 'professional', 'entrepreneur', 'family', 'organizer'];

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'GG';
}

function label(value?: string | null) {
  if (!value) return '';
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function DiscoverPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const rm = useReducedMotion();
  const [search, setSearch] = useState('');
  const [userType, setUserType] = useState('all');
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  useEffect(() => { if (!isLoading && !user) router.push('/auth/login'); }, [user, isLoading, router]);

  const { data: users = [], isLoading: usersLoading, error } = useQuery({
    queryKey: ['discover-users', userType],
    enabled: !!user,
    queryFn: async () => {
      const params: Record<string, string> = { limit: '50' };
      if (userType !== 'all') params.userType = userType;
      const { data } = await api.getDiscoverUsers(params);
      return (data ?? []) as DiscoverUser[];
    },
  });

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const haystack = [
        u.display_name,
        u.bio,
        u.current_city,
        u.current_country,
        u.user_type,
        ...(u.interests ?? []),
        ...(u.languages ?? []),
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [users, search]);

  if (isLoading || !user) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><span style={{ fontSize: 28 }}>⏳</span></div>;
  }

  const staggerV = rm ? reduced.stagger : stagger.normal;
  const itemV = rm ? reduced.fadeUp : fadeUp;

  function connect(userId: string) {
    setSentRequests(prev => new Set(prev).add(userId));
  }

  return (
    <div>
      <AppNav />
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 24px' }}>
        <motion.div variants={itemV} initial="hidden" animate="visible" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 36, marginBottom: 6 }}>Discover Your People</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Find Gujaratis by city, background, interests, and professional path.</p>
          </div>
          <button className="btn btn-secondary" onClick={() => router.push('/feed')}>Back to Feed</button>
        </motion.div>

        <motion.div variants={itemV} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          <input
            id="discover-search"
            type="search"
            className="input"
            placeholder="🔍 Search people, cities, interests…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="chip-bar">
            {USER_TYPES.map(type => (
              <motion.button
                key={type}
                id={`discover-filter-${type}`}
                className={`chip${userType === type ? ' active' : ''}`}
                onClick={() => setUserType(type)}
                whileTap={buttonTap}
              >
                {type === 'all' ? 'All' : label(type)}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {usersLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {Array.from({ length: 6 }).map((_, i) => <PostCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <EmptyState icon="⚠️" title="Could not load people" description="Please try again in a moment." action={{ label: 'Retry', onClick: () => window.location.reload() }} />
        ) : shown.length === 0 ? (
          <EmptyState icon="🔍" title="No people found" description="Try another search or filter." action={{ label: 'Clear filters', onClick: () => { setSearch(''); setUserType('all'); } }} />
        ) : (
          <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }} variants={staggerV} initial="hidden" animate="visible">
            {shown.map((person) => {
              const name = person.display_name ?? 'Gujarati Global Member';
              const sent = sentRequests.has(person.id);
              return (
                <motion.div
                  key={person.id}
                  id={`discover-user-${person.id}`}
                  className="card"
                  variants={itemV}
                  whileHover={rm ? undefined : { y: -4, borderColor: 'var(--border-strong)' }}
                  style={{ padding: 22 }}
                >
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
                    {person.avatar_url ? (
                      <img src={person.avatar_url} alt={name} style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-saffron), var(--brand-indigo))', display: 'grid', placeItems: 'center', fontWeight: 800, color: 'var(--text-inverse)' }}>
                        {initials(name)}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{name}</h3>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {[person.current_city, person.current_country].filter(Boolean).join(', ') || 'Location not shared'}
                      </div>
                      {person.user_type && <span className="badge badge-indigo" style={{ marginTop: 8 }}>{label(person.user_type)}</span>}
                    </div>
                  </div>

                  {person.bio && <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>{person.bio.substring(0, 150)}{person.bio.length > 150 ? '…' : ''}</p>}

                  {(person.interests?.length ?? 0) > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                      {person.interests!.slice(0, 5).map(interest => <span key={interest} className="badge badge-teal" style={{ fontSize: 11 }}>{interest}</span>)}
                    </div>
                  )}

                  <motion.button
                    id={`connect-${person.id}`}
                    className={`btn btn-sm ${sent ? 'btn-secondary' : 'btn-primary'}`}
                    whileTap={buttonTap}
                    onClick={() => connect(person.id)}
                    disabled={sent}
                    style={{ width: '100%' }}
                  >
                    {sent ? '✓ Request Sent' : '🤝 Connect'}
                  </motion.button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
