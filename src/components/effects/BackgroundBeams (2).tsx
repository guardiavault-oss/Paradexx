"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { Mode } from "@/styles/tokens";

export interface BackgroundBeamsProps {
  className?: string;
  mode?: Mode;
  pathColor?: string;
  gradientColor?: string;
  numberOfBeams?: number;
}

export const BackgroundBeams: React.FC<
  BackgroundBeamsProps
> = ({
  className,
  mode = "degen",
  pathColor,
  gradientColor,
  numberOfBeams = 6,
}) => {
  const beamColor =
    pathColor ||
    (mode === "degen"
      ? "rgba(255, 51, 102, 0.3)"
      : "rgba(0, 212, 255, 0.3)");

  const gradColor =
    gradientColor || (mode === "degen" ? "#ff3366" : "#00d4ff");

  const paths = React.useMemo(() => {
    return Array.from({ length: numberOfBeams }, (_, i) => ({
      d: `M${Math.random() * 100} 0 Q${Math.random() * 100} ${Math.random() * 100}, ${Math.random() * 100} 100`,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 2,
    }));
  }, [numberOfBeams]);

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id={`beam-gradient-${mode}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor={gradColor}
              stopOpacity="0"
            />
            <stop
              offset="50%"
              stopColor={gradColor}
              stopOpacity="0.5"
            />
            <stop
              offset="100%"
              stopColor={gradColor}
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {paths.map((path, index) => (
          <motion.path
            key={index}
            d={path.d}
            stroke={`url(#beam-gradient-${mode})`}
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: path.duration,
              delay: path.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80"
        style={{
          background: `radial-gradient(ellipse at center, transparent 0%, black 100%)`,
        }}
      />
    </div>
  );
};

BackgroundBeams.displayName = "BackgroundBeams";

// Animated grid lines variant
export const GridBeams: React.FC<{
  className?: string;
  mode?: Mode;
  gridColor?: string;
  glowColor?: string;
}> = ({ className, mode = "degen", gridColor, glowColor }) => {
  const lineColor = gridColor || "rgba(255, 255, 255, 0.05)";
  const glow =
    glowColor || (mode === "degen" ? "#ff3366" : "#00d4ff");

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {/* Horizontal lines */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={`h-${i}`}
          className="absolute h-px w-full"
          style={{
            top: `${(i + 1) * 5}%`,
            background: `linear-gradient(90deg, transparent, ${lineColor}, transparent)`,
          }}
          animate={{
            boxShadow: [
              `0 0 0px ${glow}`,
              `0 0 20px ${glow}`,
              `0 0 0px ${glow}`,
            ],
          }}
          transition={{
            duration: 3,
            delay: i * 0.1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Vertical lines */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={`v-${i}`}
          className="absolute h-full w-px"
          style={{
            left: `${(i + 1) * 5}%`,
            background: `linear-gradient(180deg, transparent, ${lineColor}, transparent)`,
          }}
          animate={{
            boxShadow: [
              `0 0 0px ${glow}`,
              `0 0 20px ${glow}`,
              `0 0 0px ${glow}`,
            ],
          }}
          transition={{
            duration: 3,
            delay: i * 0.1 + 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

GridBeams.displayName = "GridBeams";