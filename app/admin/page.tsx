'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Flag, Ban, CheckCircle, Shield, Loader2 } from 'lucide-react';
import { supabase, Profile } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { getInitials } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface Report {
  id: number;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  created_at: string;
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const [users, setUsers] = useState<Profile[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [tab, setTab] = useState<'users' | 'reports'>('users');
  const [stats, setStats] = useState({ total: 0, online: 0 });
  const [banning, setBanning] = useState<string | null>(null);

  // Check admin access
  useEffect(() => {
    if (authLoading || !user) return;
    supabase.from('admin_users').select('user_id').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (!data) { router.push('/nearby'); return; }
        setIsAdmin(true);
        setChecking(false);
      });
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!isAdmin) return;
    // Load users
    supabase.from('profiles').select('*').order('created_at', { ascending: false })
      .then(({ data }) => {
        const profiles = (data ?? []) as Profile[];
        setUsers(profiles);
        setStats({ total: profiles.length, online: profiles.filter(p => p.is_online).length });
      });
    // Load reports
    supabase.from('reports').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setReports((data ?? []) as Report[]));
  }, [isAdmin]);

  const toggleBan = async (profile: Profile) => {
    setBanning(profile.id);
    const newBanned = !profile.is_banned;
    const { error } = await supabase.from('profiles').update({ is_banned: newBanned }).eq('id', profile.id);
    if (error) { toast.error('Failed to update'); setBanning(null); return; }
    
    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_id: user?.id,
      action: newBanned ? 'ban_user' : 'unban_user',
      target_user: profile.id,
    });

    setUsers(prev => prev.map(u => u.id === profile.id ? { ...u, is_banned: newBanned } : u));
    toast.success(newBanned ? 'User banned' : 'User unbanned');
    setBanning(null);
  };

  if (!mounted || authLoading || checking) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spin" style={{ width: 36, height: 36, border: '3px solid rgba(245,158,11,0.2)', borderTopColor: 'rgb(245,158,11)', borderRadius: '50%' }} />
    </div>
  );

  return (
    <div className="page">
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={20} color="rgb(245,158,11)" />
          <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 18 }}>Admin Panel</div>
        </div>
        <span className="badge badge-gold">Admin</span>
      </header>

      <div className="page-content">
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <StatCard icon={<Users size={20} />} label="Total Users" value={stats.total} />
          <StatCard icon={<span style={{ fontSize: 18 }}>🟢</span>} label="Online Now" value={stats.online} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 4, marginBottom: 20 }}>
          {(['users', 'reports'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, padding: '10px', borderRadius: 10, fontWeight: 600, fontSize: 14, background: tab === t ? 'rgba(245,158,11,0.2)' : 'transparent', color: tab === t ? 'rgb(253,224,71)' : 'rgba(255,255,255,0.5)', border: tab === t ? '1px solid rgba(245,158,11,0.3)' : '1px solid transparent', transition: 'all 0.2s', textTransform: 'capitalize' }}>
              {t} {t === 'reports' && reports.length > 0 && <span style={{ background: 'rgb(239,68,68)', color: '#fff', borderRadius: 99, padding: '1px 6px', fontSize: 11, marginLeft: 4 }}>{reports.length}</span>}
            </button>
          ))}
        </div>

        {tab === 'users' && users.map((u, i) => (
          <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 16, background: u.is_banned ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.04)', border: `1px solid ${u.is_banned ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)'}`, marginBottom: 8 }}>
            {u.photo_url
              ? <img src={u.photo_url} alt="" style={{ width: 44, height: 44, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />
              : <div className="avatar avatar-sm" style={{ width: 44, height: 44, flexShrink: 0 }}>{getInitials(u.name)}</div>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {u.name || 'Unnamed'} {u.is_banned && <span className="badge badge-danger" style={{ fontSize: 10, marginLeft: 4 }}>Banned</span>}
              </div>
              <div className="caption">{u.profession || '—'} · {u.native_city || '—'}</div>
              <div className="caption">{formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}</div>
            </div>
            <button onClick={() => toggleBan(u)} disabled={banning === u.id}
              className={`btn btn-sm ${u.is_banned ? 'btn-glass' : 'btn-danger'}`} style={{ flexShrink: 0 }}>
              {banning === u.id ? <Loader2 size={14} className="spin" /> : u.is_banned ? <><CheckCircle size={14} /> Unban</> : <><Ban size={14} /> Ban</>}
            </button>
          </motion.div>
        ))}

        {tab === 'reports' && reports.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon"><Flag size={28} color="rgb(245,158,11)" /></div>
            <div style={{ fontWeight: 600, fontSize: 18 }}>No reports</div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>All clear — no reports received.</p>
          </div>
        )}

        {tab === 'reports' && reports.map((r, i) => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            style={{ padding: '14px', borderRadius: 16, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: 'rgb(252,165,165)' }}>{r.reason}</span>
              <span className="caption">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
            </div>
            <div className="caption">Reported user: {r.reported_user_id.slice(0, 8)}…</div>
            <div className="caption">Reporter: {r.reporter_id.slice(0, 8)}…</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="card" style={{ padding: '18px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: 'rgba(245,158,11,0.8)' }}>{icon}</div>
      <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 28 }}>{value}</div>
      <div className="caption">{label}</div>
    </div>
  );
}
