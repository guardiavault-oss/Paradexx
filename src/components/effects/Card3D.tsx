"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/cn";

export interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  intensity?: number;
  glareEnabled?: boolean;
  glareMaxOpacity?: number;
  scale?: number;
}

export const Card3D: React.FC<Card3DProps> = ({
  children,
  className,
  containerClassName,
  intensity = 15,
  glareEnabled = true,
  glareMaxOpacity = 0.3,
  scale = 1.05,
}) => {
  const cardRef = React.useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [intensity, -intensity]),
    {
      stiffness: 300,
      damping: 30,
    },
  );

  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-intensity, intensity]),
    {
      stiffness: 300,
      damping: 30,
    },
  );

  const glareX = useTransform(
    mouseX,
    [-0.5, 0.5],
    ["0%", "100%"],
  );
  const glareY = useTransform(
    mouseY,
    [-0.5, 0.5],
    ["0%", "100%"],
  );

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    mouseX.set((e.clientX - centerX) / (rect.width / 2));
    mouseY.set((e.clientY - centerY) / (rect.height / 2));
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div className={cn("perspective-1000", containerClassName)}>
      <motion.div
        ref={cardRef}
        className={cn(
          "relative transition-transform",
          className,
        )}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ scale }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
      >
        {children}

        {/* Glare effect */}
        {glareEnabled && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              background: `radial-gradient(circle at var(--glare-x) var(--glare-y), rgba(255, 255, 255, ${glareMaxOpacity}), transparent 50%)`,
              // @ts-ignore
              "--glare-x": glareX,
              "--glare-y": glareY,
            }}
          />
        )}
      </motion.div>
    </div>
  );
};

Card3D.displayName = "Card3D";

// Interactive 3D card with depth layers
export const Card3DLayered: React.FC<{
  children: React.ReactNode;
  className?: string;
  backgroundLayer?: React.ReactNode;
  middleLayer?: React.ReactNode;
  foregroundLayer?: React.ReactNode;
}> = ({
  children,
  className,
  backgroundLayer,
  middleLayer,
  foregroundLayer,
}) => {
  const cardRef = React.useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [10, -10]),
    {
      stiffness: 300,
      damping: 30,
    },
  );

  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-10, 10]),
    {
      stiffness: 300,
      damping: 30,
    },
  );

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    mouseX.set((e.clientX - centerX) / (rect.width / 2));
    mouseY.set((e.clientY - centerY) / (rect.height / 2));
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div className="perspective-1000">
      <motion.div
        ref={cardRef}
        className={cn("relative", className)}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Background layer */}
        {backgroundLayer && (
          <motion.div
            className="absolute inset-0"
            style={{
              transform: "translateZ(-20px)",
              transformStyle: "preserve-3d",
            }}
          >
            {backgroundLayer}
          </motion.div>
        )}

        {/* Middle layer */}
        {middleLayer && (
          <motion.div
            className="absolute inset-0"
            style={{
              transform: "translateZ(10px)",
              transformStyle: "preserve-3d",
            }}
          >
            {middleLayer}
          </motion.div>
        )}

        {/* Main content */}
        <div className="relative z-10">{children}</div>

        {/* Foreground layer */}
        {foregroundLayer && (
          <motion.div
            className="absolute inset-0"
            style={{
              transform: "translateZ(30px)",
              transformStyle: "preserve-3d",
            }}
          >
            {foregroundLayer}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

Card3DLayered.displayName = "Card3DLayered";