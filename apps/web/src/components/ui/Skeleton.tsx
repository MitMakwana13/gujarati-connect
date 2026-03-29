'use client';

import { useReducedMotion } from 'framer-motion';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const reduced = useReducedMotion();
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: 'var(--bg-elevated)',
        backgroundImage: reduced
          ? 'none'
          : 'linear-gradient(90deg, var(--bg-elevated) 25%, hsla(220,14%,20%,0.6) 50%, var(--bg-elevated) 75%)',
        backgroundSize: '200% 100%',
        animation: reduced ? 'none' : 'skeleton-shimmer 1.4s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

// ── Preset skeletons for common patterns ────────────────────────────────────

export function PostCardSkeleton() {
  return (
    <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Skeleton width={44} height={44} borderRadius="50%" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton width="40%" height={14} />
          <Skeleton width="25%" height={11} />
        </div>
      </div>
      <Skeleton height={14} />
      <Skeleton height={14} width="90%" />
      <Skeleton height={14} width="70%" />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <Skeleton width={80} height={12} borderRadius={20} />
        <Skeleton width={100} height={12} borderRadius={20} />
      </div>
    </div>
  );
}

export function PersonCardSkeleton() {
  return (
    <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', textAlign: 'center' }}>
      <Skeleton width={72} height={72} borderRadius="50%" />
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={12} />
        <Skeleton width="50%" height={12} />
      </div>
      <Skeleton width="100%" height={36} borderRadius={8} />
    </div>
  );
}

export function MessageRowSkeleton() {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px' }}>
      <Skeleton width={48} height={48} borderRadius="50%" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton width="45%" height={13} />
          <Skeleton width="15%" height={11} />
        </div>
        <Skeleton width="70%" height={12} />
      </div>
    </div>
  );
}
