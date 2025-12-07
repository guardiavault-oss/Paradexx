"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { Mode } from "@/styles/tokens";

export interface AnimatedGradientTextProps {
  children: React.ReactNode;
  className?: string;
  mode?: Mode;
  colors?: string[];
  duration?: number;
  animationType?: "shift" | "wave" | "pulse" | "rainbow";
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
}

export const AnimatedGradientText: React.FC<
  AnimatedGradientTextProps
> = ({
  children,
  className,
  mode = "degen",
  colors,
  duration = 3,
  animationType = "shift",
  as: Component = "span",
}) => {
  const defaultColors =
    mode === "degen"
      ? ["#ff3366", "#ff9500", "#ff6b6b", "#ff3366"]
      : ["#00d4ff", "#00ff88", "#00aaff", "#00d4ff"];

  const gradientColors = colors || defaultColors;

  const animations = {
    shift: {
      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
    },
    wave: {
      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
      backgroundSize: ["100% 100%", "200% 200%", "100% 100%"],
    },
    pulse: {
      opacity: [0.8, 1, 0.8],
      scale: [1, 1.02, 1],
    },
    rainbow: {
      backgroundPosition: [
        "0% 50%",
        "100% 50%",
        "200% 50%",
        "0% 50%",
      ],
    },
  };

  return (
    <Component
      className={cn(
        "inline-block bg-clip-text text-transparent",
        className,
      )}
    >
      <motion.span
        className="inline-block bg-clip-text text-transparent"
        style={{
          background: `linear-gradient(to right, ${gradientColors.join(", ")})`,
          backgroundSize: "200% 100%",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
        animate={animations[animationType]}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {children}
      </motion.span>
    </Component>
  );
};

AnimatedGradientText.displayName = "AnimatedGradientText";

// Glowing text variant
export const GlowingText: React.FC<{
  children: React.ReactNode;
  className?: string;
  mode?: Mode;
  glowColor?: string;
  intensity?: "low" | "medium" | "high";
}> = ({
  children,
  className,
  mode = "degen",
  glowColor,
  intensity = "medium",
}) => {
  const color =
    glowColor || (mode === "degen" ? "#ff3366" : "#00d4ff");

  const glowSizes = {
    low: "10px",
    medium: "20px",
    high: "30px",
  };

  return (
    <motion.span
      className={cn("inline-block", className)}
      style={{
        color,
        textShadow: `0 0 ${glowSizes[intensity]} ${color}`,
      }}
      animate={{
        textShadow: [
          `0 0 ${glowSizes[intensity]} ${color}`,
          `0 0 ${parseInt(glowSizes[intensity]) * 2}px ${color}`,
          `0 0 ${glowSizes[intensity]} ${color}`,
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.span>
  );
};

GlowingText.displayName = "GlowingText";

// Typewriter effect
export const TypewriterText: React.FC<{
  text: string;
  className?: string;
  speed?: number;
  loop?: boolean;
  onComplete?: () => void;
}> = ({
  text,
  className,
  speed = 50,
  loop = false,
  onComplete,
}) => {
  const [displayText, setDisplayText] = React.useState("");
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length) {
      onComplete?.();

      if (loop) {
        setTimeout(() => {
          setDisplayText("");
          setCurrentIndex(0);
        }, 2000);
      }
    }
  }, [currentIndex, text, speed, loop, onComplete]);

  return (
    <span className={cn("inline-block", className)}>
      {displayText}
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="inline-block ml-0.5"
      >
        |
      </motion.span>
    </span>
  );
};

TypewriterText.displayName = "TypewriterText";

// Scramble text effect
export const ScrambleText: React.FC<{
  children: string;
  className?: string;
  duration?: number;
}> = ({ children, className, duration = 2 }) => {
  const [displayText, setDisplayText] =
    React.useState(children);

  const scramble = React.useCallback(() => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    const iterations = 10;
    let iteration = 0;

    const interval = setInterval(
      () => {
        setDisplayText((prev) =>
          children
            .split("")
            .map((char, index) => {
              if (index < iteration) {
                return children[index];
              }
              return chars[
                Math.floor(Math.random() * chars.length)
              ];
            })
            .join(""),
        );

        iteration += 1 / 3;

        if (iteration >= children.length) {
          clearInterval(interval);
          setDisplayText(children);
        }
      },
      (duration * 1000) / (iterations * children.length),
    );

    return () => clearInterval(interval);
  }, [children, duration]);

  React.useEffect(() => {
    return scramble();
  }, [scramble]);

  return <span className={className}>{displayText}</span>;
};

ScrambleText.displayName = "ScrambleText";