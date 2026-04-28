'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import AppNav from '@/components/AppNav';
import { fadeUp, scalePop } from '@/lib/motion';

const FEATURES = [
  { icon: '🔍', title: 'Smart Matching', desc: 'Find Gujaratis by shared roots, city, university, and industry.' },
  { icon: '📍', title: 'City-Based Discovery', desc: 'See who is in your city and explore nearby communities.' },
  { icon: '🤝', title: 'One-Click Connect', desc: 'Send connection requests with a single tap.' },
  { icon: '🎯', title: 'Interest Filters', desc: 'Filter by garba, cricket, career, and more.' },
];

export default function DiscoverPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => { if (!isLoading && !user) router.push('/auth/login'); }, [user, isLoading, router]);
  if (isLoading || !user) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><span style={{ fontSize: 28 }}>⏳</span></div>;

  return (
    <div>
      <AppNav />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '80px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>

        <motion.div variants={scalePop} initial="hidden" animate="visible" style={{ fontSize: 72, marginBottom: 24 }}>🔍</motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'hsla(247,75%,64%,0.15)', border: '1px solid hsla(247,75%,64%,0.4)', borderRadius: 100, padding: '6px 16px', fontSize: 13, color: 'var(--brand-indigo)', fontWeight: 600, marginBottom: 24 }}>
            ✦ Beta Access Coming Soon
          </div>

          <h1 style={{ fontSize: 42, fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>Discover Your People</h1>
          <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 48, maxWidth: 520 }}>
            We are building the most powerful people discovery tool for the Gujarati diaspora. Find connections by city, roots, university, and shared interests.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 48, textAlign: 'left' }}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                className="card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                style={{ padding: '20px 22px' }}
              >
                <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.desc}</div>
              </motion.div>
            ))}
          </div>

          <motion.button
            className="btn btn-primary"
            style={{ padding: '14px 36px', fontSize: 16 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => router.push('/feed')}
          >
            Back to Feed
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
