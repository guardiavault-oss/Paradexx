"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { Mode } from "@/styles/tokens";

export interface ShineBorderProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  borderRadius?: string;
  borderWidth?: number;
  mode?: Mode;
  color?: string;
  duration?: number;
  size?: number;
}

export const ShineBorder: React.FC<ShineBorderProps> = ({
  children,
  className,
  containerClassName,
  borderRadius = "1.5rem",
  borderWidth = 2,
  mode = "degen",
  color,
  duration = 3,
  size = 300,
}) => {
  const shineColor =
    color || (mode === "degen" ? "#ff3366" : "#00d4ff");

  return (
    <div
      className={cn(
        "relative overflow-hidden p-[1px]",
        containerClassName,
      )}
      style={{ borderRadius }}
    >
      {/* Animated shine effect */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg 270deg, ${shineColor} 270deg 360deg, transparent 360deg)`,
        }}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Inner content */}
      <div
        className={cn(
          "relative z-10 h-full w-full bg-black/90 backdrop-blur-xl",
          className,
        )}
        style={{
          borderRadius: `calc(${borderRadius} - ${borderWidth}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

ShineBorder.displayName = "ShineBorder";

// Rainbow border variant
export const RainbowBorder: React.FC<{
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  borderRadius?: string;
  duration?: number;
}> = ({
  children,
  className,
  containerClassName,
  borderRadius = "1.5rem",
  duration = 4,
}) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden p-[2px]",
        containerClassName,
      )}
      style={{ borderRadius }}
    >
      {/* Animated rainbow gradient */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000)",
          backgroundSize: "200% 100%",
        }}
        animate={{
          backgroundPosition: ["0% 0%", "200% 0%"],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Inner content */}
      <div
        className={cn(
          "relative z-10 h-full w-full bg-black/90 backdrop-blur-xl",
          className,
        )}
        style={{ borderRadius: `calc(${borderRadius} - 2px)` }}
      >
        {children}
      </div>
    </div>
  );
};

RainbowBorder.displayName = "RainbowBorder";

// Pulsing border
export const PulseBorder: React.FC<{
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  mode?: Mode;
  borderRadius?: string;
  duration?: number;
}> = ({
  children,
  className,
  containerClassName,
  mode = "degen",
  borderRadius = "1.5rem",
  duration = 2,
}) => {
  const color = mode === "degen" ? "#ff3366" : "#00d4ff";

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        containerClassName,
      )}
      style={{ borderRadius }}
    >
      {/* Pulsing border */}
      <motion.div
        className="absolute inset-0 rounded-[inherit]"
        style={{
          padding: "2px",
          background: color,
        }}
        animate={{
          opacity: [0.5, 1, 0.5],
          boxShadow: [
            `0 0 0px ${color}`,
            `0 0 20px ${color}`,
            `0 0 0px ${color}`,
          ],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Inner content */}
      <div
        className={cn(
          "relative z-10 h-full w-full bg-black/90 backdrop-blur-xl",
          className,
        )}
        style={{ borderRadius }}
      >
        {children}
      </div>
    </div>
  );
};

PulseBorder.displayName = "PulseBorder";

// Glitch border effect
export const GlitchBorder: React.FC<{
  children: React.ReactNode;
  className?: string;
  mode?: Mode;
  borderRadius?: string;
}> = ({
  children,
  className,
  mode = "degen",
  borderRadius = "1.5rem",
}) => {
  const [glitchActive, setGlitchActive] = React.useState(false);
  const color = mode === "degen" ? "#ff3366" : "#00d4ff";

  React.useEffect(() => {
    const interval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative" style={{ borderRadius }}>
      {/* Main border */}
      <div
        className={cn(
          "relative overflow-hidden p-[2px]",
          className,
        )}
        style={{ borderRadius }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: color,
            opacity: glitchActive ? 1 : 0.5,
            transition: "opacity 0.1s",
          }}
        />

        {glitchActive && (
          <>
            <motion.div
              className="absolute inset-0"
              style={{ background: color }}
              animate={{
                x: [0, -4, 4, -2, 2, 0],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 0.2,
              }}
            />
            <motion.div
              className="absolute inset-0"
              style={{ background: color }}
              animate={{
                x: [0, 2, -2, 1, -1, 0],
                opacity: [0.5, 0.9, 0.5],
              }}
              transition={{
                duration: 0.2,
                delay: 0.05,
              }}
            />
          </>
        )}

        <div
          className="relative z-10 h-full w-full bg-black/90 backdrop-blur-xl"
          style={{
            borderRadius: `calc(${borderRadius} - 2px)`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

GlitchBorder.displayName = "GlitchBorder";