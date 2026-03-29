'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon = '✨', title, description, action }: EmptyStateProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      variants={reduced ? undefined : fadeUp}
      initial="hidden"
      animate="visible"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '64px 24px',
        gap: 12,
      }}
    >
      <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 4 }}>{icon}</div>
      <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{title}</h3>
      {description && (
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 320, margin: 0 }}>{description}</p>
      )}
      {action && (
        <button
          className="btn btn-primary"
          onClick={action.onClick}
          style={{ marginTop: 8 }}
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
