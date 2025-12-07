/**
 * Paradox Animation System - Spring Physics Configuration
 * Framer Motion and GSAP spring presets for consistent animations
 */

import { Transition } from 'framer-motion';

// Framer Motion spring presets
export const springs = {
  // Snappy - for buttons, toggles, small elements
  snappy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
    mass: 0.8,
  },

  // Gentle - for cards, modals, larger elements
  gentle: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 20,
    mass: 1,
  },

  // Bouncy - for success states, celebratory moments
  bouncy: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 15,
    mass: 1,
  },

  // Smooth - for page transitions, containers
  smooth: {
    type: 'spring' as const,
    stiffness: 100,
    damping: 20,
    mass: 1,
  },

  // Tight - for micro-interactions, hover states
  tight: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 35,
    mass: 0.5,
  },

  // Fluid - for drag interactions
  fluid: {
    type: 'spring' as const,
    stiffness: 150,
    damping: 25,
    mass: 1.2,
  },
} as const satisfies Record<string, Transition>;

// GSAP equivalents for non-Framer animations
export const gsapSprings = {
  snappy: {
    duration: 0.3,
    ease: 'back.out(1.7)',
  },
  gentle: {
    duration: 0.5,
    ease: 'power2.out',
  },
  bouncy: {
    duration: 0.6,
    ease: 'elastic.out(1, 0.5)',
  },
  smooth: {
    duration: 0.8,
    ease: 'power3.out',
  },
  tight: {
    duration: 0.2,
    ease: 'power4.out',
  },
  fluid: {
    duration: 0.4,
    ease: 'power2.inOut',
  },
} as const;

// Standard easing curves for non-spring animations
export const easings = {
  // Entrances
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  easeOutQuart: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
  easeOutQuint: 'cubic-bezier(0.23, 1, 0.32, 1)',
  easeOutExpo: 'cubic-bezier(0.19, 1, 0.22, 1)',

  // Exits
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeInQuad: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
  easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  easeInQuart: 'cubic-bezier(0.895, 0.03, 0.685, 0.22)',

  // Smooth both
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeInOutQuad: 'cubic-bezier(0.45, 0, 0.55, 1)',
  easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',

  // Apple-style
  apple: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
} as const;

// Duration presets (in seconds for Framer Motion, milliseconds for CSS)
export const durations = {
  instant: 0,
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  slower: 0.8,
  glacial: 1.2,
} as const;

// Stagger delays for list animations
export const stagger = {
  fast: 0.03,
  normal: 0.05,
  slow: 0.08,
  dramatic: 0.12,
} as const;

export type SpringPreset = keyof typeof springs;
export type EasingPreset = keyof typeof easings;
export type DurationPreset = keyof typeof durations;
export type StaggerPreset = keyof typeof stagger;
