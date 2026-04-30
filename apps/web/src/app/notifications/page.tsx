'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import AppNav from '@/components/AppNav';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, type ApiNotification } from '@/hooks/useNotifications';
import { stagger, fadeUp, buttonTap, reduced } from '@/lib/motion';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

const TYPE_COLORS: Record<string, string> = {
  group_activity: 'var(--brand-indigo)',
  event_reminder: 'var(--brand-saffron)',
  post_reaction: 'var(--brand-saffron)',
  comment_reply: 'var(--brand-teal)',
  message_request: 'var(--brand-teal)',
  new_message: 'var(--brand-teal)',
  moderation: 'var(--brand-rose)',
  system: 'var(--text-muted)',
};
const TYPE_ICONS: Record<string, string> = {
  group_activity: '👥', event_reminder: '📅', post_reaction: '👍',
  comment_reply: '💬', message_request: '📩', new_message: '💬',
  moderation: '🛡️', system: '🔔',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const rm = useReducedMotion();

  const { data: notifs = [], isLoading: notifsLoading } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  useEffect(() => { if (!isLoading && !user) router.push('/auth/login'); }, [user, isLoading, router]);
  if (isLoading || !user) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><span style={{ fontSize: 28 }}>⏳</span></div>;

  const unreadCount = notifs.filter(n => !n.is_read).length;
  const staggerV = rm ? reduced.stagger : stagger.fast;
  const itemV = rm ? reduced.fadeUp : fadeUp;

  function handleClick(n: ApiNotification) {
    if (!n.is_read) markReadMutation.mutate({ id: n.id });
  }

  return (
    <div>
      <AppNav />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px' }}>
        <motion.div variants={itemV} initial="hidden" animate="visible" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <div>
            <h1 style={{ fontSize: 32, marginBottom: 6 }}>
              Notifications
              {unreadCount > 0 && <span className="badge badge-saffron" style={{ marginLeft: 10 }}>{unreadCount} new</span>}
            </h1>
          </div>
          {unreadCount > 0 && (
            <motion.button className="btn btn-ghost btn-sm" onClick={() => markAllReadMutation.mutate()} whileTap={buttonTap} style={{ color: 'var(--brand-indigo)' }} disabled={markAllReadMutation.isPending}>
              ✓ Mark all read
            </motion.button>
          )}
        </motion.div>

        {notifsLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card" style={{ padding: 18, display: 'flex', gap: 12, alignItems: 'center' }}>
                <Skeleton width={44} height={44} borderRadius="50%" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Skeleton height={14} width="60%" />
                  <Skeleton height={12} width="80%" />
                </div>
              </div>
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <EmptyState icon="🔔" title="All caught up!" description="No notifications right now. Check back after some community activity." />
        ) : (
          <motion.div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} variants={staggerV} initial="hidden" animate="visible">
            {notifs.map(n => (
              <motion.div
                key={n.id}
                id={`notif-${n.id}`}
                variants={itemV}
                className="card"
                onClick={() => handleClick(n)}
                whileHover={rm ? undefined : { backgroundColor: 'var(--bg-glass-hover)' }}
                style={{
                  padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'center', cursor: 'pointer',
                  border: n.is_read ? '1px solid var(--border)' : '1px solid var(--brand-indigo)',
                  background: n.is_read ? 'var(--bg-glass)' : 'hsla(247,75%,64%,0.05)',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {!n.is_read && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--brand-indigo)' }} />}

                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-elevated)', border: `2px solid ${TYPE_COLORS[n.type] ?? 'var(--border)'}`, display: 'grid', placeItems: 'center', fontSize: 20, flexShrink: 0 }}>
                  {TYPE_ICONS[n.type] ?? '🔔'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: n.is_read ? 600 : 700, fontSize: 15 }}>{n.title}</span>
                    <span style={{ fontSize: 12, color: n.is_read ? 'var(--text-muted)' : 'var(--brand-indigo)', fontWeight: n.is_read ? 400 : 500, flexShrink: 0, marginLeft: 12 }}>{timeAgo(n.created_at)}</span>
                  </div>
                  <p style={{ fontSize: 14, color: n.is_read ? 'var(--text-secondary)' : 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>{n.body}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
