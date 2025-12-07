import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap-optimized";

interface AnimatedCounterProps {
  value: string | number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export default function AnimatedCounter({
  value,
  duration = 2,
  prefix = "",
  suffix = "",
  className = "",
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (hasAnimatedRef.current || !ref.current) return;

    const numericValue = typeof value === "string" ? parseFloat(value.replace(/[^0-9.]/g, "")) : value;

    if (isNaN(numericValue)) {
      setDisplayValue(value as number);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimatedRef.current) {
            hasAnimatedRef.current = true;

            gsap.to(
              {},
              {
                duration,
                ease: "power2.out",
                onUpdate: function () {
                  const progress = this.progress();
                  setDisplayValue(Math.floor(numericValue * progress));
                },
                onComplete: () => {
                  setDisplayValue(numericValue);
                },
              }
            );
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [value, duration]);

  const formatValue = (val: number): string => {
    if (typeof value === "string" && value.includes("B")) {
      return `${(val / 1000000000).toFixed(1)}B`;
    }
    if (typeof value === "string" && value.includes("%")) {
      return `${Math.round(val)}%`;
    }
    return val.toString();
  };

  return (
    <div ref={ref} className={className}>
      {prefix}
      {typeof value === "string" && !isNaN(parseFloat(value.replace(/[^0-9.]/g, "")))
        ? formatValue(displayValue)
        : value}
      {suffix}
    </div>
  );
}

