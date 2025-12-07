import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight, ArrowDownRight, RefreshCw, ChevronRight,
  AlertTriangle, CheckCircle, XCircle, Info
} from 'lucide-react';

// ============================================================================
// UTILITY
// ============================================================================

export const cn = (...classes: (string | boolean | undefined)[]) => 
  classes.filter(Boolean).join(' ');

// ============================================================================
// MOBILE LAYOUT COMPONENTS
// ============================================================================

export const MobileContainer: React.FC<{ 
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn(
    'min-h-screen bg-dark-950 text-white pb-20',
    className
  )}>
    {children}
  </div>
);

export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  onBack?: () => void;
}> = ({ title, subtitle, action, onBack }) => (
  <div className="sticky top-0 z-40 bg-dark-900/95 backdrop-blur-xl border-b border-dark-800/50">
    <div className="px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {onBack && (
          <button 
            onClick={onBack}
            className="p-1 -ml-1 text-dark-400 hover:text-white transition-colors"
          >
            <ChevronRight className="rotate-180" size={24} />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-white">{title}</h1>
          {subtitle && (
            <p className="text-sm text-dark-400">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  </div>
);

export const Section: React.FC<{
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, action, children, className }) => (
  <div className={cn('px-4 py-3', className)}>
    {(title || action) && (
      <div className="flex items-center justify-between mb-3">
        {title && <h2 className="text-lg font-semibold text-white">{title}</h2>}
        {action}
      </div>
    )}
    {children}
  </div>
);

// ============================================================================
// CARD COMPONENTS
// ============================================================================

export const Card: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}> = ({ children, className, glow, onClick }) => (
  <div 
    onClick={onClick}
    className={cn(
      'bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl',
      glow && 'ring-1 ring-accent-cyan/20',
      onClick && 'cursor-pointer active:scale-[0.98] transition-transform',
      className
    )}
  >
    {children}
  </div>
);

export const StatCard: React.FC<{
  label: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color?: 'cyan' | 'green' | 'red' | 'orange' | 'purple';
  compact?: boolean;
}> = ({ label, value, change, icon, color = 'cyan', compact }) => {
  const colorClasses = {
    cyan: 'text-accent-cyan bg-accent-cyan/10',
    green: 'text-accent-green bg-accent-green/10',
    red: 'text-accent-red bg-accent-red/10',
    orange: 'text-accent-orange bg-accent-orange/10',
    purple: 'text-accent-purple bg-accent-purple/10',
  };
  
  const textColor = {
    cyan: 'text-accent-cyan',
    green: 'text-accent-green',
    red: 'text-accent-red',
    orange: 'text-accent-orange',
    purple: 'text-accent-purple',
  };
  
  return (
    <Card className={cn(compact ? 'p-3' : 'p-4')}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-dark-400 text-xs uppercase tracking-wide">{label}</p>
          <p className={cn(
            compact ? 'text-lg' : 'text-2xl',
            'font-bold mt-1',
            textColor[color]
          )}>{value}</p>
          {change !== undefined && (
            <div className={cn(
              'flex items-center gap-1 mt-1 text-xs',
              change >= 0 ? 'text-accent-green' : 'text-accent-red'
            )}>
              {change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(change).toFixed(2)}%
            </div>
          )}
        </div>
        <div className={cn(
          'p-2 rounded-xl',
          colorClasses[color]
        )}>
          {icon}
        </div>
      </div>
    </Card>
  );
};

export const TokenCard: React.FC<{
  symbol: string;
  name?: string;
  value?: string;
  subValue?: string;
  change?: number;
  icon?: React.ReactNode;
  onClick?: () => void;
}> = ({ symbol, name, value, subValue, change, icon, onClick }) => (
  <Card className="p-4" onClick={onClick}>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-accent-cyan/10 flex items-center justify-center text-accent-cyan font-bold">
        {icon || symbol.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium">{symbol}</p>
        {name && <p className="text-dark-400 text-sm truncate">{name}</p>}
      </div>
      {(value || change !== undefined) && (
        <div className="text-right">
          {value && <p className="text-white font-medium">{value}</p>}
          {subValue && <p className="text-dark-400 text-xs">{subValue}</p>}
          {change !== undefined && (
            <p className={cn(
              'text-sm font-medium',
              change >= 0 ? 'text-accent-green' : 'text-accent-red'
            )}>
              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
            </p>
          )}
        </div>
      )}
      {onClick && (
        <ChevronRight className="text-dark-500" size={20} />
      )}
    </div>
  </Card>
);

// ============================================================================
// FORM COMPONENTS
// ============================================================================

export const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled, 
  loading, 
  fullWidth,
  className,
  type = 'button'
}) => {
  const variants = {
    primary: 'bg-accent-cyan hover:bg-accent-cyan/80 text-dark-900 font-semibold',
    secondary: 'bg-dark-700 hover:bg-dark-600 text-white',
    danger: 'bg-accent-red hover:bg-accent-red/80 text-white font-semibold',
    success: 'bg-accent-green hover:bg-accent-green/80 text-dark-900 font-semibold',
    ghost: 'bg-transparent hover:bg-dark-800 text-white',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2.5 text-base rounded-xl',
    lg: 'px-6 py-3 text-lg rounded-xl',
    xl: 'px-8 py-4 text-lg rounded-2xl',
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'transition-all duration-200 flex items-center justify-center gap-2',
        'active:scale-[0.98]',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {loading && <RefreshCw size={16} className="animate-spin" />}
      {children}
    </button>
  );
};

export const Input: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  label?: string;
  error?: string;
  helper?: string;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}> = ({ value, onChange, placeholder, type = 'text', label, error, helper, icon, className, disabled }) => (
  <div className={className}>
    {label && <label className="block text-sm text-dark-400 mb-2">{label}</label>}
    <div className="relative">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500">
          {icon}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full bg-dark-900/50 border rounded-xl px-4 py-3',
          'text-white placeholder-dark-500',
          'focus:outline-none focus:border-accent-cyan transition-colors',
          icon && 'pl-12',
          error ? 'border-accent-red' : 'border-dark-700',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />
    </div>
    {error && <p className="text-accent-red text-xs mt-1">{error}</p>}
    {helper && !error && <p className="text-dark-500 text-xs mt-1">{helper}</p>}
  </div>
);

export const Select: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label?: string;
  className?: string;
}> = ({ value, onChange, options, label, className }) => (
  <div className={className}>
    {label && <label className="block text-sm text-dark-400 mb-2">{label}</label>}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-dark-900/50 border border-dark-700 rounded-xl px-4 py-3
                 text-white focus:outline-none focus:border-accent-cyan transition-colors
                 appearance-none cursor-pointer"
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23565869' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

export const Toggle: React.FC<{
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  description?: string;
}> = ({ value, onChange, label, description }) => (
  <div 
    className="flex items-center justify-between py-2 cursor-pointer"
    onClick={() => onChange(!value)}
  >
    <div>
      {label && <p className="text-white font-medium">{label}</p>}
      {description && <p className="text-dark-400 text-sm">{description}</p>}
    </div>
    <div className={cn(
      'w-12 h-7 rounded-full p-1 transition-colors',
      value ? 'bg-accent-cyan' : 'bg-dark-700'
    )}>
      <div className={cn(
        'w-5 h-5 rounded-full bg-white transition-transform',
        value && 'translate-x-5'
      )} />
    </div>
  </div>
);

// ============================================================================
// FEEDBACK COMPONENTS
// ============================================================================

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'sm' | 'md';
}> = ({ children, variant = 'default', size = 'md' }) => {
  const variants = {
    success: 'bg-accent-green/10 text-accent-green border-accent-green/20',
    warning: 'bg-accent-orange/10 text-accent-orange border-accent-orange/20',
    error: 'bg-accent-red/10 text-accent-red border-accent-red/20',
    info: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20',
    default: 'bg-dark-700 text-dark-300 border-dark-600',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };
  
  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium border',
      variants[variant],
      sizes[size]
    )}>
      {children}
    </span>
  );
};

export const Alert: React.FC<{
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message?: string;
  onDismiss?: () => void;
}> = ({ type, title, message, onDismiss }) => {
  const styles = {
    info: { bg: 'bg-accent-cyan/10', border: 'border-accent-cyan/20', icon: <Info className="text-accent-cyan" size={20} /> },
    warning: { bg: 'bg-accent-orange/10', border: 'border-accent-orange/20', icon: <AlertTriangle className="text-accent-orange" size={20} /> },
    error: { bg: 'bg-accent-red/10', border: 'border-accent-red/20', icon: <XCircle className="text-accent-red" size={20} /> },
    success: { bg: 'bg-accent-green/10', border: 'border-accent-green/20', icon: <CheckCircle className="text-accent-green" size={20} /> },
  };
  
  const { bg, border, icon } = styles[type];
  
  return (
    <div className={cn('rounded-xl p-4 border', bg, border)}>
      <div className="flex gap-3">
        {icon}
        <div className="flex-1">
          <p className="text-white font-medium">{title}</p>
          {message && <p className="text-dark-400 text-sm mt-1">{message}</p>}
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-dark-500 hover:text-white">
            <XCircle size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export const Skeleton: React.FC<{
  className?: string;
}> = ({ className }) => (
  <div className={cn('bg-dark-700/50 animate-pulse rounded', className)} />
);

export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-16 h-16 rounded-full bg-dark-800 flex items-center justify-center text-dark-500 mb-4">
      {icon}
    </div>
    <h3 className="text-white font-medium mb-1">{title}</h3>
    {description && <p className="text-dark-400 text-sm mb-4">{description}</p>}
    {action}
  </div>
);

// ============================================================================
// PROGRESS COMPONENTS
// ============================================================================

export const ProgressBar: React.FC<{
  value: number;
  max?: number;
  color?: 'cyan' | 'green' | 'red' | 'orange' | 'purple';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ value, max = 100, color = 'cyan', showLabel, size = 'md' }) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colors = {
    cyan: 'bg-accent-cyan',
    green: 'bg-accent-green',
    red: 'bg-accent-red',
    orange: 'bg-accent-orange',
    purple: 'bg-accent-purple',
  };
  
  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };
  
  return (
    <div>
      <div className={cn('w-full bg-dark-700 rounded-full overflow-hidden', heights[size])}>
        <motion.div 
          className={cn('h-full rounded-full', colors[color])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <p className="text-dark-400 text-xs mt-1 text-right">{percentage.toFixed(0)}%</p>
      )}
    </div>
  );
};

export const ScoreRing: React.FC<{
  score: number;
  size?: number;
  label?: string;
}> = ({ score, size = 80, label }) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  const getColor = (s: number) => {
    if (s >= 70) return '#22c55e';
    if (s >= 40) return '#f97316';
    return '#ef4444';
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#40414f"
            strokeWidth="4"
            fill="transparent"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getColor(score)}
            strokeWidth="4"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-white">{score}</span>
        </div>
      </div>
      {label && <p className="text-dark-400 text-xs mt-2">{label}</p>}
    </div>
  );
};

// ============================================================================
// LIST COMPONENTS
// ============================================================================

export const ListItem: React.FC<{
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
}> = ({ title, subtitle, leading, trailing, onClick }) => (
  <div 
    className={cn(
      'flex items-center gap-3 py-3 px-4 -mx-4',
      onClick && 'cursor-pointer active:bg-dark-800/50 transition-colors'
    )}
    onClick={onClick}
  >
    {leading}
    <div className="flex-1 min-w-0">
      <p className="text-white font-medium truncate">{title}</p>
      {subtitle && <p className="text-dark-400 text-sm truncate">{subtitle}</p>}
    </div>
    {trailing}
    {onClick && !trailing && <ChevronRight className="text-dark-500" size={20} />}
  </div>
);

export const Divider: React.FC<{
  className?: string;
}> = ({ className }) => (
  <div className={cn('h-px bg-dark-800', className)} />
);

// ============================================================================
// TABS COMPONENT
// ============================================================================

export const Tabs: React.FC<{
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'pills' | 'underline';
}> = ({ tabs, activeTab, onChange, variant = 'pills' }) => {
  if (variant === 'underline') {
    return (
      <div className="flex border-b border-dark-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative',
              activeTab === tab.id 
                ? 'text-accent-cyan' 
                : 'text-dark-400 hover:text-white'
            )}
          >
            {tab.icon}
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-cyan"
              />
            )}
          </button>
        ))}
      </div>
    );
  }
  
  return (
    <div className="flex gap-2 p-1 bg-dark-800/50 rounded-xl">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all',
            activeTab === tab.id 
              ? 'bg-accent-cyan text-dark-900' 
              : 'text-dark-400 hover:text-white'
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// PULL TO REFRESH
// ============================================================================

export const PullToRefresh: React.FC<{
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}> = ({ onRefresh, children }) => {
  const [refreshing, setRefreshing] = React.useState(false);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };
  
  return (
    <div>
      {refreshing && (
        <div className="flex justify-center py-4">
          <RefreshCw className="animate-spin text-accent-cyan" size={24} />
        </div>
      )}
      {children}
    </div>
  );
};
