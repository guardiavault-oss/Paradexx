import { motion } from "motion/react";
import {
  Shield,
  Check,
  AlertTriangle,
  Lock,
  CheckCircle,
} from "lucide-react";

interface WalletGuardProps {
  onClick?: () => void;
}

export default function WalletGuard({
  onClick,
}: WalletGuardProps) {
  const approvals = [
    { protocol: "Uniswap", status: "Active", daysActive: 45 },
    { protocol: "Aave", status: "Active", daysActive: 120 },
    { protocol: "Curve", status: "Stale", daysActive: 180 },
  ];

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
              backgroundColor: "rgba(0, 212, 255, 0.2)",
            }}
          >
            <Shield
              size={18}
              color="#00d4ff"
              className="sm:w-6 sm:h-6"
            />
          </div>
          <div>
            <h3 className="text-base sm:text-xl font-black text-white uppercase">
              Wallet Guard
            </h3>
            <p
              className="text-[10px] sm:text-xs"
              style={{ color: "rgba(255, 255, 255, 0.6)" }}
            >
              Guardian-based security
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div
          className="p-2 sm:p-4 rounded-xl"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div
            className="text-[10px] sm:text-xs mb-1"
            style={{ color: "rgba(255, 255, 255, 0.6)" }}
          >
            Threats Blocked
          </div>
          <div
            className="text-xl sm:text-2xl font-black"
            style={{ color: "#00ff88" }}
          >
            0
          </div>
        </div>
        <div
          className="p-2 sm:p-4 rounded-xl"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div
            className="text-[10px] sm:text-xs mb-1"
            style={{ color: "rgba(255, 255, 255, 0.6)" }}
          >
            Active Approvals
          </div>
          <div
            className="text-xl sm:text-2xl font-black"
            style={{ color: "#00d4ff" }}
          >
            12
          </div>
        </div>
        <div
          className="p-2 sm:p-4 rounded-xl"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div
            className="text-[10px] sm:text-xs mb-1"
            style={{ color: "rgba(255, 255, 255, 0.6)" }}
          >
            Security Score
          </div>
          <div
            className="text-xl sm:text-2xl font-black"
            style={{ color: "#00d4ff" }}
          >
            94
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="mb-4 sm:mb-6">
        <div
          className="p-4 rounded-xl flex items-start gap-3"
          style={{
            backgroundColor: "rgba(255, 204, 0, 0.1)",
            border: "1px solid rgba(255, 204, 0, 0.3)",
          }}
        >
          <AlertTriangle
            size={20}
            color="#ffcc00"
            className="mt-0.5"
          />
          <div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#ffcc00",
              }}
            >
              Stale Approvals Detected
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "rgba(255, 255, 255, 0.7)",
                marginTop: "4px",
              }}
            >
              1 approval hasn't been used in 90+ days. Consider
              revoking for security.
            </div>
          </div>
        </div>
      </div>

      {/* Approvals List */}
      <div className="space-y-3 mb-4">
        <div
          style={{
            fontSize: "12px",
            color: "rgba(255, 255, 255, 0.6)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "8px",
          }}
        >
          Active Approvals
        </div>
        {approvals.map((approval, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-xl flex items-center justify-between"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              border: `1px solid ${
                approval.status === "Stale"
                  ? "#ffcc0040"
                  : "rgba(255, 255, 255, 0.1)"
              }`,
            }}
          >
            <div className="flex items-center gap-3">
              {approval.status === "Stale" ? (
                <AlertTriangle size={20} color="#ffcc00" />
              ) : (
                <CheckCircle size={20} color="#00ff88" />
              )}
              <div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#ffffff",
                  }}
                >
                  {approval.protocol}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "rgba(255, 255, 255, 0.6)",
                  }}
                >
                  {approval.daysActive} days active
                </div>
              </div>
            </div>
            {approval.status === "Stale" && (
              <button
                className="px-3 py-1 rounded-full transition-all hover:bg-red-500/30"
                style={{
                  backgroundColor: "rgba(255, 51, 102, 0.2)",
                  border: "1px solid #ff3366",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#ff3366",
                  textTransform: "uppercase",
                }}
              >
                Revoke
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          className="py-3 rounded-xl transition-all"
          style={{
            backgroundColor: "rgba(0, 212, 255, 0.2)",
            border: "1px solid #00d4ff",
            color: "#00d4ff",
            fontWeight: 700,
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <Lock size={16} />
            Security Scan
          </div>
        </button>
        <button
          className="py-3 rounded-xl transition-all"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "rgba(255, 255, 255, 0.8)",
            fontWeight: 700,
          }}
        >
          Review All
        </button>
      </div>
    </motion.div>
  );
}