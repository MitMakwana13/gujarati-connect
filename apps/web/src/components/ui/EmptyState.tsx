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
        gap: 14,
      }}
    >
      {/* Icon with gradient background circle */}
      <div style={{
        width: 88,
        height: 88,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, hsla(32,98%,55%,0.1), hsla(247,75%,64%,0.1))',
        border: '1px solid hsla(220,20%,100%,0.06)',
        display: 'grid',
        placeItems: 'center',
        marginBottom: 4,
      }}>
        <span style={{ fontSize: 40, lineHeight: 1 }}>{icon}</span>
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{title}</h3>
      {description && (
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 340, margin: 0, lineHeight: 1.6 }}>{description}</p>
      )}
      {action && (
        <motion.button
          className="btn btn-primary"
          onClick={action.onClick}
          whileTap={{ scale: 0.96 }}
          style={{ marginTop: 8 }}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
