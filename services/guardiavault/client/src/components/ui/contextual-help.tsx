import { ReactNode, useState } from "react";
import { HelpCircle, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ContextualHelpProps {
  content: string | ReactNode;
  title?: string;
  variant?: "tooltip" | "popover" | "inline";
  className?: string;
}

export function ContextualHelp({
  content,
  title,
  variant = "tooltip",
  className = "",
}: ContextualHelpProps) {
  const [showPopover, setShowPopover] = useState(false);

  if (variant === "tooltip") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={`inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-slate-300 transition-colors ${className}`}
              aria-label="Help"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            {typeof content === "string" ? (
              <p className="text-sm">{content}</p>
            ) : (
              content
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === "popover") {
    return (
      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => setShowPopover(!showPopover)}
          className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-slate-300 transition-colors ${className}`}
          aria-label="Show help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
        <AnimatePresence>
          {showPopover && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 w-64"
            >
              <div className="glass-card p-4 shadow-xl border border-white/10">
                {title && (
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-white">{title}</h4>
                    <button
                      onClick={() => setShowPopover(false)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="text-sm text-slate-300">
                  {typeof content === "string" ? <p>{content}</p> : content}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Inline variant
  return (
    <div className={`inline-flex items-start gap-2 ${className}`}>
      <button
        type="button"
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-slate-300 transition-colors mt-0.5"
        aria-label="Help"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      <div className="text-sm text-slate-400">
        {typeof content === "string" ? <p>{content}</p> : content}
      </div>
    </div>
  );
}

