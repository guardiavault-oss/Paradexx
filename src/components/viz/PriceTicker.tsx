/**
 * PriceTicker Component
 * Live price display with number morphing animation and sparkline
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';

// ==============================================
// TYPES & INTERFACES
// ==============================================

export interface PriceTickerProps {
  value: number;
  decimals?: number;
  currency?: string;
  showChange?: boolean;
  showSparkline?: boolean;
  history?: number[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// ==============================================
// NUMBER MORPHING UTILITIES
// ==============================================

function AnimatedDigit({ value }: { value: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    if (value === previousValue.current) return;

    // Animate digit change
    setDisplayValue(value);
    previousValue.current = value;
  }, [value]);

  return (
    <motion.span
      key={value}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="inline-block"
    >
      {displayValue}
    </motion.span>
  );
}

// ==============================================
// SPARKLINE COMPONENT
// ==============================================

function Sparkline({
  data,
  width = 100,
  height = 30,
  color,
}: {
  data: number[];
  width?: number;
  height?: number;
  color: string;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Calculate points
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      className="absolute inset-0 opacity-20"
      style={{ pointerEvents: 'none' }}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ==============================================
// PRICE TICKER COMPONENT
// ==============================================

export function PriceTicker({
  value,
  decimals = 2,
  currency = '$',
  showChange = true,
  showSparkline = false,
  history = [],
  size = 'md',
  className = '',
}: PriceTickerProps) {
  const [previousValue, setPreviousValue] = useState(value);
  const [delta, setDelta] = useState(0);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const flashTimeoutRef = useRef<NodeJS.Timeout>();

  // Animated value using spring
  const springValue = useSpring(value, {
    stiffness: 100,
    damping: 15,
  });

  const displayValue = useTransform(springValue, (latest) =>
    latest.toFixed(decimals)
  );

  // Size variants
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  // Handle value changes
  useEffect(() => {
    if (value === previousValue) return;

    const change = value - previousValue;
    setDelta(change);
    setPreviousValue(value);

    // Flash color
    const color = change > 0 ? '#10b981' : change < 0 ? '#ef4444' : null;
    setFlashColor(color);

    // Clear flash after animation
    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current);
    }
    flashTimeoutRef.current = setTimeout(() => {
      setFlashColor(null);
    }, 500);

    springValue.set(value);
  }, [value, previousValue, springValue]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, []);

  // Format delta for display
  const deltaFormatted = Math.abs(delta).toFixed(decimals);
  const deltaPercent = previousValue !== 0 
    ? ((delta / previousValue) * 100).toFixed(2) 
    : '0.00';

  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`}>
      {/* Sparkline background */}
      {showSparkline && history.length > 0 && (
        <div className="absolute inset-0 -z-10">
          <Sparkline
            data={history}
            width={200}
            height={60}
            color={flashColor || '#6b7280'}
          />
        </div>
      )}

      {/* Price display */}
      <motion.div
        className={`font-mono font-bold ${sizeClasses[size]} relative`}
        animate={{
          color: flashColor || 'currentColor',
        }}
        transition={{ duration: 0.5 }}
      >
        {/* Currency symbol */}
        <span className="opacity-60">{currency}</span>

        {/* Animated digits */}
        {displayValue.get().split('').map((char, index) => (
          <AnimatedDigit key={`${index}-${char}`} value={char} />
        ))}

        {/* Flash effect overlay */}
        {flashColor && (
          <motion.div
            className="absolute inset-0 rounded pointer-events-none"
            initial={{ opacity: 0.3, scale: 1 }}
            animate={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5 }}
            style={{
              backgroundColor: flashColor,
              filter: 'blur(10px)',
            }}
          />
        )}
      </motion.div>

      {/* Delta indicator */}
      {showChange && delta !== 0 && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={`flex items-center gap-1 text-sm font-medium ${
            delta > 0 ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {/* Arrow icon */}
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {delta > 0 ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            )}
          </svg>

          {/* Delta value */}
          <span>
            {deltaFormatted} ({deltaPercent}%)
          </span>
        </motion.div>
      )}
    </div>
  );
}

export default PriceTicker;
