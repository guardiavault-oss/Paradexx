import { useState, useEffect } from "react";
import { logError } from "@/utils/logger";

interface FeatureHint {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

/**
 * Hook for feature discovery and onboarding hints
 * Tracks which hints have been shown to prevent showing them again
 */
export function useFeatureDiscovery() {
  const [shownHints, setShownHints] = useState<Set<string>>(new Set());
  const [activeHint, setActiveHint] = useState<FeatureHint | null>(null);

  useEffect(() => {
    // Load shown hints from localStorage
    const stored = localStorage.getItem("feature_hints_shown");
    if (stored) {
      try {
        const hints = JSON.parse(stored);
        setShownHints(new Set(hints));
      } catch (e) {
        logError(e instanceof Error ? e : new Error(String(e)), {
          context: "useFeatureDiscovery",
        });
      }
    }
  }, []);

  const showHint = (hint: FeatureHint) => {
    // Check if hint was already shown
    if (shownHints.has(hint.id)) {
      return false;
    }

    // Check if target element exists
    const target = document.querySelector(hint.targetSelector);
    if (!target) {
      return false;
    }

    setActiveHint(hint);
    return true;
  };

  const dismissHint = (hintId: string) => {
    const newShown = new Set(shownHints);
    newShown.add(hintId);
    setShownHints(newShown);
    setActiveHint(null);

    // Persist to localStorage
    localStorage.setItem("feature_hints_shown", JSON.stringify(Array.from(newShown)));
  };

  const markHintAsShown = (hintId: string) => {
    dismissHint(hintId);
  };

  const resetHints = () => {
    setShownHints(new Set());
    localStorage.removeItem("feature_hints_shown");
  };

  return {
    activeHint,
    showHint,
    dismissHint,
    markHintAsShown,
    resetHints,
    hasSeenHint: (hintId: string) => shownHints.has(hintId),
  };
}

