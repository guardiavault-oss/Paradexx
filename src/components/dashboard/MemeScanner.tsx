import { motion } from "motion/react";
import { Flame, TrendingUp, Users, Zap } from "lucide-react";

interface MemeScannerProps {
  onClick?: () => void;
}

export default function MemeScanner({
  onClick,
}: MemeScannerProps) {
  const memes = [
    {
      emoji: "🐸",
      name: "PEPE",
      change: "+247%",
      volume: "$12.4M",
      risk: "High",
    },
    {
      emoji: "🐕",
      name: "DOGE",
      change: "+89%",
      volume: "$8.2M",
      risk: "Medium",
    },
    {
      emoji: "🚀",
      name: "MOON",
      change: "+156%",
      volume: "$5.1M",
      risk: "High",
    },
    {
      emoji: "💎",
      name: "GEM",
      change: "+312%",
      volume: "$3.8M",
      risk: "High",
    },
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "#00ff88";
      case "Medium":
        return "#ffcc00";
      case "High":
        return "#ff3366";
      default:
        return "#ffffff";
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl border cursor-pointer"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(20px)",
        borderColor: "rgba(220, 20, 60, 0.2)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="rounded-lg sm:rounded-xl flex items-center justify-center"
            style={{
              width: "36px",
              height: "36px",
              backgroundColor: "rgba(255, 204, 0, 0.2)",
            }}
          >
            <Flame
              size={18}
              color="#ffcc00"
              className="sm:w-6 sm:h-6"
            />
          </div>
          <div>
            <h3 className="text-base sm:text-xl font-black text-white uppercase">
              Meme Scanner
            </h3>
            <p
              className="text-[10px] sm:text-xs"
              style={{ color: "rgba(255, 255, 255, 0.6)" }}
            >
              AI-powered alpha detection
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div
          className="p-3 sm:p-4 rounded-xl"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div
            className="text-[10px] sm:text-xs"
            style={{ color: "rgba(255, 255, 255, 0.6)" }}
          >
            Scanned Tokens
          </div>
          <div
            className="text-xl sm:text-2xl font-black"
            style={{ color: "#ffcc00" }}
          >
            1.2K
          </div>
        </div>
        <div
          className="p-3 sm:p-4 rounded-xl"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div
            className="text-[10px] sm:text-xs"
            style={{ color: "rgba(255, 255, 255, 0.6)" }}
          >
            Gems Found
          </div>
          <div
            className="text-xl sm:text-2xl font-black"
            style={{ color: "#00ff88" }}
          >
            47
          </div>
        </div>
      </div>

      {/* Trending Memes */}
      <div className="space-y-2 sm:space-y-3 mb-4">
        <div
          className="text-[10px] sm:text-xs uppercase tracking-wider mb-2"
          style={{
            color: "rgba(255, 255, 255, 0.6)",
          }}
        >
          Trending Now 🔥
        </div>
        {memes.map((meme, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="p-3 sm:p-4 rounded-xl cursor-pointer"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="text-xl sm:text-2xl">
                  {meme.emoji}
                </div>
                <div>
                  <div className="text-sm sm:text-base font-bold text-white">
                    {meme.name}
                  </div>
                  <div
                    className="text-[10px] sm:text-xs"
                    style={{
                      color: "rgba(255, 255, 255, 0.6)",
                    }}
                  >
                    Vol: {meme.volume}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className="text-sm sm:text-base font-black"
                  style={{ color: "#00ff88" }}
                >
                  {meme.change}
                </div>
                <div
                  className="px-2 py-1 rounded-full inline-block text-[8px] sm:text-[10px] font-bold uppercase"
                  style={{
                    backgroundColor: `${getRiskColor(meme.risk)}20`,
                    color: getRiskColor(meme.risk),
                  }}
                >
                  {meme.risk}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          className="py-2 sm:py-3 rounded-xl transition-all text-xs sm:text-sm font-bold"
          style={{
            backgroundColor: "rgba(255, 204, 0, 0.2)",
            border: "1px solid #ffcc00",
            color: "#ffcc00",
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <Users size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">
              Scan for Alpha
            </span>
            <span className="sm:hidden">Scan</span>
          </div>
        </button>
        <button
          className="py-2 sm:py-3 rounded-xl transition-all text-xs sm:text-sm font-bold"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "rgba(255, 255, 255, 0.8)",
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <span className="hidden sm:inline">MemeScope</span>
            <span className="sm:hidden">Scope</span>
            <Zap size={12} className="sm:w-3.5 sm:h-3.5" />
          </div>
        </button>
      </div>
    </motion.div>
  );
}