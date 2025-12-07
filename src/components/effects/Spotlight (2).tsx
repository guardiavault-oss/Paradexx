"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useSpring,
} from "motion/react";
import { cn } from "@/lib/cn";
import { Mode } from "@/styles/tokens";

export interface SpotlightProps {
  className?: string;
  mode?: Mode;
  fill?: string;
  size?: number;
  opacity?: number;
  blur?: number;
}

export const Spotlight: React.FC<SpotlightProps> = ({
  className,
  mode = "degen",
  fill,
  size = 800,
  opacity = 0.15,
  blur = 100,
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothMouseX = useSpring(mouseX, {
    stiffness: 100,
    damping: 30,
  });
  const smoothMouseY = useSpring(mouseY, {
    stiffness: 100,
    damping: 30,
  });

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () =>
      window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const gradientColor =
    fill || (mode === "degen" ? "#ff3366" : "#00d4ff");

  return (
    <motion.div
      className={cn(
        "pointer-events-none fixed inset-0 z-0",
        className,
      )}
      style={{
        background: `radial-gradient(${size}px circle at var(--mouse-x) var(--mouse-y), ${gradientColor}, transparent ${opacity * 100}%)`,
        // @ts-ignore
        "--mouse-x": smoothMouseX,
        "--mouse-y": smoothMouseY,
        filter: `blur(${blur}px)`,
      }}
    />
  );
};

Spotlight.displayName = "Spotlight";

// Alternative spotlight that follows cursor more precisely
export const SpotlightCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  mode?: Mode;
  spotlightColor?: string;
}> = ({
  children,
  className,
  mode = "degen",
  spotlightColor,
}) => {
  const [mousePosition, setMousePosition] = React.useState({
    x: 0,
    y: 0,
  });
  const [isHovered, setIsHovered] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const color =
    spotlightColor ||
    (mode === "degen"
      ? "rgba(255, 51, 102, 0.3)"
      : "rgba(0, 212, 255, 0.3)");

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn("relative overflow-hidden", className)}
    >
      {isHovered && (
        <motion.div
          className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, ${color}, transparent 40%)`,
          }}
          animate={{ opacity: isHovered ? 1 : 0 }}
        />
      )}
      {children}
    </div>
  );
};

SpotlightCard.displayName = "SpotlightCard";