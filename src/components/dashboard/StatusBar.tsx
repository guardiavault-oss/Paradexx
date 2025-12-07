import {
  Zap,
  Activity,
  Shield,
  CheckCircle,
} from "lucide-react";
import { motion } from "motion/react";

interface StatusBarProps {
  type: "degen" | "regen";
  portfolioValue: number;
}

export default function StatusBar({
  type,
  portfolioValue,
}: StatusBarProps) {
  const isDegen = type === "degen";
  const primaryColor = isDegen ? "#DC143C" : "#0080FF";

  return (
    <div
      className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl border"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(20px)",
        borderColor: "rgba(255, 255, 255, 0.1)",
      }}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {/* Portfolio Value */}
        <div className="col-span-2 md:col-span-1">
          <div
            className="text-[10px] sm:text-xs uppercase tracking-wider mb-2"
            style={{
              color: "rgba(255, 255, 255, 0.6)",
            }}
          >
            Portfolio Value
          </div>
          <div
            className="text-2xl sm:text-3xl font-black"
            style={{
              color: "#ffffff",
            }}
          >
            ${portfolioValue.toLocaleString()}
          </div>
        </div>

        {/* Gas Tracker */}
        <div>
          <div
            className="text-[10px] sm:text-xs uppercase tracking-wider mb-2"
            style={{
              color: "rgba(255, 255, 255, 0.6)",
            }}
          >
            Gas Tracker
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <Zap
                size={14}
                color={primaryColor}
                className="sm:w-4 sm:h-4"
              />
              <div>
                <div
                  className="text-[10px] sm:text-xs"
                  style={{ color: "rgba(255, 255, 255, 0.6)" }}
                >
                  Slow
                </div>
                <div
                  className="text-sm sm:text-base font-bold"
                  style={{ color: "#ffffff" }}
                >
                  15
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Zap
                size={14}
                color={primaryColor}
                className="sm:w-4 sm:h-4"
              />
              <div>
                <div
                  className="text-[10px] sm:text-xs"
                  style={{ color: "rgba(255, 255, 255, 0.6)" }}
                >
                  Fast
                </div>
                <div
                  className="text-sm sm:text-base font-bold"
                  style={{ color: "#ffffff" }}
                >
                  42
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Network Status */}
        <div>
          <div
            className="text-[10px] sm:text-xs uppercase tracking-wider mb-2"
            style={{
              color: "rgba(255, 255, 255, 0.6)",
            }}
          >
            Network Status
          </div>
          <div className="flex items-center gap-2">
            <Activity
              size={14}
              color="#00ff88"
              className="sm:w-4 sm:h-4"
            />
            <div>
              <div
                className="text-sm sm:text-base font-bold"
                style={{ color: "#ffffff" }}
              >
                Ethereum
              </div>
              <div
                className="text-[10px] sm:text-xs"
                style={{ color: "#00ff88" }}
              >
                12ms latency
              </div>
            </div>
          </div>
        </div>

        {/* Security Status */}
        <div>
          <div
            className="text-[10px] sm:text-xs uppercase tracking-wider mb-2"
            style={{
              color: "rgba(255, 255, 255, 0.6)",
            }}
          >
            Security Status
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle
                size={12}
                color="#00ff88"
                className="sm:w-3.5 sm:h-3.5 flex-shrink-0"
              />
              <span
                className="text-[10px] sm:text-xs"
                style={{ color: "rgba(255, 255, 255, 0.9)" }}
              >
                MEV Protected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle
                size={12}
                color="#00ff88"
                className="sm:w-3.5 sm:h-3.5 flex-shrink-0"
              />
              <span
                className="text-[10px] sm:text-xs"
                style={{ color: "rgba(255, 255, 255, 0.9)" }}
              >
                Phishing Guard
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle
                size={12}
                color="#00ff88"
                className="sm:w-3.5 sm:h-3.5 flex-shrink-0"
              />
              <span
                className="text-[10px] sm:text-xs"
                style={{ color: "rgba(255, 255, 255, 0.9)" }}
              >
                Tx Simulation
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}