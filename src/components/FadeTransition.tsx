import { useEffect, useState } from "react";

interface FadeTransitionProps {
  isActive: boolean;
  onComplete?: () => void;
  duration?: number;
}

export default function FadeTransition({ 
  isActive, 
  onComplete,
  duration = 1000 
}: FadeTransitionProps) {
  const [phase, setPhase] = useState<"hidden" | "fadeIn" | "fadeOut">("hidden");

  useEffect(() => {
    if (!isActive) {
      setPhase("hidden");
      return;
    }

    // Start with fade in to black
    setPhase("fadeIn");

    // After halfway point, start fading out
    const fadeOutTimer = setTimeout(() => {
      setPhase("fadeOut");
    }, duration / 2);

    // After full duration, call onComplete
    const completeTimer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
      setPhase("hidden");
    }, duration);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [isActive, onComplete, duration]);

  if (!isActive && phase === "hidden") return null;

  return (
    <div
      className="fixed inset-0 bg-black pointer-events-none transition-opacity"
      style={{
        zIndex: 100,
        opacity: phase === "fadeIn" ? 1 : phase === "fadeOut" ? 0 : 0,
        transitionDuration: `${duration / 2}ms`,
      }}
    />
  );
}
