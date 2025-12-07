import { motion } from 'motion/react';
import { ChevronRight, Home } from 'lucide-react';
import React from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ComponentType<any>;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  type?: 'degen' | 'regen';
  showHome?: boolean;
  className?: string;
}

export function Breadcrumbs({
  items,
  type = 'degen',
  showHome = true,
  className = '',
}: BreadcrumbsProps) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';

  const allItems = showHome
    ? [{ label: 'Home', icon: Home, onClick: () => window.location.href = '/' }, ...items]
    : items;

  return (
    <nav
      className={`flex items-center gap-2 text-sm overflow-x-auto scrollbar-hide ${className}`}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center gap-2 whitespace-nowrap">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const Icon = item.icon;

          return (
            <React.Fragment key={index}>
              <li className="flex items-center gap-2">
                {item.onClick || item.href ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={item.onClick}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
                      isLast
                        ? 'text-white font-bold'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                    style={
                      isLast
                        ? {
                            background: `${accentColor}20`,
                            color: accentColor,
                          }
                        : undefined
                    }
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {item.label}
                  </motion.button>
                ) : (
                  <span
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg font-bold"
                    style={{
                      background: `${accentColor}20`,
                      color: accentColor,
                    }}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {item.label}
                  </span>
                )}
              </li>

              {!isLast && (
                <ChevronRight className="w-4 h-4 text-white/40 flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

// Compact variant for mobile
export function BreadcrumbsCompact({
  items,
  type = 'degen',
}: {
  items: BreadcrumbItem[];
  type?: 'degen' | 'regen';
}) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';

  if (items.length === 0) return null;

  const lastItem = items[items.length - 1];
  const Icon = lastItem.icon;

  return (
    <div className="flex items-center gap-2">
      {items.length > 1 && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={items[items.length - 2].onClick}
          className="p-2 rounded-lg bg-white/5 border border-white/10"
        >
          <ChevronRight className="w-4 h-4 text-white/60 rotate-180" />
        </motion.button>
      )}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg font-bold"
        style={{
          background: `${accentColor}20`,
          color: accentColor,
        }}
      >
        {Icon && <Icon className="w-4 h-4" />}
        {lastItem.label}
      </div>
    </div>
  );
}
