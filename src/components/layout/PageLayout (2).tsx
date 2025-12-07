import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/cn';
import { pageTransitions } from '@/lib/motion';
import { Mode } from '@/styles/tokens';

export interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  mode?: Mode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  sidebar?: React.ReactNode;
  transition?: 'fade' | 'slide' | 'scale' | 'none';
  backgroundPattern?: 'dots' | 'grid' | 'none';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  className,
  mode = 'degen',
  header,
  footer,
  sidebar,
  transition = 'fade',
  backgroundPattern = 'none',
  maxWidth = '2xl',
}) => {
  const maxWidthClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    '2xl': 'max-w-[1400px]',
    full: 'max-w-full',
  };

  const transitionVariants = {
    fade: pageTransitions.fadeIn,
    slide: pageTransitions.slideUp,
    scale: pageTransitions.scaleIn,
    none: {},
  };

  return (
    <div
      className={cn(
        'min-h-screen bg-black text-white',
        mode === 'degen' && '[--accent:theme(colors.degen.primary)]',
        mode === 'regen' && '[--accent:theme(colors.regen.primary)]'
      )}
    >
      {/* Background pattern */}
      {backgroundPattern === 'dots' && (
        <div
          className="fixed inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />
      )}
      {backgroundPattern === 'grid' && (
        <div
          className="fixed inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
      )}

      {/* Header */}
      {header && (
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/10">
          {header}
        </header>
      )}

      {/* Main content area */}
      <div className={cn('flex', sidebar && 'lg:pl-64')}>
        {/* Sidebar */}
        {sidebar && (
          <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block lg:w-64 lg:overflow-y-auto lg:bg-black/40 lg:backdrop-blur-xl lg:border-r lg:border-white/10">
            {sidebar}
          </aside>
        )}

        {/* Main content */}
        <main className={cn('flex-1 w-full', className)}>
          <AnimatePresence mode="wait">
            <motion.div
              key={transition}
              variants={transitionVariants[transition]}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition === 'none' ? {} : { duration: 0.3 }}
              className={cn('mx-auto px-4 sm:px-6 lg:px-8 py-8', maxWidthClasses[maxWidth])}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Footer */}
      {footer && (
        <footer className="border-t border-white/10 bg-black/40 backdrop-blur-xl">
          {footer}
        </footer>
      )}
    </div>
  );
};

PageLayout.displayName = 'PageLayout';

// Simple page wrapper without header/footer
export const Page: React.FC<{
  children: React.ReactNode;
  className?: string;
  maxWidth?: PageLayoutProps['maxWidth'];
  transition?: PageLayoutProps['transition'];
}> = ({ children, className, maxWidth = '2xl', transition = 'fade' }) => {
  const maxWidthClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    '2xl': 'max-w-[1400px]',
    full: 'max-w-full',
  };

  const transitionVariants = {
    fade: pageTransitions.fadeIn,
    slide: pageTransitions.slideUp,
    scale: pageTransitions.scaleIn,
    none: {},
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        variants={transitionVariants[transition]}
        initial="initial"
        animate="animate"
        exit="exit"
        className={cn('mx-auto px-4 sm:px-6 lg:px-8 py-8', maxWidthClasses[maxWidth], className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

Page.displayName = 'Page';