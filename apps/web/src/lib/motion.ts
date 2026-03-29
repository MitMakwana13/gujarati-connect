/**
 * Gujarati Global — Centralized Motion Presets
 * All animation variants live here. Pages import from this file only.
 * Principle: transform + opacity only. Never animate layout properties directly.
 */

import type { Variants, Transition } from 'framer-motion';

// ─── Easings ───────────────────────────────────────────────────────────────
export const ease = {
  out: [0.0, 0.0, 0.2, 1],
  in: [0.4, 0.0, 1, 1],
  inOut: [0.4, 0.0, 0.2, 1],
  spring: { type: 'spring', stiffness: 380, damping: 30 },
  springGentle: { type: 'spring', stiffness: 220, damping: 28 },
  springSnappy: { type: 'spring', stiffness: 500, damping: 35 },
} as const;

// ─── Durations ─────────────────────────────────────────────────────────────
export const duration = {
  instant: 0.08,
  fast: 0.15,
  normal: 0.22,
  slow: 0.35,
  xslow: 0.5,
} as const;

// ─── Shared transitions ────────────────────────────────────────────────────
export const transition = {
  fade: { duration: duration.normal, ease: ease.out } satisfies Transition,
  slide: { duration: duration.normal, ease: ease.out } satisfies Transition,
  spring: ease.spring satisfies Transition,
  springGentle: ease.springGentle satisfies Transition,
} as const;

// ─── Page-level entry ──────────────────────────────────────────────────────
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.slow, ease: ease.out },
  },
};

// ─── FadeUp ────────────────────────────────────────────────────────────────
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.normal, ease: ease.out } },
};

// ─── FadeIn ────────────────────────────────────────────────────────────────
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.normal } },
};

// ─── Stagger containers ────────────────────────────────────────────────────
export const stagger = {
  fast: {
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } },
  } satisfies Variants,
  normal: {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  } satisfies Variants,
  slow: {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
  } satisfies Variants,
};

// ─── Card hover (subtle lift) ──────────────────────────────────────────────
export const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.015, y: -2, transition: ease.spring },
} satisfies Variants;

// ─── Button press ─────────────────────────────────────────────────────────
export const buttonTap = { scale: 0.96 } as const;

// ─── Slide from right (for sheets/panels) ─────────────────────────────────
export const slideInRight: Variants = {
  hidden: { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: ease.springGentle as Transition },
  exit: { x: '100%', opacity: 0, transition: { duration: duration.fast, ease: ease.in } },
};

// ─── Slide up (for bottom sheets on mobile) ───────────────────────────────
export const slideUp: Variants = {
  hidden: { y: '100%', opacity: 0 },
  visible: { y: 0, opacity: 1, transition: ease.springGentle as Transition },
  exit: { y: '100%', opacity: 0, transition: { duration: duration.fast, ease: ease.in } },
};

// ─── Scale pop (for badges, new messages, like button) ────────────────────
export const scalePop: Variants = {
  hidden: { scale: 0.6, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: ease.springSnappy as Transition },
};

// ─── Message bubble ────────────────────────────────────────────────────────
export const messageBubble: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: ease.spring as Transition },
};

// ─── Reduced motion: flat version of all variants ─────────────────────────
// Consumer components should use `useReducedMotion()` and swap to these.
export const reduced = {
  fadeUp: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0 } },
  } satisfies Variants,
  stagger: {
    hidden: {},
    visible: {},
  } satisfies Variants,
};
