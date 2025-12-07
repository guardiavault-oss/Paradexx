/**
 * Paradox Animation System - Motion Variants
 * Reusable animation variants for Framer Motion
 */

import { Variants } from 'framer-motion';
import { springs, durations, stagger } from './springs';
import { shadows } from '../styles/tokens';

// Button interaction variants
export const buttonVariants: Variants = {
  rest: {
    scale: 1,
    boxShadow: shadows.md,
  },
  hover: {
    scale: 1.02,
    boxShadow: shadows.lg,
    transition: springs.tight,
  },
  pressed: {
    scale: 0.97,
    boxShadow: shadows.sm,
    transition: springs.tight,
  },
};

// Card interaction variants
export const cardVariants: Variants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: shadows.md,
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: shadows.lg,
    transition: springs.gentle,
  },
  pressed: {
    scale: 0.98,
    y: 0,
    boxShadow: shadows.sm,
    transition: springs.tight,
  },
  selected: {
    scale: 1,
    y: 0,
    boxShadow: shadows.lg,
    transition: springs.gentle,
  },
};

// Fade animations
export const fadeVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: durations.normal,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: durations.fast,
    },
  },
};

// Slide animations
export const slideVariants = {
  fromRight: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 },
  },
  fromLeft: {
    initial: { x: '-100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 },
  },
  fromTop: {
    initial: { y: '-100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '-100%', opacity: 0 },
  },
  fromBottom: {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 },
  },
};

// Scale animations
export const scaleVariants: Variants = {
  hidden: {
    scale: 0.8,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: springs.gentle,
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    transition: springs.tight,
  },
};

// Staggered children animation
export const staggerChildrenVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: stagger.normal,
      delayChildren: 0.1,
    },
  },
};

// Individual stagger item
export const staggerItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.gentle,
  },
};

// Modal variants
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springs.gentle,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: springs.tight,
  },
};

// Backdrop variants
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: durations.normal },
  },
  exit: {
    opacity: 0,
    transition: { duration: durations.fast },
  },
};

// Toast/notification variants
export const toastVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -50,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springs.bouncy,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: springs.tight,
  },
};

// Glow pulse animation
export const glowPulseVariants: Variants = {
  initial: {
    boxShadow: '0 0 20px rgba(0, 173, 239, 0.3)',
  },
  animate: {
    boxShadow: [
      '0 0 20px rgba(0, 173, 239, 0.3)',
      `0 0 30px rgba(0, 173, 239, 0.5), 0 0 60px rgba(0, 173, 239, 0.25)`,
      '0 0 20px rgba(0, 173, 239, 0.3)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Shimmer loading animation
export const shimmerVariants: Variants = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// Success checkmark draw animation
export const checkmarkVariants: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.5, ease: 'easeInOut' },
      opacity: { duration: 0.1 },
    },
  },
};

// Shake animation for errors
export const shakeVariants: Variants = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.4,
    },
  },
};

// Bounce animation
export const bounceVariants: Variants = {
  bounce: {
    y: [0, -20, 0],
    transition: springs.bouncy,
  },
};

// Rotation variants
export const rotateVariants: Variants = {
  rotate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// Expand/collapse variants
export const expandVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: springs.tight,
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: springs.gentle,
  },
};
