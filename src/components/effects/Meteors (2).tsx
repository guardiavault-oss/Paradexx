"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { Mode } from "@/styles/tokens";

export interface MeteorsProps {
  number?: number;
  className?: string;
  mode?: Mode;
  meteorColor?: string;
}

export const Meteors: React.FC<MeteorsProps> = ({
  number = 20,
  className,
  mode = "degen",
  meteorColor,
}) => {
  const meteors = React.useMemo(() => {
    return Array.from({ length: number }, (_, idx) => ({
      id: idx,
      left: `${Math.floor(Math.random() * 100)}%`,
      animationDelay: `${Math.random() * 2}s`,
      animationDuration: `${Math.random() * 2 + 3}s`,
    }));
  }, [number]);

  const color =
    meteorColor || (mode === "degen" ? "#ff3366" : "#00d4ff");

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {meteors.map((meteor) => (
        <motion.span
          key={meteor.id}
          className="absolute top-0 h-0.5 w-0.5 rotate-[215deg] rounded-full shadow-lg"
          style={{
            left: meteor.left,
            backgroundColor: color,
            boxShadow: `0 0 0 1px ${color}20, 0 0 20px ${color}, 0 0 40px ${color}`,
            animationDelay: meteor.animationDelay,
            animationDuration: meteor.animationDuration,
          }}
          animate={{
            top: ["0%", "100%"],
            opacity: [1, 0],
          }}
          transition={{
            duration: parseFloat(meteor.animationDuration),
            delay: parseFloat(meteor.animationDelay),
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {/* Meteor tail */}
          <div
            className="absolute -top-0.5 h-px w-12 -rotate-45"
            style={{
              background: `linear-gradient(to right, ${color}, transparent)`,
            }}
          />
        </motion.span>
      ))}
    </div>
  );
};

Meteors.displayName = "Meteors";

// Shooting stars variant (larger, slower)
export const ShootingStars: React.FC<{
  number?: number;
  className?: string;
  mode?: Mode;
}> = ({ number = 5, className, mode = "degen" }) => {
  const stars = React.useMemo(() => {
    return Array.from({ length: number }, (_, idx) => ({
      id: idx,
      top: `${Math.floor(Math.random() * 50)}%`,
      left: `${Math.floor(Math.random() * 100)}%`,
      delay: Math.random() * 5,
      duration: 2 + Math.random() * 2,
    }));
  }, [number]);

  const color = mode === "degen" ? "#ff3366" : "#00d4ff";

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute"
          style={{
            top: star.top,
            left: star.left,
          }}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{
            x: [0, 200],
            y: [0, 200],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        >
          {/* Star head */}
          <div
            className="h-1 w-1 rounded-full"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 10px ${color}, 0 0 20px ${color}`,
            }}
          />
          {/* Star trail */}
          <motion.div
            className="absolute top-0 left-0 h-0.5 w-20 -rotate-45"
            style={{
              background: `linear-gradient(to right, ${color}, transparent)`,
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{
              scaleX: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: star.duration,
              delay: star.delay,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
};

ShootingStars.displayName = "ShootingStars";