'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import AppNav from '@/components/AppNav';
import { stagger, fadeUp, cardHover, buttonTap, slideInRight, reduced } from '@/lib/motion';
import { PersonCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

interface Person {
  id: string;
  name: string;
  initials: string;
  city: string;
  roots: string;
  industry: string;
  role: string;
  mutualGroups: number;
  mutualEvents: number;
  lastActive: string;
  bio: string;
  interests: string[];
  groups: string[];
  verified: boolean;
  connected: boolean;
  profileComplete: number;
  reasonText: string;
}

const MOCK_PEOPLE: Person[] = [
  { id: '1', name: 'Dhruv Desai', initials: 'DD', city: 'San Francisco, CA', roots: 'Ahmedabad, Gujarat', industry: 'Technology', role: 'Product Manager @ Meta', mutualGroups: 3, mutualEvents: 1, lastActive: '2h ago', bio: 'Building products that scale. Passionate about the Gujarati startup ecosystem and Navratri. Always happy to help with US immigration questions.', interests: ['#Startups', '#Garba', '#Immigration'], groups: ['Bay Area Gujaratis', 'GJ Startup Network'], verified: true, connected: false, profileComplete: 92, reasonText: 'Also from Ahmedabad · In 3 of your groups' },
  { id: '2', name: 'Riya Shah', initials: 'RS', city: 'London, UK', roots: 'Surat, Gujarat', industry: 'Finance', role: 'Investment Analyst @ Barclays', mutualGroups: 1, mutualEvents: 2, lastActive: '4h ago', bio: 'Finance professional navigating London life. Love connecting with Gujaratis in the UK, especially around festivals and networking.', interests: ['#Finance', '#Cultural', '#London'], groups: ['UK Patidars', 'London Gujarati Network'], verified: true, connected: false, profileComplete: 88, reasonText: 'Shared roots in Surat · Active in Events' },
  { id: '3', name: 'Nitin Patel', initials: 'NP', city: 'Toronto, Canada', roots: 'Rajkot, Gujarat', industry: 'Healthcare', role: 'Family Doctor', mutualGroups: 2, mutualEvents: 0, lastActive: '1d ago', bio: 'Physician helping the Gujarati community in Toronto navigate healthcare. Happy to answer health questions and discuss immigration to Canada.', interests: ['#Healthcare', '#CanadaLife', '#Vegetarian'], groups: ['Canada Gujarati Network', 'Toronto GJ Network'], verified: false, connected: false, profileComplete: 74, reasonText: 'In your industry · Lives in Toronto' },
  { id: '4', name: 'Minal Joshi', initials: 'MJ', city: 'New York, NY', roots: 'Vadodara, Gujarat', industry: 'Education', role: 'Professor @ NYU', mutualGroups: 1, mutualEvents: 1, lastActive: '6h ago', bio: 'Education researcher and cultural ambassador. Organizing Gujarati language classes and cultural events around NYC.', interests: ['#Education', '#Culture', '#NYCGujaratis'], groups: ['NYC Gujarati Youth', 'Baroda Alumni USA'], verified: true, connected: true, profileComplete: 95, reasonText: 'Both attending Garba Night NYC' },
  { id: '5', name: 'Karan Mehta', initials: 'KM', city: 'Chicago, IL', roots: 'Anand, Gujarat', industry: 'Engineering', role: 'Software Engineer @ Google', mutualGroups: 2, mutualEvents: 3, lastActive: '30m ago', bio: 'SWE at Google. Love helping students break into FAANG. Big cricket fan — playing for Chicago Gujarati Cricket Club.', interests: ['#SoftwareEngineering', '#Cricket', '#FAANG'], groups: ['Chicago Gujarati Assoc.', 'Bay Area Gujaratis'], verified: true, connected: false, profileComplete: 89, reasonText: 'Highly active · 3 mutual events · Nearby' },
  { id: '6', name: 'Prachi Vora', initials: 'PV', city: 'Houston, TX', roots: 'Bhavnagar, Gujarat', industry: 'Technology', role: 'UX Designer @ Amazon', mutualGroups: 1, mutualEvents: 0, lastActive: '12h ago', bio: 'Designing inclusive products. Passionate about elevating Gujarati culture through art and digital experiences.', interests: ['#Design', '#Art', '#Gujarati'], groups: ['Houston Gujarati Network'], verified: false, connected: false, profileComplete: 82, reasonText: 'Same industry · Design community' },
];

// Intelligent ranking: sort by match score
function rankPeople(people: Person[], _userId: string): Person[] {
  return [...people].sort((a, b) => {
    let scoreA = 0, scoreB = 0;
    if (!a.connected) scoreA += a.mutualGroups * 15;
    if (!b.connected) scoreB += b.mutualGroups * 15;
    scoreA += a.mutualEvents * 10;
    scoreB += b.mutualEvents * 10;
    scoreA += a.profileComplete * 0.5;
    scoreB += b.profileComplete * 0.5;
    if (a.verified) scoreA += 20;
    if (b.verified) scoreB += 20;
    if (a.connected) scoreA -= 50;
    if (b.connected) scoreB -= 50;
    return scoreB - scoreA;
  });
}

const FILTERS = ['All', 'Technology', 'Finance', 'Healthcare', 'Education', 'Engineering'];

export default function DiscoverPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const rm = useReducedMotion();
  const [people, setPeople] = useState<Person[]>([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.push('/auth/login');
  }, [user, isLoading, router]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPeople(rankPeople(MOCK_PEOPLE, user?.id ?? ''));
      setLoading(false);
    }, 1000);
    return () => clearTimeout(t);
  }, [user]);

  if (isLoading || !user) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><span style={{ fontSize: 28 }}>⏳</span></div>;

  function toggleConnect(id: string) {
    setPeople(prev => prev.map(p => p.id === id ? { ...p, connected: !p.connected } : p));
    if (selected?.id === id) setSelected(s => s ? { ...s, connected: !s.connected } : null);
  }

  const shown = people.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.city.toLowerCase().includes(search.toLowerCase()) || p.roots.toLowerCase().includes(search.toLowerCase()) || p.industry.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || p.industry === filter;
    return matchSearch && matchFilter;
  });

  const connected = shown.filter(p => p.connected);
  const suggestions = shown.filter(p => !p.connected);

  const staggerV = rm ? reduced.stagger : stagger.fast;
  const itemV = rm ? reduced.fadeUp : fadeUp;

  return (
    <div>
      <AppNav />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <motion.div variants={itemV} initial="hidden" animate="visible" style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 38, marginBottom: 8 }}>
            <span className="gradient-text">Discover</span> your people
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
            Ranked by shared roots, mutual communities, and activity — not just random members.
          </p>
        </motion.div>

        {/* Search + filters */}
        <motion.div variants={itemV} initial="hidden" animate="visible" transition={{ delay: 0.08 }} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
          <input
            id="discover-search"
            type="search"
            className="input"
            placeholder="🔍 Search by name, city, roots, or industry…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="chip-bar">
            {FILTERS.map(f => (
              <motion.button key={f} id={`filter-${f.toLowerCase()}`} className={`chip${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)} whileTap={buttonTap}>
                {f}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Connected people */}
        {connected.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <div className="section-header">
              <h2 className="section-title" style={{ color: 'var(--brand-teal)' }}>✓ Connected</h2>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{connected.length} people</span>
            </div>
            <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }} variants={staggerV} initial="hidden" animate="visible">
              {connected.map(p => <PersonCard key={p.id} person={p} onSelect={setSelected} onConnect={toggleConnect} rm={!!rm} />)}
            </motion.div>
          </section>
        )}

        {/* Smart suggestions */}
        {loading ? (
          <>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 16 }}>Finding your best matches…</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
              {Array.from({ length: 6 }).map((_, i) => <PersonCardSkeleton key={i} />)}
            </div>
          </>
        ) : suggestions.length === 0 ? (
          <EmptyState icon="🔍" title="No matches found" description="Try adjusting your search or clearing filters." action={{ label: 'Clear filters', onClick: () => { setSearch(''); setFilter('All'); } }} />
        ) : (
          <>
            <div className="section-header" style={{ marginBottom: 16 }}>
              <h2 className="section-title">Suggested for You</h2>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Ranked by relevance</span>
            </div>
            <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }} variants={staggerV} initial="hidden" animate="visible">
              {suggestions.map(p => <PersonCard key={p.id} person={p} onSelect={setSelected} onConnect={toggleConnect} rm={!!rm} />)}
            </motion.div>
          </>
        )}
      </div>

      {/* Profile Side Sheet */}
      <AnimatePresence>
        {selected && (
          <div className="profile-sheet">
            <motion.div
              className="profile-sheet-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
            />
            <motion.div
              className="profile-sheet-panel"
              variants={rm ? undefined : slideInRight}
              initial="hidden" animate="visible" exit="exit"
            >
              {/* Close */}
              <button className="btn btn-ghost btn-sm" style={{ marginBottom: 24 }} onClick={() => setSelected(null)}>← Back</button>

              {/* Avatar */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-saffron), var(--brand-indigo))', display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 800, color: 'var(--text-inverse)', flexShrink: 0 }}>
                  {selected.initials}
                </div>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <h2 style={{ fontSize: 22 }}>{selected.name}</h2>
                    {selected.verified && <span className="badge badge-teal" style={{ fontSize: 11 }}>✓ Verified</span>}
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{selected.role}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>📍 {selected.city} · 🏡 {selected.roots}</p>
                </div>
              </div>

              {/* Reason */}
              <div style={{ padding: '10px 14px', background: 'hsla(247,75%,64%,0.1)', border: '1px solid hsla(247,75%,64%,0.2)', borderRadius: 'var(--r-sm)', fontSize: 13, color: 'var(--brand-indigo)', marginBottom: 20 }}>
                💡 {selected.reasonText}
              </div>

              {/* CTA */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                <motion.button
                  id={`sheet-connect-${selected.id}`}
                  className={`btn btn-sm ${selected.connected ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ flex: 1, color: selected.connected ? 'var(--brand-teal)' : undefined }}
                  whileTap={buttonTap}
                  onClick={() => toggleConnect(selected.id)}
                >
                  {selected.connected ? '✓ Connected' : '+ Connect'}
                </motion.button>
                <motion.button
                  id={`sheet-message-${selected.id}`}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                  whileTap={buttonTap}
                  onClick={() => { router.push('/messages'); setSelected(null); }}
                >
                  💬 Message
                </motion.button>
              </div>

              <div className="divider" style={{ marginBottom: 20 }} />

              {/* Bio */}
              <h3 style={{ fontSize: 15, marginBottom: 8 }}>About</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>{selected.bio}</p>

              {/* Interests */}
              <h3 style={{ fontSize: 15, marginBottom: 8 }}>Interests</h3>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                {selected.interests.map(i => <span key={i} className="badge badge-indigo">{i}</span>)}
              </div>

              {/* Groups */}
              <h3 style={{ fontSize: 15, marginBottom: 8 }}>Communities</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selected.groups.map(g => (
                  <div key={g} style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-sm)', fontSize: 13, fontWeight: 500 }}>👥 {g}</div>
                ))}
              </div>

              {/* Mutuals */}
              {(selected.mutualGroups > 0 || selected.mutualEvents > 0) && (
                <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
                  {selected.mutualGroups > 0 && <span className="badge badge-teal">{selected.mutualGroups} mutual groups</span>}
                  {selected.mutualEvents > 0 && <span className="badge badge-saffron">{selected.mutualEvents} mutual events</span>}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PersonCard({ person, onSelect, onConnect, rm }: { person: Person; onSelect: (p: Person) => void; onConnect: (id: string) => void; rm: boolean }) {
  return (
    <motion.div
      id={`person-card-${person.id}`}
      className="card"
      variants={rm ? undefined : fadeUp}
      whileHover={rm ? undefined : { y: -4, boxShadow: '0 8px 32px hsla(222,22%,4%,0.7)', borderColor: 'var(--border-strong)' }}
      transition={{ duration: 0.2 }}
      style={{ padding: 20, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12 }}
      onClick={() => onSelect(person)}
    >
      {/* Avatar + presence */}
      <div style={{ position: 'relative', width: 'fit-content', margin: '0 auto' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-saffron), var(--brand-indigo))', display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 800, color: 'var(--text-inverse)' }}>
          {person.initials}
        </div>
        {person.lastActive.includes('m ago') || person.lastActive.includes('h ago') && parseInt(person.lastActive) < 3 ? (
          <div className="presence-dot online" style={{ position: 'absolute', bottom: 2, right: 2 }} />
        ) : (
          <div className="presence-dot offline" style={{ position: 'absolute', bottom: 2, right: 2 }} />
        )}
      </div>

      {/* Info */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
          {person.name}
          {person.verified && <span style={{ fontSize: 14 }}>✓</span>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{person.role}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>📍 {person.city}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>🏡 {person.roots}</div>
      </div>

      {/* Reason tag */}
      <div style={{ fontSize: 11, color: 'var(--brand-indigo)', background: 'hsla(247,75%,64%,0.1)', padding: '4px 8px', borderRadius: 'var(--r-sm)', textAlign: 'center', lineHeight: 1.4 }}>
        💡 {person.reasonText}
      </div>

      {/* Mutual badges */}
      {(person.mutualGroups > 0 || person.mutualEvents > 0) && (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
          {person.mutualGroups > 0 && <span className="badge badge-teal" style={{ fontSize: 11 }}>{person.mutualGroups} mutual groups</span>}
          {person.mutualEvents > 0 && <span className="badge badge-saffron" style={{ fontSize: 11 }}>{person.mutualEvents} mutual events</span>}
        </div>
      )}

      {/* CTA */}
      <motion.button
        id={`connect-${person.id}`}
        className={`btn btn-sm ${person.connected ? 'btn-ghost' : 'btn-primary'}`}
        style={{ width: '100%', color: person.connected ? 'var(--brand-teal)' : undefined }}
        whileTap={buttonTap}
        onClick={e => { e.stopPropagation(); onConnect(person.id); }}
      >
        {person.connected ? '✓ Connected' : '+ Connect'}
      </motion.button>
    </motion.div>
  );
}
