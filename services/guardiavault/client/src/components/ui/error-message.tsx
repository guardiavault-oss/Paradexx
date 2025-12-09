import { AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  error: string | Error | null;
  onDismiss?: () => void;
  className?: string;
  variant?: "default" | "inline" | "banner";
}

export function ErrorMessage({
  error,
  onDismiss,
  className,
  variant = "default",
}: ErrorMessageProps) {
  if (!error) return null;

  const errorText = typeof error === "string" ? error : error.message;

  if (variant === "inline") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className={cn("flex items-start gap-2 text-sm text-red-400 mt-1", className)}
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="flex-1">{errorText}</span>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-red-400 hover:text-red-300 transition-colors"
              aria-label="Dismiss error"
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
            "flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl",
            className
          )}
        >
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="flex-1 text-sm text-red-400">{errorText}</span>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-red-400 hover:text-red-300 transition-colors"
              aria-label="Dismiss error"
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
          "flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl",
          className
        )}
      >
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-400">Error</p>
          <p className="text-sm text-red-300/80 mt-1">{errorText}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-300 transition-colors shrink-0"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

