'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';
import { dropdownVariants as motionVariants, transitions } from '@/lib/motion';
import { Check, ChevronDown } from 'lucide-react';

const dropdownTriggerVariants = cva(
  `inline-flex items-center justify-between gap-2
   px-4 py-2 rounded-xl
   bg-black/40 backdrop-blur-xl
   border border-white/10
   text-white text-sm font-medium
   transition-all duration-300
   hover:bg-black/60 hover:border-white/20
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50
   disabled:opacity-50 disabled:cursor-not-allowed`,
  {
    variants: {
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      fullWidth: false,
    },
  }
);

const dropdownContentVariants = cva(
  `absolute z-[1000] mt-2 rounded-xl
   bg-black/90 backdrop-blur-xl
   border border-white/10
   shadow-2xl overflow-hidden`,
  {
    variants: {
      fullWidth: {
        true: 'w-full',
        false: 'min-w-[200px]',
      },
    },
    defaultVariants: {
      fullWidth: false,
    },
  }
);

interface DropdownContextValue {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  value: string | string[];
  onValueChange: (value: string | string[]) => void;
  multiple?: boolean;
}

const DropdownContext = React.createContext<DropdownContextValue | undefined>(undefined);

const useDropdownContext = () => {
  const context = React.useContext(DropdownContext);
  if (!context) {
    throw new Error('Dropdown components must be used within Dropdown');
  }
  return context;
};

// Main Dropdown component
export interface DropdownProps {
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  multiple?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  value: controlledValue,
  onValueChange,
  multiple = false,
  children,
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [uncontrolledValue, setUncontrolledValue] = React.useState<string | string[]>(
    multiple ? [] : ''
  );

  const value = controlledValue ?? uncontrolledValue;

  const handleValueChange = React.useCallback(
    (newValue: string | string[]) => {
      if (controlledValue === undefined) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [controlledValue, onValueChange]
  );

  return (
    <DropdownContext.Provider
      value={{ isOpen, setIsOpen, value, onValueChange: handleValueChange, multiple }}
    >
      <div className={cn('relative', className)}>{children}</div>
    </DropdownContext.Provider>
  );
};

// Dropdown Trigger
export interface DropdownTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
  placeholder?: string;
}

export const DropdownTrigger = React.forwardRef<HTMLButtonElement, DropdownTriggerProps>(
  ({ className, fullWidth, placeholder = 'Select...', children, ...props }, ref) => {
    const { isOpen, setIsOpen, value, multiple } = useDropdownContext();

    const displayValue = React.useMemo(() => {
      if (children) return children;
      if (Array.isArray(value)) {
        return value.length > 0 ? `${value.length} selected` : placeholder;
      }
      return value || placeholder;
    }, [value, placeholder, children, multiple]);

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(dropdownTriggerVariants({ fullWidth }), className)}
        {...props}
      >
        <span className="flex-1 text-left truncate">{displayValue}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={transitions.smooth}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>
    );
  }
);

DropdownTrigger.displayName = 'DropdownTrigger';

// Dropdown Content
export interface DropdownContentProps extends React.HTMLAttributes<HTMLDivElement> {
  fullWidth?: boolean;
}

export const DropdownContent = React.forwardRef<HTMLDivElement, DropdownContentProps>(
  ({ className, fullWidth, children, ...props }, ref) => {
    const { isOpen, setIsOpen } = useDropdownContext();
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
          document.removeEventListener('keydown', handleEscape);
        };
      }
    }, [isOpen, setIsOpen]);

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={contentRef}
            variants={motionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(dropdownContentVariants({ fullWidth }), className)}
            {...props}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

DropdownContent.displayName = 'DropdownContent';

// Dropdown Item
export interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  icon?: React.ReactNode;
}

export const DropdownItem = React.forwardRef<HTMLButtonElement, DropdownItemProps>(
  ({ className, value: itemValue, icon, children, ...props }, ref) => {
    const { value, onValueChange, setIsOpen, multiple } = useDropdownContext();

    const isSelected = Array.isArray(value)
      ? value.includes(itemValue)
      : value === itemValue;

    const handleClick = () => {
      if (multiple) {
        const newValue = Array.isArray(value)
          ? isSelected
            ? value.filter((v) => v !== itemValue)
            : [...value, itemValue]
          : [itemValue];
        onValueChange(newValue);
      } else {
        onValueChange(itemValue);
        setIsOpen(false);
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        className={cn(
          `w-full flex items-center gap-3 px-4 py-2.5
           text-sm text-left
           transition-colors duration-200
           hover:bg-white/10
           focus-visible:outline-none focus-visible:bg-white/10`,
          isSelected && 'bg-white/5 text-white font-medium',
          !isSelected && 'text-white/70',
          className
        )}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="flex-1">{children}</span>
        {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
      </button>
    );
  }
);

DropdownItem.displayName = 'DropdownItem';

// Dropdown Separator
export const DropdownSeparator: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('h-px bg-white/10 my-1', className)} />
);

DropdownSeparator.displayName = 'DropdownSeparator';

// Dropdown Label
export const DropdownLabel: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn('px-4 py-2 text-xs uppercase tracking-wide text-white/40', className)}>
    {children}
  </div>
);

DropdownLabel.displayName = 'DropdownLabel';
