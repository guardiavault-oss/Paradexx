import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PremiumCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
  noPadding?: boolean;
}

export function PremiumCard({
  children,
  className,
  hover = true,
  delay = 0,
  noPadding = false,
}: PremiumCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        "glass-card",
        hover && "hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300",
        !noPadding && "p-8",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
