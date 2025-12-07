"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { Mode } from "@/styles/tokens";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

export interface ParticlesBackgroundProps {
  className?: string;
  mode?: Mode;
  particleColor?: string;
  quantity?: number;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  connectLines?: boolean;
  lineColor?: string;
}

export const ParticlesBackground: React.FC<
  ParticlesBackgroundProps
> = ({
  className,
  mode = "degen",
  particleColor,
  quantity = 50,
  minSize = 1,
  maxSize = 3,
  speed = 20,
  connectLines = false,
  lineColor,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const particles = React.useRef<
    Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
    }>
  >([]);

  const color =
    particleColor || (mode === "degen" ? "#ff3366" : "#00d4ff");
  const lineStroke =
    lineColor ||
    (mode === "degen"
      ? "rgba(255, 51, 102, 0.1)"
      : "rgba(0, 212, 255, 0.1)");

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    // Initialize particles
    particles.current = Array.from(
      { length: quantity },
      () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * (speed / 10),
        vy: (Math.random() - 0.5) * (speed / 10),
        size: minSize + Math.random() * (maxSize - minSize),
      }),
    );

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.current.forEach((particle, i) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width)
          particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height)
          particle.vy *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(
          particle.x,
          particle.y,
          particle.size,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = color;
        ctx.fill();

        // Draw connection lines
        if (connectLines) {
          particles.current
            .slice(i + 1)
            .forEach((otherParticle) => {
              const dx = particle.x - otherParticle.x;
              const dy = particle.y - otherParticle.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance < 150) {
                ctx.beginPath();
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(otherParticle.x, otherParticle.y);
                ctx.strokeStyle = lineStroke;
                ctx.lineWidth = 1;
                ctx.stroke();
              }
            });
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", setCanvasSize);
    };
  }, [
    quantity,
    minSize,
    maxSize,
    speed,
    color,
    connectLines,
    lineStroke,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "pointer-events-none absolute inset-0",
        className,
      )}
    />
  );
};

ParticlesBackground.displayName = "ParticlesBackground";

// Floating particles variant (simpler, no canvas)
export const FloatingParticles: React.FC<{
  className?: string;
  mode?: Mode;
  quantity?: number;
}> = ({ className, mode = "degen", quantity = 30 }) => {
  const particles = React.useMemo(() => {
    return Array.from({ length: quantity }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 10 + Math.random() * 20,
      delay: Math.random() * 5,
    }));
  }, [quantity]);

  const color = mode === "degen" ? "#ff3366" : "#00d4ff";

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: color,
            boxShadow: `0 0 ${particle.size * 2}px ${color}`,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

FloatingParticles.displayName = "FloatingParticles";

// Orbiting particles
export const OrbitingParticles: React.FC<{
  className?: string;
  mode?: Mode;
  radius?: number;
  quantity?: number;
  duration?: number;
}> = ({
  className,
  mode = "degen",
  radius = 100,
  quantity = 8,
  duration = 10,
}) => {
  const particles = React.useMemo(() => {
    return Array.from({ length: quantity }, (_, i) => ({
      id: i,
      angle: (360 / quantity) * i,
      delay: (duration / quantity) * i,
    }));
  }, [quantity, duration]);

  const color = mode === "degen" ? "#ff3366" : "#00d4ff";

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 flex items-center justify-center",
        className,
      )}
    >
      <div
        className="relative"
        style={{ width: radius * 2, height: radius * 2 }}
      >
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              width: 8,
              height: 8,
              backgroundColor: color,
              boxShadow: `0 0 16px ${color}`,
              left: "50%",
              top: "50%",
              marginLeft: -4,
              marginTop: -4,
            }}
            animate={{
              rotate: 360,
            }}
            transition={{
              duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              transformOrigin: `0 0`,
              transform: `rotate(${particle.angle}deg) translate(${radius}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

OrbitingParticles.displayName = "OrbitingParticles";