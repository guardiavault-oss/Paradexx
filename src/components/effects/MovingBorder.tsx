"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { Mode } from "@/styles/tokens";

export interface MovingBorderProps {
  children: React.ReactNode;
  duration?: number;
  className?: string;
  containerClassName?: string;
  borderClassName?: string;
  mode?: Mode;
  borderRadius?: string;
  borderWidth?: number;
  as?: React.ElementType;
}

export const MovingBorder: React.FC<MovingBorderProps> = ({
  children,
  duration = 3,
  className,
  containerClassName,
  borderClassName,
  mode = "degen",
  borderRadius = "1.5rem",
  borderWidth = 2,
  as: Component = "div",
}) => {
  const gradientColors =
    mode === "degen"
      ? ["#ff3366", "#ff9500", "#ff6b6b", "#ff3366"]
      : ["#00d4ff", "#00ff88", "#00aaff", "#00d4ff"];

  return (
    <Component
      className={cn(
        "relative overflow-hidden p-[1px] backdrop-blur-xl",
        containerClassName,
      )}
      style={{
        borderRadius,
      }}
    >
      {/* Animated border gradient */}
      <motion.div
        className={cn("absolute inset-0 z-0", borderClassName)}
        style={{
          background: `linear-gradient(90deg, ${gradientColors.join(", ")})`,
          backgroundSize: "300% 100%",
        }}
        animate={{
          backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
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
    </Component>
  );
};

MovingBorder.displayName = "MovingBorder";

// Button variant with moving border
export const MovingBorderButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  mode?: Mode;
  duration?: number;
}> = ({
  children,
  onClick,
  className,
  mode = "degen",
  duration = 2,
}) => {
  return (
    <MovingBorder
      duration={duration}
      mode={mode}
      containerClassName={cn("cursor-pointer", className)}
      className="px-6 py-3"
      as="button"
      onClick={onClick}
    >
      <span className="font-bold uppercase tracking-wide text-white">
        {children}
      </span>
    </MovingBorder>
  );
};

MovingBorderButton.displayName = "MovingBorderButton";