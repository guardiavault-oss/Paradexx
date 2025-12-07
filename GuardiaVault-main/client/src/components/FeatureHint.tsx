import { useEffect, useRef, useState } from "react";
import { X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface FeatureHintProps {
  hint: {
    id: string;
    title: string;
    description: string;
    targetSelector: string;
    position?: "top" | "bottom" | "left" | "right";
  };
  onDismiss: () => void;
}

export function FeatureHint({ hint, onDismiss }: FeatureHintProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = document.querySelector(hint.targetSelector);
    if (!target) {
      return;
    }

    const updatePosition = () => {
      const rect = target.getBoundingClientRect();
      const hintRect = hintRef.current?.getBoundingClientRect();
      const hintHeight = hintRect?.height || 200;
      const hintWidth = hintRect?.width || 300;

      let top = 0;
      let left = 0;

      switch (hint.position || "top") {
        case "top":
          top = rect.top - hintHeight - 16;
          left = rect.left + rect.width / 2 - hintWidth / 2;
          break;
        case "bottom":
          top = rect.bottom + 16;
          left = rect.left + rect.width / 2 - hintWidth / 2;
          break;
        case "left":
          top = rect.top + rect.height / 2 - hintHeight / 2;
          left = rect.left - hintWidth - 16;
          break;
        case "right":
          top = rect.top + rect.height / 2 - hintHeight / 2;
          left = rect.right + 16;
          break;
      }

      // Ensure hint stays in viewport
      top = Math.max(16, Math.min(top, window.innerHeight - hintHeight - 16));
      left = Math.max(16, Math.min(left, window.innerWidth - hintWidth - 16));

      setPosition({ top, left });
      setVisible(true);
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [hint.targetSelector, hint.position]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={hintRef}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        style={{
          position: "fixed",
          top: `${position.top}px`,
          left: `${position.left}px`,
          zIndex: 10000,
        }}
        className="w-80"
      >
        <div className="glass-card p-6 shadow-2xl border border-blue-500/20 relative">
          {/* Sparkle decoration */}
          <div className="absolute -top-2 -right-2">
            <Sparkles className="w-6 h-6 text-blue-400" />
          </div>

          <div className="flex items-start justify-between mb-3">
            <h4 className="text-lg font-semibold text-white">{hint.title}</h4>
            <button
              onClick={onDismiss}
              className="text-slate-400 hover:text-white transition-colors"
              aria-label="Dismiss hint"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-slate-300 mb-4">{hint.description}</p>

          <Button
            onClick={onDismiss}
            size="sm"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            Got it!
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

