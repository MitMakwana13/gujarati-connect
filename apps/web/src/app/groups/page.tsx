'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import AppNav from '@/components/AppNav';
import { useGroups, useJoinGroup, useLeaveGroup, type ApiGroup } from '@/hooks/useGroups';
import { stagger, fadeUp, buttonTap, reduced } from '@/lib/motion';
import { EmptyState } from '@/components/ui/EmptyState';
import { PostCardSkeleton } from '@/components/ui/Skeleton';

const TAG_COLORS: Record<string, string> = {
  cricket: 'badge-teal', garba: 'badge-saffron', career: 'badge-indigo',
  students: 'badge-indigo', 'bay area': 'badge-teal', houston: 'badge-teal',
};

export default function GroupsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const rm = useReducedMotion();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');

  const { data: groups = [], isLoading: groupsLoading, error } = useGroups();
  const joinMutation = useJoinGroup();
  const leaveMutation = useLeaveGroup();

  useEffect(() => { if (!isLoading && !user) router.push('/auth/login'); }, [user, isLoading, router]);
  if (isLoading || !user) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><span style={{ fontSize: 28 }}>⏳</span></div>;

  const isMember = (g: ApiGroup) => g.myMembership?.status === 'active';
  const isPending = (g: ApiGroup) => g.myMembership?.status === 'pending';

  const shown = groups
    .filter(g => !search || g.name.toLowerCase().includes(search.toLowerCase()) || (g.description ?? '').toLowerCase().includes(search.toLowerCase()))
    .filter(g => activeTab === 'all' || isMember(g));

  const staggerV = rm ? reduced.stagger : stagger.normal;
  const itemV = rm ? reduced.fadeUp : fadeUp;

  function handleJoinLeave(g: ApiGroup) {
    if (isMember(g)) {
      leaveMutation.mutate({ id: g.id });
    } else {
      joinMutation.mutate({ id: g.id });
    }
  }

  const isActionLoading = joinMutation.isPending || leaveMutation.isPending;
  const actionError = joinMutation.error || leaveMutation.error;

  return (
    <div>
      <AppNav />
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 24px' }}>
        <motion.div variants={itemV} initial="hidden" animate="visible" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 36, marginBottom: 6 }}>Groups</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Find your community — by city, interest, or industry</p>
          </div>
          <motion.button id="create-group-btn" className="btn btn-primary" whileTap={buttonTap} onClick={() => router.push('/groups/create')}>+ Create Group</motion.button>
        </motion.div>

        <motion.div variants={itemV} initial="hidden" animate="visible" style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center' }}>
          <input id="group-search" type="search" className="input" style={{ maxWidth: 340 }} placeholder="🔍 Search groups…" value={search} onChange={e => setSearch(e.target.value)} />
          <div className="chip-bar" style={{ margin: 0 }}>
            <button id="tab-all-groups" className={`chip${activeTab === 'all' ? ' active' : ''}`} onClick={() => setActiveTab('all')}>All Groups</button>
            <button id="tab-my-groups" className={`chip${activeTab === 'mine' ? ' active' : ''}`} onClick={() => setActiveTab('mine')}>My Groups</button>
          </div>
        </motion.div>

        {actionError && (
          <div className="card" style={{ padding: 12, marginBottom: 24, background: '#ef4444', color: 'white', fontWeight: 600 }}>
            ⚠️ {(actionError as Error).message || 'An error occurred while processing your request.'}
          </div>
        )}

        {groupsLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {Array.from({ length: 6 }).map((_, i) => <PostCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <EmptyState icon="⚠️" title="Could not load groups" description="Please try again in a moment." action={{ label: 'Retry', onClick: () => window.location.reload() }} />
        ) : shown.length === 0 ? (
          activeTab === 'mine' ? (
            <EmptyState icon="👥" title="You haven't joined any groups" description="Browse all groups and join one that interests you." action={{ label: 'Browse groups', onClick: () => setActiveTab('all') }} />
          ) : (
            <EmptyState icon="🔍" title="No groups found" description="Try a different search term." action={{ label: 'Clear search', onClick: () => setSearch('') }} />
          )
        ) : (
          <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }} variants={staggerV} initial="hidden" animate="visible">
            {shown.map(g => (
              <GroupCard key={g.id} group={g} onToggle={handleJoinLeave} isMember={isMember(g)} isPending={isPending(g)} isLoading={isActionLoading} rm={!!rm} itemV={itemV} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function GroupCard({ group: g, onToggle, isMember, isPending, isLoading, rm, itemV }: {
  group: ApiGroup;
  onToggle: (g: ApiGroup) => void;
  isMember: boolean;
  isPending: boolean;
  isLoading: boolean;
  rm: boolean;
  itemV: object;
}) {
  return (
    <motion.div
      id={`group-card-${g.id}`}
      className="card"
      variants={rm ? undefined : itemV as Parameters<typeof motion.div>[0]['variants']}
      whileHover={rm ? undefined : { y: -4, borderColor: 'var(--border-strong)' }}
      style={{ padding: 22, position: 'relative' }}
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ width: 54, height: 54, borderRadius: 14, background: 'linear-gradient(135deg, var(--brand-indigo), var(--brand-teal))', display: 'grid', placeItems: 'center', fontSize: 26, flexShrink: 0 }}>👥</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 3 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{g.name}</h3>
            {isMember && <span className="badge badge-teal" style={{ flexShrink: 0, fontSize: 11 }}>✓ Joined</span>}
            {isPending && <span className="badge badge-saffron" style={{ flexShrink: 0, fontSize: 11 }}>Pending</span>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>👥 {g.member_count?.toLocaleString()} members · by {g.creator_name}</div>
        </div>
      </div>

      {g.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>{g.description.substring(0, 130)}{g.description.length > 130 ? '…' : ''}</p>}

      {g.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {g.tags.slice(0, 4).map(tag => <span key={tag} className={`badge ${TAG_COLORS[tag.toLowerCase()] ?? 'badge-indigo'}`} style={{ fontSize: 11 }}>{tag}</span>)}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        {!isPending && (
          <motion.button
            id={`join-group-${g.id}`}
            className={`btn btn-sm ${isMember ? 'btn-ghost' : 'btn-indigo'}`}
            onClick={() => onToggle(g)}
            whileTap={buttonTap}
            style={{ color: isMember ? 'var(--brand-rose)' : undefined }}
            disabled={isLoading}
          >
            {isMember ? 'Leave' : g.join_policy === 'approval' ? '📩 Request to Join' : '+ Join'}
          </motion.button>
        )}
        {isPending && <span className="btn btn-sm btn-ghost" style={{ cursor: 'default' }}>⏳ Request pending</span>}
      </div>
    </motion.div>
  );
}
