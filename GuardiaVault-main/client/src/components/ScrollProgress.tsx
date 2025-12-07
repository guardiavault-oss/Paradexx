import { useEffect, useState } from "react";
import { useThrottle } from "@/hooks/useThrottle";

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  const updateProgress = useThrottle(() => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
    setProgress(scrollPercent);
  }, 16); // ~60fps throttling

  useEffect(() => {
    window.addEventListener("scroll", updateProgress, { passive: true });
    // Initial calculation
    updateProgress();
    return () => window.removeEventListener("scroll", updateProgress);
  }, [updateProgress]);

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
      <div
        className="h-full bg-primary transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

