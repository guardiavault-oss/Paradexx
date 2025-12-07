import { motion } from "motion/react";
import { Lock, Shield, Zap, CheckCircle } from "lucide-react";

interface MEVShieldProps {
  onClick?: () => void;
}

export default function MEVShield({ onClick }: MEVShieldProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl border cursor-pointer"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(20px)",
        borderColor: "rgba(0, 128, 255, 0.2)",
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
              background:
                "linear-gradient(135deg, #00d4ff, #0088ff)",
              boxShadow: "0 0 20px rgba(0, 212, 255, 0.4)",
            }}
          >
            <Shield
              size={18}
              color="#ffffff"
              className="sm:w-6 sm:h-6"
            />
          </div>
          <div>
            <h3 className="text-base sm:text-xl font-black text-white uppercase">
              MEV Shield
            </h3>
            <p
              className="text-[10px] sm:text-xs"
              style={{ color: "rgba(255, 255, 255, 0.6)" }}
            >
              Flashbots protection
            </p>
          </div>
        </div>
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="px-2 sm:px-3 py-1 rounded-full"
          style={{
            backgroundColor: "rgba(0, 255, 136, 0.2)",
            border: "1px solid #00ff88",
          }}
        >
          <span
            className="text-[9px] sm:text-[11px] font-bold"
            style={{ color: "#00ff88" }}
          >
            ACTIVE
          </span>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div
          className="p-4 sm:p-6 rounded-xl"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Shield
              size={14}
              color="#00ff88"
              className="sm:w-4 sm:h-4"
            />
            <span
              className="text-[10px] sm:text-xs"
              style={{ color: "rgba(255, 255, 255, 0.6)" }}
            >
              Attacks Blocked
            </span>
          </div>
          <div
            className="text-2xl sm:text-3xl font-black"
            style={{ color: "#00ff88" }}
          >
            47
          </div>
        </div>

        <div
          className="p-4 sm:p-6 rounded-xl"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap
              size={14}
              color="#00d4ff"
              className="sm:w-4 sm:h-4"
            />
            <span
              className="text-[10px] sm:text-xs"
              style={{ color: "rgba(255, 255, 255, 0.6)" }}
            >
              Value Saved
            </span>
          </div>
          <div
            className="text-2xl sm:text-3xl font-black"
            style={{ color: "#00d4ff" }}
          >
            $124
          </div>
        </div>
      </div>

      {/* Protection Status */}
      <div
        className="p-4 sm:p-6 rounded-xl mb-4 sm:mb-6"
        style={{
          background:
            "linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 255, 136, 0.1))",
          border: "1px solid rgba(0, 212, 255, 0.3)",
        }}
      >
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="text-xs sm:text-sm font-bold text-white">
            Protection Rate
          </div>
          <div
            className="text-lg sm:text-xl font-black"
            style={{ color: "#00ff88" }}
          >
            100%
          </div>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{
              background:
                "linear-gradient(90deg, #00d4ff, #00ff88)",
            }}
          />
        </div>
      </div>

      {/* Features */}
      <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
        <div
          className="text-[10px] sm:text-xs uppercase tracking-wider mb-2"
          style={{
            color: "rgba(255, 255, 255, 0.6)",
          }}
        >
          Active Protections
        </div>
        {[
          {
            name: "Front-running Protection",
            status: "Active",
          },
          {
            name: "Sandwich Attack Prevention",
            status: "Active",
          },
          { name: "Private Transactions", status: "Active" },
          { name: "Flashbots RPC", status: "Connected" },
        ].map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-3 sm:p-4 rounded-xl flex items-center justify-between"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              border: "1px solid rgba(0, 212, 255, 0.2)",
            }}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <CheckCircle
                size={14}
                color="#00ff88"
                className="sm:w-4 sm:h-4"
              />
              <span className="text-xs sm:text-sm text-white">
                {feature.name}
              </span>
            </div>
            <span
              className="text-[10px] sm:text-xs font-bold"
              style={{
                color: "#00ff88",
              }}
            >
              {feature.status}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Info */}
      <div
        className="p-3 sm:p-4 rounded-xl"
        style={{
          backgroundColor: "rgba(0, 212, 255, 0.05)",
          border: "1px solid rgba(0, 212, 255, 0.2)",
        }}
      >
        <div className="flex items-start gap-2 sm:gap-3">
          <Zap
            size={14}
            color="#00d4ff"
            className="mt-0.5 sm:w-4 sm:h-4"
          />
          <div
            className="text-[10px] sm:text-xs"
            style={{ color: "rgba(255, 255, 255, 0.8)" }}
          >
            All transactions automatically routed through
            Flashbots for maximum protection against MEV
            attacks.
          </div>
        </div>
      </div>
    </motion.div>
  );
}