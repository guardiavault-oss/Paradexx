import { useEffect, useState, useRef } from "react";
import { gsap } from "@/lib/gsap-optimized";

interface LifelineVisualProps {
  daysRemaining: number;
  totalDays: number;
  checkInsCompleted: number;
  status: "active" | "warning" | "critical";
}

export default function LifelineVisual({
  daysRemaining,
  totalDays,
  checkInsCompleted,
  status,
}: LifelineVisualProps) {
  const [rotation, setRotation] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLDivElement>(null);
  const percentage = (daysRemaining / totalDays) * 100;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 0.5) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    gsap.fromTo(
      containerRef.current,
      { scale: 0.8, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 1.2,
        ease: "back.out(1.4)",
      }
    );

    if (numberRef.current) {
      gsap.fromTo(
        numberRef.current,
        { textContent: 0 },
        {
          textContent: daysRemaining,
          duration: 2,
          ease: "power2.out",
          snap: { textContent: 1 },
          onUpdate: function () {
            if (numberRef.current) {
              numberRef.current.textContent = Math.ceil(
                parseFloat(numberRef.current.textContent || "0")
              ).toString();
            }
          },
        }
      );
    }
  }, [daysRemaining]);

  const glowClass =
    status === "critical"
      ? "glow-destructive"
      : status === "warning"
      ? "glow-accent"
      : "glow-primary";

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center"
      data-testid="lifeline-visual"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 rounded-full blur-3xl" />

      <svg className="transform -rotate-90" width="280" height="280">
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop
              offset="0%"
              stopColor={
                status === "critical"
                  ? "hsl(var(--destructive))"
                  : status === "warning"
                  ? "hsl(var(--chart-2))"
                  : "hsl(var(--primary))"
              }
            />
            <stop
              offset="100%"
              stopColor={
                status === "critical"
                  ? "hsl(var(--destructive))"
                  : status === "warning"
                  ? "hsl(var(--chart-5))"
                  : "hsl(var(--chart-2))"
              }
            />
          </linearGradient>
        </defs>

        <circle
          cx="140"
          cy="140"
          r="120"
          stroke="hsl(var(--border))"
          strokeWidth="8"
          fill="none"
          opacity="0.2"
        />

        <circle
          cx="140"
          cy="140"
          r="120"
          stroke="url(#progressGradient)"
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-500 ${glowClass}`}
          style={{ filter: `drop-shadow(${glowClass})` }}
        />

        {Array.from({ length: checkInsCompleted }).map((_, i) => {
          const angle = (i / 12) * 360;
          const x = 140 + 130 * Math.cos((angle * Math.PI) / 180);
          const y = 140 + 130 * Math.sin((angle * Math.PI) / 180);
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="6"
                fill="hsl(var(--primary))"
                className="glow-primary"
              />
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="hsl(var(--primary-foreground))"
              />
            </g>
          );
        })}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          ref={numberRef}
          className="text-7xl font-bold font-display gradient-text-primary"
        >
          {daysRemaining}
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          days remaining
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {checkInsCompleted} check-ins completed
        </div>
      </div>

      {status === "critical" && (
        <div
          className="absolute inset-0 rounded-full border-4 border-destructive animate-pulse opacity-50"
          style={{ transform: `rotate(${rotation}deg)` }}
        />
      )}
    </div>
  );
}
