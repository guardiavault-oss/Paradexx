import { useEffect, useRef } from 'react';

interface Bubble {
  x: number;
  y: number;
  vy: number;
  vx: number;
  size: number;
  opacity: number;
  wobble: number;
  wobbleSpeed: number;
}

export function WaterParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubblesRef = useRef<Bubble[]>([]);
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

    // Initialize water bubbles/particles
    const initBubbles = () => {
      bubblesRef.current = [];
      const count = Math.floor((canvas.width * canvas.height) / 25000); // ~25-50 bubbles
      
      for (let i = 0; i < count; i++) {
        bubblesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vy: -(Math.random() * 0.4 + 0.2), // Rising bubbles (negative = up)
          vx: (Math.random() - 0.5) * 0.2, // Slight horizontal drift
          size: Math.random() * 3 + 1.5, // 1.5-4.5px
          opacity: Math.random() * 0.4 + 0.2, // 0.2 to 0.6
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: Math.random() * 0.02 + 0.01,
        });
      }
    };
    initBubbles();

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      bubblesRef.current.forEach((bubble) => {
        // Update wobble
        bubble.wobble += bubble.wobbleSpeed;
        
        // Update position with wobble effect
        bubble.x += bubble.vx + Math.sin(bubble.wobble) * 0.3;
        bubble.y += bubble.vy;

        // Reset bubble when it goes off screen
        if (bubble.y < -10) {
          bubble.y = canvas.height + 10;
          bubble.x = Math.random() * canvas.width;
        }
        if (bubble.x < -10) bubble.x = canvas.width + 10;
        if (bubble.x > canvas.width + 10) bubble.x = -10;

        // Fade effect as bubbles rise
        const fadeOut = Math.max(0, 1 - (canvas.height - bubble.y) / canvas.height);
        const currentOpacity = bubble.opacity * (0.3 + fadeOut * 0.7);

        // Draw bubble with gradient (cool blue/cyan for regen)
        const gradient = ctx.createRadialGradient(
          bubble.x - bubble.size * 0.3,
          bubble.y - bubble.size * 0.3,
          0,
          bubble.x,
          bubble.y,
          bubble.size * 4
        );

        gradient.addColorStop(0, `rgba(200, 240, 255, ${currentOpacity * 0.8})`);
        gradient.addColorStop(0.3, `rgba(100, 200, 255, ${currentOpacity * 0.5})`);
        gradient.addColorStop(0.6, `rgba(0, 128, 255, ${currentOpacity * 0.3})`);
        gradient.addColorStop(1, 'rgba(0, 128, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.size * 4, 0, Math.PI * 2);
        ctx.fill();

        // Highlight/shine effect
        const highlightGradient = ctx.createRadialGradient(
          bubble.x - bubble.size * 0.4,
          bubble.y - bubble.size * 0.4,
          0,
          bubble.x - bubble.size * 0.4,
          bubble.y - bubble.size * 0.4,
          bubble.size * 1.5
        );

        highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${currentOpacity * 0.6})`);
        highlightGradient.addColorStop(0.5, `rgba(200, 240, 255, ${currentOpacity * 0.3})`);
        highlightGradient.addColorStop(1, 'rgba(200, 240, 255, 0)');

        ctx.fillStyle = highlightGradient;
        ctx.beginPath();
        ctx.arc(
          bubble.x - bubble.size * 0.4,
          bubble.y - bubble.size * 0.4,
          bubble.size * 1.5,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Subtle outer ring
        ctx.strokeStyle = `rgba(100, 200, 255, ${currentOpacity * 0.4})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.size * 2.5, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Add occasional shimmer effect
      if (Math.random() < 0.02) {
        const shimmerX = Math.random() * canvas.width;
        const shimmerY = Math.random() * canvas.height;
        
        const shimmerGradient = ctx.createRadialGradient(
          shimmerX,
          shimmerY,
          0,
          shimmerX,
          shimmerY,
          30
        );
        
        shimmerGradient.addColorStop(0, 'rgba(150, 220, 255, 0.3)');
        shimmerGradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.1)');
        shimmerGradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
        
        ctx.fillStyle = shimmerGradient;
        ctx.beginPath();
        ctx.arc(shimmerX, shimmerY, 30, 0, Math.PI * 2);
        ctx.fill();
      }

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
      style={{ opacity: 0.35 }}
    />
  );
}
