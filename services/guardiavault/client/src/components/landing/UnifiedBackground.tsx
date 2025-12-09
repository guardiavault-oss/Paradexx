import { useRef, useEffect } from "react";
import { getPerformanceConfig } from "../../utils/performance";

// Particle System Component (from SolutionSection)
const ParticleField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animationRef = useRef<number | null>(null);
  const perfConfig = getPerformanceConfig();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || perfConfig.isMobile) return; // Disable on mobile for performance

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    interface Particle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      hue: number;
      reset: () => void;
      update: () => void;
      draw: () => void;
    }

    const particles: Particle[] = [];
    const particleCount = perfConfig.reduceAnimations ? 50 : 100;

    class ParticleClass implements Particle {
      x: number = 0;
      y: number = 0;
      size: number = 0;
      speedY: number = 0;
      speedX: number = 0;
      opacity: number = 0;
      hue: number = 0;

      constructor() {
        this.reset();
        if (canvas) {
          this.y = Math.random() * canvas.height;
        }
      }

      reset() {
        if (canvas) {
          this.x = Math.random() * canvas.width;
        }
        this.y = -10;
        this.size = Math.random() * 2 + 0.5;
        this.speedY = Math.random() * 0.5 + 0.2;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.5 + 0.3;
        this.hue = Math.random() * 60 + 200; // Blue to purple range
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;

        // Mouse interaction (only on desktop)
        if (!perfConfig.isMobile) {
          const dx = this.x - mouseRef.current.x;
          const dy = this.y - mouseRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            const force = (100 - distance) / 100;
            this.x += (dx / distance) * force * 2;
            this.y += (dy / distance) * force * 2;
          }
        }

        if (canvas && (this.y > canvas.height + 10 || this.x < -10 || this.x > canvas.width + 10)) {
          this.reset();
        }
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = `hsl(${this.hue}, 70%, 60%)`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsl(${this.hue}, 70%, 60%)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Initialize particles - already optimized via particleCount variable
    for (let i = 0; i < particleCount; i++) {
      particles.push(new ParticleClass());
    }

    // Mouse move handler (only on desktop)
    const handleMouseMove = (e: MouseEvent) => {
      if (!perfConfig.isMobile) {
        mouseRef.current = { x: e.clientX, y: e.clientY };
      }
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [perfConfig.isMobile, perfConfig.reduceAnimations]);

  if (perfConfig.isMobile) {
    return null; // Don't render particles on mobile
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        mixBlendMode: "screen",
        willChange: "transform", // Hint for compositor
      }}
    />
  );
};

// Unified Background Component
export default function UnifiedBackground() {
  return (
    <>
      {/* Particle System */}
      <ParticleField />

      {/* Advanced Background Effects */}
      <div className="absolute inset-0">
        {/* Grid with animation */}
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[size:50px_50px] animate-grid-flow" />


        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`
        }} />
      </div>

      {/* CSS Animations - Optimized with will-change */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }

        @keyframes float-delayed {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-30px, 30px) rotate(120deg); }
          66% { transform: translate(20px, -20px) rotate(240deg); }
        }

        @keyframes grid-flow {
          0% { transform: translateX(0); }
          100% { transform: translateX(30px); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.2; }
        }

        .animate-float {
          animation: float 20s ease-in-out infinite;
          will-change: transform;
        }

        .animate-float-delayed {
          animation: float-delayed 20s ease-in-out infinite;
          will-change: transform;
        }

        .animate-grid-flow {
          animation: grid-flow 20s linear infinite;
          will-change: transform;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
          will-change: opacity;
        }
      `}</style>
    </>
  );
}

