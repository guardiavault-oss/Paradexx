/**
 * Paradox Animation System - Gesture Configuration
 * Settings for drag, swipe, and pan interactions
 */

// Swipe action thresholds
export const swipeThresholds = {
  velocity: 500, // px/s minimum velocity
  distance: 100, // px minimum distance
  quick: 300, // Quick swipe velocity
  resist: 0.5, // Resistance coefficient at edges
} as const;

// Drag constraints
export const dragConstraints = {
  token: {
    left: -200,
    right: 200,
    top: 0,
    bottom: 0,
  },
  modal: {
    top: 0,
    bottom: 300,
  },
} as const;

// Pull-to-refresh configuration
export const pullToRefresh = {
  threshold: 80, // px to trigger refresh
  resistance: 0.6, // Drag resistance factor
  maxPull: 120, // Maximum pull distance
  snapDuration: 0.3, // Duration to snap back
} as const;

// Overscroll bounce
export const overscroll = {
  maxBounce: 20, // Maximum overscroll distance
  resistance: 0.5, // Resistance factor
  snapBack: 0.3, // Snap back duration
} as const;

// Long press configuration
export const longPress = {
  delay: 500, // ms to trigger long press
  moveThreshold: 10, // px movement tolerance
} as const;
