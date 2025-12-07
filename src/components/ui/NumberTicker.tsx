import { motion, useSpring, useTransform } from 'motion/react';
import { useEffect } from 'react';

interface NumberTickerProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number;
}

export function NumberTicker({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  duration = 1,
}: NumberTickerProps) {
  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    duration: duration * 1000,
  });

  const display = useTransform(spring, (current) => {
    return prefix + current.toFixed(decimals) + suffix;
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span className={className}>
      {display}
    </motion.span>
  );
}

// Simpler version without motion
export function NumberTickerSimple({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}: Omit<NumberTickerProps, 'duration'>) {
  return (
    <span className={className}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}
