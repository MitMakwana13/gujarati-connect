'use client';

import { useEffect } from 'react';
import AppNav from '@/components/AppNav';
import { fadeUp, buttonTap } from '@/lib/motion';
import { motion } from 'framer-motion';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // We log to console in development, production analytics would capture this automatically
    console.error('[Global Error Boundary]', error);
  }, [error]);

  return (
    <div>
      <AppNav />
      <main className="app-layout" style={{ minHeight: 'calc(100vh - 64px)', display: 'grid', placeItems: 'center' }}>
        <motion.div
          className="card"
          style={{ padding: '40px', textAlign: 'center', maxWidth: 400 }}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
            We encountered an unexpected error while trying to load this page. Our team has been notified.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => reset()}
              className="btn btn-primary"
            >
              Try again
            </button>
            <a href="/feed" className="btn btn-ghost">
              Go to Home
            </a>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
