import { motion } from "motion/react";
import { Users, Clock, Shield, Lock } from "lucide-react";

interface InheritanceVaultProps {
  onClick?: () => void;
}

export default function InheritanceVault({
  onClick,
}: InheritanceVaultProps) {
  const beneficiaries = [
    { name: "Sarah Chen", percentage: 50 },
    { name: "Michael Chen", percentage: 30 },
    { name: "Emma Chen", percentage: 20 },
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
              backgroundColor: "rgba(0, 255, 136, 0.2)",
            }}
          >
            <Lock
              size={18}
              color="#00ff88"
              className="sm:w-6 sm:h-6"
            />
          </div>
          <div>
            <h3 className="text-base sm:text-xl font-black text-white uppercase">
              Legacy Vault
            </h3>
            <p
              className="text-[10px] sm:text-xs"
              style={{ color: "rgba(255, 255, 255, 0.6)" }}
            >
              Time-locked inheritance
            </p>
          </div>
        </div>
        <div
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
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div
          className="p-3 sm:p-6 rounded-xl"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div
            className="text-[10px] sm:text-xs mb-2"
            style={{ color: "rgba(255, 255, 255, 0.6)" }}
          >
            Protected Value
          </div>
          <div
            className="text-xl sm:text-3xl font-black"
            style={{ color: "#00ff88" }}
          >
            $24,500
          </div>
        </div>
        <div
          className="p-3 sm:p-6 rounded-xl"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div
            className="text-[10px] sm:text-xs mb-2"
            style={{ color: "rgba(255, 255, 255, 0.6)" }}
          >
            Inactivity Timer
          </div>
          <div
            className="text-xl sm:text-3xl font-black"
            style={{ color: "#00d4ff" }}
          >
            365d
          </div>
        </div>
      </div>

      {/* Next Check-in */}
      <div
        className="p-3 sm:p-4 rounded-xl mb-4 sm:mb-6"
        style={{
          backgroundColor: "rgba(0, 212, 255, 0.1)",
          border: "1px solid rgba(0, 212, 255, 0.3)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock
              size={16}
              color="#00d4ff"
              className="sm:w-5 sm:h-5"
            />
            <span
              className="text-xs sm:text-sm"
              style={{ color: "rgba(255, 255, 255, 0.8)" }}
            >
              Next check-in required
            </span>
          </div>
          <span
            className="text-sm sm:text-base font-bold"
            style={{ color: "#00d4ff" }}
          >
            12 days
          </span>
        </div>
      </div>

      {/* Beneficiaries */}
      <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
        <div className="flex items-center justify-between">
          <div
            className="text-[10px] sm:text-xs uppercase tracking-wider"
            style={{
              color: "rgba(255, 255, 255, 0.6)",
            }}
          >
            Beneficiaries
          </div>
          <div
            className="text-[10px] sm:text-xs"
            style={{ color: "rgba(255, 255, 255, 0.6)" }}
          >
            {beneficiaries.length} configured
          </div>
        </div>
        {beneficiaries.map((beneficiary, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-3 sm:p-4 rounded-xl flex items-center justify-between"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <Users
                size={16}
                color="#00ff88"
                className="sm:w-5 sm:h-5"
              />
              <div>
                <div className="text-xs sm:text-sm font-bold text-white">
                  {beneficiary.name}
                </div>
                <div
                  className="text-[10px] sm:text-xs"
                  style={{ color: "rgba(255, 255, 255, 0.6)" }}
                >
                  Beneficiary
                </div>
              </div>
            </div>
            <div
              className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold"
              style={{
                backgroundColor: "rgba(0, 255, 136, 0.2)",
                color: "#00ff88",
              }}
            >
              {beneficiary.percentage}%
            </div>
          </motion.div>
        ))}
      </div>

      {/* Guardians */}
      <div
        className="p-3 sm:p-4 rounded-xl flex items-center gap-2 sm:gap-3"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <Shield
          size={16}
          color="#00ff88"
          className="sm:w-5 sm:h-5"
        />
        <div>
          <div className="text-xs sm:text-sm font-bold text-white">
            2 Guardians Assigned
          </div>
          <div
            className="text-[10px] sm:text-xs"
            style={{ color: "rgba(255, 255, 255, 0.6)" }}
          >
            Guardian oversight active
          </div>
        </div>
      </div>
    </motion.div>
  );
}