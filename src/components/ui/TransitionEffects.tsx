import { motion, AnimatePresence } from 'motion/react';
import { ReactNode } from 'react';

// Page transition wrapper
interface PageTransitionProps {
  children: ReactNode;
  variant?: 'fade' | 'slide' | 'scale' | 'slideUp' | 'slideDown' | 'blur';
}

export function PageTransition({
  children,
  variant = 'fade',
}: PageTransitionProps) {
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.3 },
    },
    slide: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
      transition: { duration: 0.3, ease: 'easeInOut' },
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.05 },
      transition: { duration: 0.3, ease: 'easeInOut' },
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
      transition: { duration: 0.3, ease: 'easeInOut' },
    },
    slideDown: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
      transition: { duration: 0.3, ease: 'easeInOut' },
    },
    blur: {
      initial: { opacity: 0, filter: 'blur(10px)' },
      animate: { opacity: 1, filter: 'blur(0px)' },
      exit: { opacity: 0, filter: 'blur(10px)' },
      transition: { duration: 0.4 },
    },
  };

  const config = variants[variant];

  return (
    <motion.div
      initial={config.initial}
      animate={config.animate}
      exit={config.exit}
      transition={config.transition}
    >
      {children}
    </motion.div>
  );
}

// Modal transition wrapper
interface ModalTransitionProps {
  children: ReactNode;
  isOpen: boolean;
}

export function ModalTransition({ children, isOpen }: ModalTransitionProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-[61] flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Card reveal animation
interface CardRevealProps {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function CardReveal({
  children,
  delay = 0,
  direction = 'up',
}: CardRevealProps) {
  const getInitial = () => {
    switch (direction) {
      case 'up':
        return { opacity: 0, y: 40 };
      case 'down':
        return { opacity: 0, y: -40 };
      case 'left':
        return { opacity: 0, x: 40 };
      case 'right':
        return { opacity: 0, x: -40 };
    }
  };

  return (
    <motion.div
      initial={getInitial()}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        delay,
        duration: 0.6,
        ease: 'easeOut',
      }}
    >
      {children}
    </motion.div>
  );
}

// Slide in from edge
interface SlideInProps {
  children: ReactNode;
  from?: 'left' | 'right' | 'top' | 'bottom';
  delay?: number;
}

export function SlideIn({ children, from = 'left', delay = 0 }: SlideInProps) {
  const getInitial = () => {
    switch (from) {
      case 'left':
        return { x: -100, opacity: 0 };
      case 'right':
        return { x: 100, opacity: 0 };
      case 'top':
        return { y: -100, opacity: 0 };
      case 'bottom':
        return { y: 100, opacity: 0 };
    }
  };

  return (
    <motion.div
      initial={getInitial()}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{
        delay,
        duration: 0.5,
        type: 'spring',
        stiffness: 100,
        damping: 20,
      }}
    >
      {children}
    </motion.div>
  );
}

// Fade and scale
interface FadeScaleProps {
  children: ReactNode;
  delay?: number;
  scale?: number;
}

export function FadeScale({
  children,
  delay = 0,
  scale = 0.9,
}: FadeScaleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay,
        duration: 0.4,
        ease: 'easeOut',
      }}
    >
      {children}
    </motion.div>
  );
}

// Typewriter effect
interface TypewriterProps {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
}

export function Typewriter({
  text,
  delay = 0,
  speed = 0.05,
  className = '',
}: TypewriterProps) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
    >
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + index * speed }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
}

// Ripple effect
interface RippleProps {
  children: ReactNode;
  color?: string;
}

export function Ripple({ children, color = '#DC143C' }: RippleProps) {
  return (
    <motion.div className="relative overflow-hidden">
      {children}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: color }}
        initial={{ scale: 0, opacity: 0.5 }}
        whileTap={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.5 }}
      />
    </motion.div>
  );
}

// Bounce entrance
interface BounceEntranceProps {
  children: ReactNode;
  delay?: number;
}

export function BounceEntrance({ children, delay = 0 }: BounceEntranceProps) {
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        delay,
        type: 'spring',
        stiffness: 300,
        damping: 15,
      }}
    >
      {children}
    </motion.div>
  );
}

// Rotate fade
interface RotateFadeProps {
  children: ReactNode;
  delay?: number;
  rotate?: number;
}

export function RotateFade({
  children,
  delay = 0,
  rotate = 10,
}: RotateFadeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, rotate }}
      animate={{ opacity: 1, rotate: 0 }}
      transition={{
        delay,
        duration: 0.5,
        ease: 'easeOut',
      }}
    >
      {children}
    </motion.div>
  );
}

// Blur fade
interface BlurFadeProps {
  children: ReactNode;
  delay?: number;
}

export function BlurFade({ children, delay = 0 }: BlurFadeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      transition={{
        delay,
        duration: 0.6,
      }}
    >
      {children}
    </motion.div>
  );
}

// Magnetic hover effect
interface MagneticHoverProps {
  children: ReactNode;
  strength?: number;
}

export function MagneticHover({
  children,
  strength = 10,
}: MagneticHoverProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.div>
  );
}

// Stagger children wrapper
interface StaggerChildrenProps {
  children: ReactNode[];
  staggerDelay?: number;
}

export function StaggerChildren({
  children,
  staggerDelay = 0.1,
}: StaggerChildrenProps) {
  return (
    <>
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: index * staggerDelay,
            duration: 0.5,
            ease: 'easeOut',
          }}
        >
          {child}
        </motion.div>
      ))}
    </>
  );
}

// Expand from center
interface ExpandFromCenterProps {
  children: ReactNode;
  delay?: number;
}

export function ExpandFromCenter({
  children,
  delay = 0,
}: ExpandFromCenterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay,
        duration: 0.5,
        type: 'spring',
        stiffness: 200,
        damping: 20,
      }}
    >
      {children}
    </motion.div>
  );
}

// Glitch effect
interface GlitchProps {
  children: ReactNode;
}

export function Glitch({ children }: GlitchProps) {
  return (
    <motion.div
      animate={{
        x: [0, -2, 2, -2, 0],
        y: [0, 2, -2, 2, 0],
      }}
      transition={{
        duration: 0.3,
        repeat: 0,
      }}
    >
      {children}
    </motion.div>
  );
}

// Shake animation
interface ShakeProps {
  children: ReactNode;
  trigger?: boolean;
}

export function Shake({ children, trigger = false }: ShakeProps) {
  return (
    <motion.div
      animate={
        trigger
          ? {
              x: [-10, 10, -10, 10, 0],
              transition: { duration: 0.4 },
            }
          : {}
      }
    >
      {children}
    </motion.div>
  );
}

// Parallax scroll
interface ParallaxScrollProps {
  children: ReactNode;
  speed?: number;
}

export function ParallaxScroll({ children, speed = 0.5 }: ParallaxScrollProps) {
  return (
    <motion.div
      initial={{ y: 0 }}
      whileInView={{ y: -50 * speed }}
      viewport={{ once: false }}
      transition={{ duration: 0 }}
    >
      {children}
    </motion.div>
  );
}
