'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import AppNav from '@/components/AppNav';
import { stagger, fadeUp, buttonTap, reduced } from '@/lib/motion';
import { EmptyState } from '@/components/ui/EmptyState';

interface Notification { id: string; type: 'like' | 'comment' | 'connect' | 'event' | 'group'; title: string; body: string; time: string; read: boolean; avatar: string; link: string; }

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'connect', title: 'New connection request', body: 'Riya Shah wants to connect with you.', time: '20m ago', read: false, avatar: '👩‍💼', link: '/discover' },
  { id: '2', type: 'event', title: 'Event reminder', body: 'Navratri & Garba Night starts tomorrow at 7 PM. Check your RSVP details.', time: '2h ago', read: false, avatar: '📅', link: '/events' },
  { id: '3', type: 'comment', title: 'New comment', body: 'Karan Mehta commented on your post: "Great insights! Definitely agree with this approach."', time: '5h ago', read: true, avatar: '🧑', link: '/feed' },
  { id: '4', type: 'group', title: 'Group update', body: '3 new listings in Bay Area Gujaratis.', time: '1d ago', read: true, avatar: '🌉', link: '/groups' },
  { id: '5', type: 'like', title: 'Post liked', body: 'Minal Joshi and 12 others liked your recent post.', time: '1d ago', read: true, avatar: '👍', link: '/feed' },
];

const ICONS: Record<string, string> = { connect: 'var(--brand-teal)', event: 'var(--brand-saffron)', comment: 'var(--brand-indigo)', group: 'var(--brand-indigo)', like: 'var(--brand-saffron)' };

export default function NotificationsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const rm = useReducedMotion();
  const [notifs, setNotifs] = useState(MOCK_NOTIFICATIONS);

  useEffect(() => { if (!isLoading && !user) router.push('/auth/login'); }, [user, isLoading, router]);
  if (isLoading || !user) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><span style={{ fontSize: 28 }}>⏳</span></div>;

  function markAllRead() {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }

  function handleNotifClick(notif: Notification) {
    setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    router.push(notif.link);
  }

  const unreadCount = notifs.filter(n => !n.read).length;
  const staggerV = rm ? reduced.stagger : stagger.fast;
  const itemV = rm ? reduced.fadeUp : fadeUp;

  return (
    <div>
      <AppNav />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px' }}>
        <motion.div variants={itemV} initial="hidden" animate="visible" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <div>
            <h1 style={{ fontSize: 32, marginBottom: 6 }}>Notifications {unreadCount > 0 && <span className="badge badge-saffron" style={{ marginLeft: 8 }}>{unreadCount} new</span>}</h1>
          </div>
          {unreadCount > 0 && (
            <motion.button className="btn btn-ghost btn-sm" onClick={markAllRead} whileTap={buttonTap} style={{ color: 'var(--brand-indigo)' }}>
              ✓ Mark all as read
            </motion.button>
          )}
        </motion.div>

        {notifs.length === 0 ? (
          <EmptyState icon="🔔" title="All caught up" description="You have no notifications right now." />
        ) : (
          <motion.div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} variants={staggerV} initial="hidden" animate="visible">
            {notifs.map(n => (
              <motion.div
                key={n.id}
                variants={itemV}
                className="card"
                onClick={() => handleNotifClick(n)}
                whileHover={rm ? undefined : { backgroundColor: 'var(--bg-glass-hover)' }}
                style={{ 
                  padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'center', cursor: 'pointer',
                  border: n.read ? '1px solid var(--border)' : '1px solid var(--brand-indigo)',
                  background: n.read ? 'var(--bg-glass)' : 'hsla(247,75%,64%,0.05)',
                  position: 'relative', overflow: 'hidden'
                }}
              >
                {!n.read && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--brand-indigo)' }} />}
                
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-elevated)', border: `2px solid ${ICONS[n.type]}`, display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0 }}>
                  {n.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: n.read ? 600 : 700, fontSize: 15 }}>{n.title}</span>
                    <span style={{ fontSize: 12, color: n.read ? 'var(--text-muted)' : 'var(--brand-indigo)', fontWeight: n.read ? 400 : 500 }}>{n.time}</span>
                  </div>
                  <p style={{ fontSize: 14, color: n.read ? 'var(--text-secondary)' : 'var(--text-primary)', lineHeight: 1.5 }}>
                    {n.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
