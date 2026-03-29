'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { ease } from '@/lib/motion';

const NAV_LINKS = [
  { href: '/feed',      icon: '🏠', label: 'Feed' },
  { href: '/discover',  icon: '🔍', label: 'Discover' },
  { href: '/groups',    icon: '👥', label: 'Groups' },
  { href: '/events',    icon: '🎉', label: 'Events' },
  { href: '/resources', icon: '📋', label: 'Resources' },
  { href: '/messages',  icon: '💬', label: 'Messages', unread: 3 },
];

export default function AppNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const reduced = useReducedMotion();

  return (
    <nav className="nav">
      <div className="nav-inner">
        {/* Logo */}
        <Link href={user ? '/feed' : '/'} className="nav-logo">
          gujarati global
        </Link>

        {/* Center nav links with animated pill */}
        <div className="nav-links">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link${isActive ? ' active' : ''}`}
                style={{ position: 'relative' }}
              >
                {/* Sliding active pill */}
                {isActive && !reduced && (
                  <motion.div
                    layoutId="nav-pill"
                    transition={{ ...ease.springGentle }}
                    style={{
                      position: 'absolute', inset: 0,
                      background: 'var(--bg-glass-hover)',
                      borderRadius: 'var(--r-sm)',
                      zIndex: -1,
                    }}
                  />
                )}
                {isActive && reduced && (
                  <div
                    style={{
                      position: 'absolute', inset: 0,
                      background: 'var(--bg-glass-hover)',
                      borderRadius: 'var(--r-sm)',
                      zIndex: -1,
                    }}
                  />
                )}
                <span style={{ fontSize: 16 }}>{link.icon}</span>
                <span>{link.label}</span>
                {link.unread ? (
                  <span className="unread-count">{link.unread}</span>
                ) : null}
              </Link>
            );
          })}
        </div>

        {/* Right: user controls */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          {user ? (
            <>
              <button
                id="nav-notifications"
                className="btn btn-ghost btn-icon"
                style={{ fontSize: 18, position: 'relative' }}
                onClick={() => router.push('/notifications')}
              >
                🔔
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--brand-rose)',
                  border: '2px solid var(--bg-glass)',
                }} />
              </button>
              <motion.button
                id="nav-profile-avatar"
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.94 }}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--brand-saffron), var(--brand-indigo))',
                  display: 'grid', placeItems: 'center',
                  fontSize: 13, fontWeight: 800,
                  color: 'var(--text-inverse)',
                  border: 'none', cursor: 'pointer',
                  boxShadow: '0 0 0 2px var(--bg-glass)',
                }}
                title={user.displayName}
                onClick={() => router.push('/profile')}
              >
                {user.avatarInitials || '?'}
              </motion.button>
              <button
                id="nav-signout"
                className="btn btn-ghost btn-sm"
                onClick={logout}
                style={{ color: 'var(--text-muted)', fontSize: 13 }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn btn-ghost btn-sm">Sign In</Link>
              <Link href="/auth/register" className="btn btn-primary btn-sm">Join Free</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
