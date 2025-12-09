import { CheckCircle2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SuccessMessageProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
  variant?: "default" | "inline" | "banner";
}

export function SuccessMessage({
  message,
  onDismiss,
  className,
  variant = "default",
}: SuccessMessageProps) {
  if (variant === "inline") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className={cn("flex items-start gap-2 text-sm text-emerald-400 mt-1", className)}
        >
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="flex-1">{message}</span>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
              aria-label="Dismiss success message"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  if (variant === "banner") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={cn(
            "flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl",
            className
          )}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="flex-1 text-sm text-emerald-400">{message}</span>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
              aria-label="Dismiss success message"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  // Default variant
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          "flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl",
          className
        )}
      >
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-emerald-400">Success</p>
          <p className="text-sm text-emerald-300/80 mt-1">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-emerald-400 hover:text-emerald-300 transition-colors shrink-0"
            aria-label="Dismiss success message"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

