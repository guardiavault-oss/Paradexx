// ==============================================
// FRAMER MOTION PRESETS
// ==============================================

import { Variants, Transition } from 'motion/react';

// ==============================================
// TRANSITIONS
// ==============================================

export const transitions = {
  spring: { type: 'spring', stiffness: 400, damping: 30 } as Transition,
  springBouncy: { type: 'spring', stiffness: 300, damping: 20 } as Transition,
  springGentle: { type: 'spring', stiffness: 200, damping: 25 } as Transition,
  smooth: { type: 'tween', ease: 'easeInOut', duration: 0.3 } as Transition,
  quick: { type: 'tween', ease: 'easeOut', duration: 0.15 } as Transition,
  slow: { type: 'tween', ease: 'easeInOut', duration: 0.5 } as Transition,
  slower: { type: 'tween', ease: 'easeInOut', duration: 0.7 } as Transition,
};

// ==============================================
// BUTTON ANIMATIONS
// ==============================================

export const buttonVariants: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
};

export const iconButtonVariants: Variants = {
  initial: { scale: 1, rotate: 0 },
  hover: { scale: 1.1 },
  tap: { scale: 0.9 },
};

// ==============================================
// CARD ANIMATIONS
// ==============================================

export const cardVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  hover: { y: -4, transition: transitions.spring },
};

export const glassCardVariants: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...transitions.spring, delay: 0.1 },
  },
  hover: {
    y: -4,
    scale: 1.01,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: -10,
    transition: transitions.quick,
  },
};

export const card3DVariants: Variants = {
  initial: { rotateX: 0, rotateY: 0 },
  hover: {
    rotateX: 5,
    rotateY: 5,
    transition: transitions.springGentle,
  },
};

// ==============================================
// PAGE TRANSITIONS
// ==============================================

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
};

export const pageSlideVariants: Variants = {
  initial: { opacity: 0, x: 100 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    x: -100,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
};

// Page transition presets for PageLayout component
export const pageTransitions = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
};

// ==============================================
// FADE ANIMATIONS
// ==============================================

export const fadeInVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUpVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const fadeInDownVariants: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
};

// ==============================================
// SLIDE ANIMATIONS
// ==============================================

export const slideUpVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const slideDownVariants: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
};

export const slideRightVariants: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export const slideLeftVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

// ==============================================
// SCALE ANIMATIONS
// ==============================================

export const scaleInVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const scaleInCenterVariants: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: transitions.quick,
  },
};

export const popInVariants: Variants = {
  initial: { opacity: 0, scale: 0 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: transitions.springBouncy,
  },
  exit: {
    opacity: 0,
    scale: 0,
    transition: transitions.quick,
  },
};

// ==============================================
// MODAL ANIMATIONS
// ==============================================

export const modalBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalContentVariants: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: transitions.quick,
  },
};

export const drawerVariants: Variants = {
  initial: { x: '100%' },
  animate: {
    x: 0,
    transition: transitions.spring,
  },
  exit: {
    x: '100%',
    transition: transitions.quick,
  },
};

export const bottomSheetVariants: Variants = {
  initial: { y: '100%' },
  animate: {
    y: 0,
    transition: transitions.spring,
  },
  exit: {
    y: '100%',
    transition: transitions.quick,
  },
};

// ==============================================
// STAGGER ANIMATIONS
// ==============================================

export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.02,
      staggerDirection: -1,
    },
  },
};

export const staggerItemVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: transitions.quick,
  },
};

export const staggerFastContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.02,
      delayChildren: 0,
    },
  },
};

// ==============================================
// NOTIFICATION ANIMATIONS
// ==============================================

export const toastVariants: Variants = {
  initial: { opacity: 0, x: 100, scale: 0.9 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    x: 100,
    scale: 0.9,
    transition: transitions.quick,
  },
};

export const notificationVariants: Variants = {
  initial: { opacity: 0, y: -20, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: transitions.quick,
  },
};

// ==============================================
// DROPDOWN/MENU ANIMATIONS
// ==============================================

export const dropdownVariants: Variants = {
  initial: { opacity: 0, scale: 0.95, y: -10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: transitions.quick,
  },
};

export const menuVariants: Variants = {
  initial: { opacity: 0, height: 0 },
  animate: {
    opacity: 1,
    height: 'auto',
    transition: transitions.smooth,
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: transitions.quick,
  },
};

// ==============================================
// LOADING ANIMATIONS
// ==============================================

export const shimmerVariants: Variants = {
  initial: { x: '-100%' },
  animate: {
    x: '100%',
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'linear',
    },
  },
};

export const spinVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ==============================================
// SPECIAL EFFECTS
// ==============================================

export const numberVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

export const shakeVariants: Variants = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 },
  },
};

export const bounceVariants: Variants = {
  bounce: {
    y: [0, -20, 0],
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

export const pulseGlowVariants: Variants = {
  initial: { boxShadow: '0 0 20px rgba(255, 51, 102, 0.2)' },
  animate: {
    boxShadow: [
      '0 0 20px rgba(255, 51, 102, 0.2)',
      '0 0 40px rgba(255, 51, 102, 0.4)',
      '0 0 20px rgba(255, 51, 102, 0.2)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const gradientShiftVariants: Variants = {
  animate: {
    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export const floatingVariants: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const wiggleVariants: Variants = {
  wiggle: {
    rotate: [0, -5, 5, -5, 5, 0],
    transition: {
      duration: 0.5,
    },
  },
};

export const expandVariants: Variants = {
  initial: { width: 0, opacity: 0 },
  animate: {
    width: 'auto',
    opacity: 1,
    transition: transitions.smooth,
  },
  exit: {
    width: 0,
    opacity: 0,
    transition: transitions.quick,
  },
};

export const collapseVariants: Variants = {
  initial: { height: 'auto', opacity: 1 },
  exit: {
    height: 0,
    opacity: 0,
    transition: transitions.smooth,
  },
};

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

export const createStagger = (staggerChildren = 0.05, delayChildren = 0.1): Variants => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

export const createDelayedVariant = (delay: number): Variants => ({
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { ...transitions.spring, delay },
  },
});

export const createCustomTransition = (duration: number, ease: string = 'easeInOut'): Transition => ({
  type: 'tween',
  ease,
  duration,
});