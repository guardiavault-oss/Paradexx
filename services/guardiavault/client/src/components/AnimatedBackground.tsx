import { useEffect, useRef } from "react";

interface AnimatedBackgroundProps {
  variant?: "gradient" | "particles" | "mesh" | "aurora";
  intensity?: number;
  className?: string;
}

function AnimatedBackground({ 
  variant = "gradient", 
  intensity = 0.3,
  className = "" 
}: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (variant === "particles" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      const particles: Array<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        size: number;
        color: string;
      }> = [];

      // Create particles
      for (let i = 0; i < 50; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 1,
          color: `hsla(${Math.random() * 60 + 200}, 70%, 60%, ${intensity})`,
        });
      }

      const animate = () => {
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach((particle) => {
          particle.x += particle.vx;
          particle.y += particle.vy;

          if (particle.x < 0 || particle.x > canvas.width) particle.vx = -particle.vx;
          if (particle.y < 0 || particle.y > canvas.height) particle.vy = -particle.vy;

          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = particle.color;
          ctx.fill();
        });

        requestAnimationFrame(animate);
      };

      animate();
    }
  }, [variant, intensity]);

  if (variant === "gradient") {
    return (
      <div className={`absolute inset-0 ${className}`} style={{ opacity: intensity }}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-pink-500/20 animate-pulse" />
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15), transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.15), transparent 50%),
              radial-gradient(circle at 40% 20%, rgba(236, 72, 153, 0.1), transparent 50%)
            `,
          }}
        />
      </div>
    );
  }

  if (variant === "mesh") {
    return (
      <div className={`absolute inset-0 ${className}`} style={{ opacity: intensity }}>
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary/10" />
            </pattern>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: "rgb(59, 130, 246)", stopOpacity: 0.1 }} />
              <stop offset="100%" style={{ stopColor: "rgb(139, 92, 246)", stopOpacity: 0.05 }} />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <rect width="100%" height="100%" fill="url(#grad)" />
        </svg>
      </div>
    );
  }

  if (variant === "aurora") {
    return (
      <div className={`absolute inset-0 ${className}`} style={{ opacity: intensity }}>
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-indigo-600/10 blur-3xl animate-aurora" />
        <div className="absolute inset-0 bg-gradient-to-l from-blue-600/10 to-cyan-600/10 blur-3xl animate-aurora-reverse" />
        <div className="absolute inset-0 bg-gradient-to-t from-purple-600/10 to-pink-600/10 blur-3xl animate-aurora-slow" />
      </div>
    );
  }

  if (variant === "particles") {
    return (
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 ${className}`}
        style={{ opacity: intensity }}
      />
    );
  }

  return null;
}

export default AnimatedBackground;
export { AnimatedBackground };
