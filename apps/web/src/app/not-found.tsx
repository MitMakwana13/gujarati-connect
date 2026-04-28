'use client';

import AppNav from '@/components/AppNav';
import { fadeUp, buttonTap } from '@/lib/motion';
import { motion } from 'framer-motion';

export default function NotFound() {
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔎</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Page not found</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
            We couldn't find the page you were looking for. It might have been removed, or the link may be broken.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <a href="/feed" className="btn btn-primary">
              Back to Feed
            </a>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
