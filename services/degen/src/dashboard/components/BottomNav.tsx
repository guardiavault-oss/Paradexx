import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Search, 
  Repeat, 
  PieChart, 
  Settings,
  Zap
} from 'lucide-react';
import { cn } from './ui';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: <Home size={22} /> },
  { path: '/analyze', label: 'Analyze', icon: <Search size={22} /> },
  { path: '/trade', label: 'Trade', icon: <Repeat size={22} /> },
  { path: '/positions', label: 'Positions', icon: <PieChart size={22} /> },
  { path: '/settings', label: 'Settings', icon: <Settings size={22} /> },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-dark-900/95 backdrop-blur-xl border-t border-dark-800/50 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center gap-1 w-16 h-full relative"
            >
              <div className={cn(
                'transition-colors duration-200',
                isActive ? 'text-accent-cyan' : 'text-dark-500'
              )}>
                {item.icon}
              </div>
              <span className={cn(
                'text-[10px] font-medium transition-colors duration-200',
                isActive ? 'text-accent-cyan' : 'text-dark-500'
              )}>
                {item.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="nav-indicator"
                  className="absolute -top-px left-3 right-3 h-0.5 bg-accent-cyan rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

// Quick Action Floating Button
export const QuickActionButton: React.FC<{
  onClick: () => void;
}> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-accent-cyan rounded-full 
               flex items-center justify-center shadow-lg shadow-accent-cyan/20
               active:scale-95 transition-transform"
  >
    <Zap className="text-dark-900" size={24} />
  </button>
);
