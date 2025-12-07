import {
  Home,
  ArrowLeftRight,
  Activity,
  MoreHorizontal,
} from "lucide-react";
import { motion } from "motion/react";

interface BottomNavProps {
  activeTab: "home" | "trading" | "activity" | "more";
  onTabChange: (
    tab: "home" | "trading" | "activity" | "more",
  ) => void;
  tribe: "degen" | "regen";
}

export default function BottomNav({
  activeTab,
  onTabChange,
  tribe,
}: BottomNavProps) {
  const primaryColor =
    tribe === "degen" ? "#DC143C" : "#0080FF";
  const secondaryColor =
    tribe === "degen" ? "#8B0000" : "#000080";

  const tabs = [
    { id: "home" as const, icon: Home, label: "Home" },
    {
      id: "trading" as const,
      icon: ArrowLeftRight,
      label: "Trading",
    },
    {
      id: "activity" as const,
      icon: Activity,
      label: "Activity",
    },
    {
      id: "more" as const,
      icon: MoreHorizontal,
      label: "More",
    },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
      style={{
        background: "rgba(0, 0, 0, 0.98)",
        backdropFilter: "blur(20px)",
        borderTop: `1px solid rgba(255, 255, 255, 0.1)`,
        boxShadow: `0 -4px 30px rgba(0, 0, 0, 0.5), 0 -1px 0 ${primaryColor}20`,
      }}
    >
      <div className="max-w-[600px] mx-auto px-2 py-2">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as any)}
                className="relative flex flex-col items-center justify-center gap-1 min-w-[64px] py-2 transition-all"
              >
                {/* Active Indicator Line */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute -top-2 left-1/2 -translate-x-1/2 h-0.5 rounded-full"
                    style={{
                      width: "32px",
                      background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
                      boxShadow: `0 0 8px ${primaryColor}`,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}

                {/* Icon Container */}
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 20,
                  }}
                  className="relative flex items-center justify-center w-11 h-11 rounded-2xl"
                  style={{
                    backgroundColor: isActive
                      ? `${primaryColor}15`
                      : "transparent",
                    border: isActive
                      ? `1px solid ${primaryColor}30`
                      : "none",
                  }}
                >
                  <Icon
                    size={22}
                    color={
                      isActive
                        ? primaryColor
                        : "rgba(255, 255, 255, 0.4)"
                    }
                    strokeWidth={isActive ? 2.5 : 2}
                  />

                  {/* Glow effect for active */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        background: `radial-gradient(circle, ${primaryColor}20 0%, transparent 70%)`,
                      }}
                      animate={{
                        opacity: [0.5, 0.8, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                </motion.div>

                {/* Label */}
                <motion.span
                  animate={{
                    scale: isActive ? 1 : 0.95,
                  }}
                  className="text-[10px] font-bold uppercase tracking-wide transition-colors"
                  style={{
                    color: isActive
                      ? primaryColor
                      : "rgba(255, 255, 255, 0.4)",
                  }}
                >
                  {tab.label}
                </motion.span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}