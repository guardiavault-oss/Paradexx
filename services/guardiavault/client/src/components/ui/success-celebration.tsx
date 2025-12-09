import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Sparkles, Trophy, Star } from "lucide-react";

interface SuccessCelebrationProps {
  show: boolean;
  title: string;
  message?: string;
  variant?: "success" | "achievement" | "milestone";
  onClose?: () => void;
  duration?: number;
}

export function SuccessCelebration({
  show,
  title,
  message,
  variant = "success",
  onClose,
  duration = 3000,
}: SuccessCelebrationProps) {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  const icons = {
    success: CheckCircle2,
    achievement: Trophy,
    milestone: Star,
  };

  const Icon = icons[variant];

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Confetti/Sparkles Effect */}
          <div className="fixed inset-0 pointer-events-none z-[9999]">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 0,
                  scale: 0,
                  x: "50vw",
                  y: "50vh",
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: `${50 + (Math.random() - 0.5) * 100}vw`,
                  y: `${50 + (Math.random() - 0.5) * 100}vh`,
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.1,
                  ease: "easeOut",
                }}
                className="absolute"
              >
                <Sparkles className="w-4 h-4 text-yellow-400" />
              </motion.div>
            ))}
          </div>

          {/* Success Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[10000] pointer-events-none"
          >
            <div className="glass-card p-8 text-center min-w-[320px] max-w-md">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.1,
                }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30"
              >
                <Icon className="w-10 h-10 text-white" />
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-white mb-2 display-font"
              >
                {title}
              </motion.h3>
              {message && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-slate-400"
                >
                  {message}
                </motion.p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

