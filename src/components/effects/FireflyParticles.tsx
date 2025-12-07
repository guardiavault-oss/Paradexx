import { useEffect, useRef } from 'react';

interface Firefly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  fadeDirection: number;
  size: number;
  glowIntensity: number;
  glowDirection: number;
}

export function FireflyParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const firefliesRef = useRef<Firefly[]>([]);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize fireflies (fewer for subtlety)
    const initFireflies = () => {
      firefliesRef.current = [];
      const count = Math.floor((canvas.width * canvas.height) / 30000); // ~20-40 fireflies depending on screen size
      
      for (let i = 0; i < count; i++) {
        firefliesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3, // Slow horizontal movement
          vy: (Math.random() - 0.5) * 0.3, // Slow vertical movement
          opacity: Math.random() * 0.5 + 0.3, // 0.3 to 0.8
          fadeDirection: Math.random() > 0.5 ? 1 : -1,
          size: Math.random() * 2 + 1, // 1-3px
          glowIntensity: Math.random() * 0.5 + 0.5,
          glowDirection: Math.random() > 0.5 ? 1 : -1,
        });
      }
    };
    initFireflies();

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      firefliesRef.current.forEach((firefly) => {
        // Update position with drift
        firefly.x += firefly.vx;
        firefly.y += firefly.vy;

        // Wrap around edges
        if (firefly.x < 0) firefly.x = canvas.width;
        if (firefly.x > canvas.width) firefly.x = 0;
        if (firefly.y < 0) firefly.y = canvas.height;
        if (firefly.y > canvas.height) firefly.y = 0;

        // Fade in/out (pulsing effect)
        firefly.opacity += firefly.fadeDirection * 0.01;
        if (firefly.opacity >= 0.8) firefly.fadeDirection = -1;
        if (firefly.opacity <= 0.2) firefly.fadeDirection = 1;

        // Glow intensity variation
        firefly.glowIntensity += firefly.glowDirection * 0.02;
        if (firefly.glowIntensity >= 1) firefly.glowDirection = -1;
        if (firefly.glowIntensity <= 0.3) firefly.glowDirection = 1;

        // Random direction changes (very subtle)
        if (Math.random() < 0.01) {
          firefly.vx += (Math.random() - 0.5) * 0.1;
          firefly.vy += (Math.random() - 0.5) * 0.1;
          
          // Limit velocity
          firefly.vx = Math.max(-0.5, Math.min(0.5, firefly.vx));
          firefly.vy = Math.max(-0.5, Math.min(0.5, firefly.vy));
        }

        // Draw firefly with glow
        const gradient = ctx.createRadialGradient(
          firefly.x,
          firefly.y,
          0,
          firefly.x,
          firefly.y,
          firefly.size * 8 * firefly.glowIntensity
        );

        // Warm orange/yellow glow for degen mode
        gradient.addColorStop(0, `rgba(255, 200, 100, ${firefly.opacity})`);
        gradient.addColorStop(0.2, `rgba(255, 150, 50, ${firefly.opacity * 0.6})`);
        gradient.addColorStop(0.5, `rgba(220, 20, 60, ${firefly.opacity * 0.3})`);
        gradient.addColorStop(1, 'rgba(220, 20, 60, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(firefly.x, firefly.y, firefly.size * 8 * firefly.glowIntensity, 0, Math.PI * 2);
        ctx.fill();

        // Core bright spot
        ctx.fillStyle = `rgba(255, 220, 150, ${firefly.opacity * 0.9})`;
        ctx.beginPath();
        ctx.arc(firefly.x, firefly.y, firefly.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.4 }}
    />
  );
}
