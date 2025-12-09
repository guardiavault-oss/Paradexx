import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap-optimized";

interface RollingNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
  format?: (val: number) => string;
}

export default function RollingNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 2.5,
  className = "",
  format,
}: RollingNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!ref.current || hasAnimated.current) return;

    const obj = { value: 0 };
    const trigger = ScrollTrigger.create({
      trigger: ref.current,
      start: "top 80%",
      once: true,
      onEnter: () => {
        hasAnimated.current = true;
        gsap.to(obj, {
          value,
          duration,
          ease: "power2.out",
          onUpdate: () => {
            const val = decimals > 0 
              ? obj.value.toFixed(decimals) 
              : String(Math.floor(obj.value));
            setDisplayValue(parseFloat(val));
          },
          onComplete: () => {
            setDisplayValue(value);
          },
        });
      },
    });

    return () => {
      trigger.kill();
    };
  }, [value, duration, decimals]);

  const formattedValue = format 
    ? format(displayValue)
    : decimals > 0
    ? displayValue.toFixed(decimals)
    : Math.floor(displayValue).toLocaleString();

  return (
    <span ref={ref} className={`rolling-number ${className}`}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
}

