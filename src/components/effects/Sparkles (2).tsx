"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/cn";
import { Mode } from "@/styles/tokens";

interface Sparkle {
  id: string;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

export interface SparklesProps {
  children?: React.ReactNode;
  className?: string;
  mode?: Mode;
  sparkleColor?: string;
  density?: number;
  speed?: number;
  minSize?: number;
  maxSize?: number;
}

export const Sparkles: React.FC<SparklesProps> = ({
  children,
  className,
  mode = "degen",
  sparkleColor,
  density = 10,
  speed = 3,
  minSize = 2,
  maxSize = 6,
}) => {
  const [sparkles, setSparkles] = React.useState<Sparkle[]>([]);

  const color =
    sparkleColor || (mode === "degen" ? "#ff3366" : "#00d4ff");

  const generateSparkle = React.useCallback((): Sparkle => {
    return {
      id: `sparkle-${Date.now()}-${Math.random()}`,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: minSize + Math.random() * (maxSize - minSize),
      duration: 0.5 + Math.random() * speed,
      delay: Math.random() * 0.5,
    };
  }, [minSize, maxSize, speed]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const newSparkle = generateSparkle();
      setSparkles((prev) => [
        ...prev.slice(-density),
        newSparkle,
      ]);
    }, 200);

    return () => clearInterval(interval);
  }, [density, generateSparkle]);

  return (
    <div className={cn("relative", className)}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <AnimatePresence>
          {sparkles.map((sparkle) => (
            <motion.div
              key={sparkle.id}
              className="absolute"
              style={{
                left: `${sparkle.x}%`,
                top: `${sparkle.y}%`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{
                duration: sparkle.duration,
                delay: sparkle.delay,
                ease: "easeInOut",
              }}
              onAnimationComplete={() => {
                setSparkles((prev) =>
                  prev.filter((s) => s.id !== sparkle.id),
                );
              }}
            >
              {/* Star shape */}
              <svg
                width={sparkle.size}
                height={sparkle.size}
                viewBox="0 0 24 24"
                fill={color}
                style={{
                  filter: `drop-shadow(0 0 ${sparkle.size}px ${color})`,
                }}
              >
                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
              </svg>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {children}
    </div>
  );
};

Sparkles.displayName = "Sparkles";

// Text with sparkle effect
export const SparkleText: React.FC<{
  children: React.ReactNode;
  className?: string;
  mode?: Mode;
}> = ({ children, className, mode = "degen" }) => {
  return (
    <Sparkles
      mode={mode}
      density={15}
      speed={2}
      minSize={3}
      maxSize={8}
      className={className}
    >
      <span className="relative inline-block">{children}</span>
    </Sparkles>
  );
};

SparkleText.displayName = "SparkleText";

// Card with sparkle border
export const SparkleCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  mode?: Mode;
}> = ({ children, className, mode = "degen" }) => {
  const [particles, setParticles] = React.useState<
    Array<{ id: number; offset: number }>
  >([]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setParticles((prev) => {
        const newParticle = {
          id: Date.now(),
          offset: Math.random() * 100,
        };
        return [...prev.slice(-5), newParticle];
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const color = mode === "degen" ? "#ff3366" : "#00d4ff";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl",
        className,
      )}
    >
      {/* Animated border particles */}
      <div className="pointer-events-none absolute inset-0">
        <AnimatePresence>
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute h-1 w-1 rounded-full"
              style={{
                backgroundColor: color,
                boxShadow: `0 0 10px ${color}`,
              }}
              initial={{
                offsetDistance: `${particle.offset}%`,
                opacity: 0,
                scale: 0,
              }}
              animate={{
                offsetDistance: ["0%", "100%"],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 3,
                ease: "linear",
              }}
              style={{
                offsetPath:
                  'path("M 0 0 L 100 0 L 100 100 L 0 100 Z")',
                offsetRotate: "0deg",
              }}
            />
          ))}
        </AnimatePresence>
      </div>
      {children}
    </div>
  );
};

SparkleCard.displayName = "SparkleCard";