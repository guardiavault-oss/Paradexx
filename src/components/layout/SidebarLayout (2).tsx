'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/cn';
import { Mode } from '@/styles/tokens';
import { Menu, X } from 'lucide-react';

export interface SidebarLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  className?: string;
  sidebarClassName?: string;
  mode?: Mode;
  sidebarWidth?: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  mobileBreakpoint?: 'sm' | 'md' | 'lg';
  position?: 'left' | 'right';
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  children,
  sidebar,
  className,
  sidebarClassName,
  mode = 'degen',
  sidebarWidth = 256,
  collapsible = true,
  defaultCollapsed = false,
  mobileBreakpoint = 'lg',
  position = 'left',
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const breakpointClass = {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
  }[mobileBreakpoint];

  const collapsedWidth = 80;
  const currentWidth = isCollapsed ? collapsedWidth : sidebarWidth;

  React.useEffect(() => {
    // Close mobile sidebar when resizing to desktop
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  React.useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  return (
    <div className="relative min-h-screen bg-black">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className={cn(
          'fixed top-4 z-[60] p-3 rounded-xl',
          'bg-black/90 backdrop-blur-xl border border-white/10',
          'text-white hover:bg-white/10 transition-colors',
          `${breakpointClass}:hidden`,
          position === 'left' ? 'left-4' : 'right-4'
        )}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className={cn('fixed inset-0 z-40 bg-black/70 backdrop-blur-sm', `${breakpointClass}:hidden`)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {(isMobileOpen || true) && (
          <motion.aside
            initial={{ x: position === 'left' ? -sidebarWidth : sidebarWidth }}
            animate={{
              x: 0,
              width: currentWidth,
            }}
            exit={{ x: position === 'left' ? -sidebarWidth : sidebarWidth }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              'fixed inset-y-0 z-50',
              'bg-black/90 backdrop-blur-xl border-white/10',
              'overflow-y-auto overflow-x-hidden',
              position === 'left' ? 'left-0 border-r' : 'right-0 border-l',
              `${breakpointClass}:z-30`,
              // Hide on mobile unless open
              `max-${breakpointClass}:${isMobileOpen ? 'block' : 'hidden'}`,
              sidebarClassName
            )}
            style={{ width: sidebarWidth }}
          >
            {/* Collapse toggle button (desktop only) */}
            {collapsible && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn(
                  'absolute top-4 z-10 p-2 rounded-lg',
                  'bg-white/5 hover:bg-white/10 transition-colors',
                  'text-white/60 hover:text-white',
                  `hidden ${breakpointClass}:block`,
                  position === 'left' ? 'right-4' : 'left-4'
                )}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <motion.div
                  animate={{ rotate: isCollapsed ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  {position === 'left' ? '←' : '→'}
                </motion.div>
              </button>
            )}

            {/* Sidebar content */}
            <div className="p-6">{sidebar}</div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main
        className={cn(
          'transition-all duration-300',
          `${breakpointClass}:ml-${position === 'left' ? `[${currentWidth}px]` : '0'}`,
          `${breakpointClass}:mr-${position === 'right' ? `[${currentWidth}px]` : '0'}`,
          className
        )}
        style={{
          marginLeft: position === 'left' && window.innerWidth >= 1024 ? currentWidth : 0,
          marginRight: position === 'right' && window.innerWidth >= 1024 ? currentWidth : 0,
        }}
      >
        {children}
      </main>
    </div>
  );
};

SidebarLayout.displayName = 'SidebarLayout';

// Sidebar navigation item
export const SidebarItem: React.FC<{
  children: React.ReactNode;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  mode?: Mode;
}> = ({ children, icon, active, onClick, className, mode = 'degen' }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl',
        'text-left transition-all duration-200',
        'group relative overflow-hidden',
        active
          ? cn(
              'bg-white/10 text-white',
              mode === 'degen' && 'shadow-[0_0_20px_rgba(255,51,102,0.2)]',
              mode === 'regen' && 'shadow-[0_0_20px_rgba(0,212,255,0.2)]'
            )
          : 'text-white/60 hover:text-white hover:bg-white/5',
        className
      )}
    >
      {active && (
        <motion.div
          layoutId="sidebar-active"
          className={cn(
            'absolute inset-0 rounded-xl',
            mode === 'degen' && 'bg-degen-primary/10',
            mode === 'regen' && 'bg-regen-primary/10'
          )}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}

      {icon && (
        <span className="relative z-10 flex-shrink-0 w-5 h-5">
          {icon}
        </span>
      )}

      <span className="relative z-10 font-medium">{children}</span>
    </button>
  );
};

SidebarItem.displayName = 'SidebarItem';

// Sidebar section
export const SidebarSection: React.FC<{
  children: React.ReactNode;
  title?: string;
  className?: string;
}> = ({ children, title, className }) => {
  return (
    <div className={cn('mb-6', className)}>
      {title && (
        <h3 className="px-4 mb-3 text-xs uppercase tracking-wider text-white/40 font-bold">
          {title}
        </h3>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
};

SidebarSection.displayName = 'SidebarSection';
