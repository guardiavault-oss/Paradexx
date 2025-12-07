import { motion } from "motion/react";
import { Heart, Loader2, ChevronRight, Flame } from "lucide-react";

interface EnhancedCheckInProps {
  onCheckIn: () => void;
  loading: boolean;
  isConnected: boolean;
  isOnSepolia: boolean;
  daysRemaining: number;
  checkInStreak: number;
  lastCheckIn: Date;
  last90Days?: Array<{ date: string; checkedIn: boolean }>;
}

export function EnhancedCheckIn({
  onCheckIn,
  loading,
  isConnected,
  isOnSepolia,
  daysRemaining,
  checkInStreak,
  lastCheckIn,
  last90Days = [],
}: EnhancedCheckInProps) {
  const checkInProgress = Math.min((30 - daysRemaining) / 30, 1);
  const circumference = 2 * Math.PI * 58;
  const strokeDashoffset = circumference - checkInProgress * circumference;

  return (
    <div className="space-y-4">
      {/* Main Check-in Card with Progress Circle */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onCheckIn}
        disabled={loading}
        className="w-full p-6 md:p-8 backdrop-blur-xl rounded-2xl md:rounded-3xl group relative overflow-hidden transition-all disabled:opacity-50"
        style={{
          background: 'var(--bg-overlay)',
          border: '1px solid var(--border-neutral)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 var(--bg-hover)',
        }}
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="flex items-center justify-between">
          {/* Left: Progress Circle */}
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28 md:w-32 md:h-32">
              <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 128 128">
                {/* Background circle */}
                <circle
                  className="text-gray-700"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="58"
                  cx="64"
                  cy="64"
                />
                {/* Progress circle */}
                <motion.circle
                  className="text-[var(--success-bright)]"
                  strokeWidth="8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="58"
                  cx="64"
                  cy="64"
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  style={{
                    strokeDasharray: circumference,
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              
              {/* Center content - Days remaining INSIDE the gauge */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {loading ? (
                  <Loader2 className="w-10 h-10 text-[var(--accent-primary)] animate-spin" />
                ) : (
                  <>
                    <div className="text-3xl md:text-4xl font-bold text-white leading-none">
                      {daysRemaining}
                    </div>
                    <div className="text-[10px] md:text-xs text-gray-400 mt-1">
                      {daysRemaining === 1 ? 'day' : 'days'}
                    </div>
                  </>
                )}
              </div>
              
              {/* Pulse animation */}
              {!loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute w-28 h-28 md:w-32 md:h-32 bg-[var(--success-bright)]/20 rounded-full animate-ping" />
                </div>
              )}
            </div>

            {/* Text content */}
            <div className="text-left">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
                I&apos;m Alive Check-In
              </h3>
              <p className="text-sm md:text-base text-[var(--text-muted)] mb-2">
                {isConnected && isOnSepolia 
                  ? 'Recorded on-chain for proof' 
                  : 'Reset your dead man\'s switch timer'}
              </p>
              
              {/* Streak indicator */}
              <div className="flex items-center gap-2 mt-2">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                >
                  <Flame className="w-5 h-5 text-orange-500" />
                </motion.div>
                <span className="text-base md:text-lg font-bold text-white">
                  {checkInStreak} Day Streak
                </span>
              </div>
            </div>
          </div>

          {/* Right: Action indicators */}
          <div className="flex items-center gap-3">
            {isConnected && isOnSepolia && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-sm md:text-base text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-3 py-2 rounded-full font-semibold border border-[var(--accent-primary)]/30"
              >
                On-Chain
              </motion.span>
            )}
            <div className="bg-white/10 p-3 rounded-full">
              <ChevronRight className="w-6 h-6 text-[var(--text-muted)]" />
            </div>
          </div>
        </div>
      </motion.button>

      {/* Recent Activity Summary */}
      {last90Days.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 md:p-6 backdrop-blur-xl rounded-xl"
          style={{
            background: 'var(--bg-overlay)',
            border: '1px solid var(--border-neutral)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">
                Recent Activity
              </h4>
              <p className="text-xs text-gray-500">
                Last check-in: {lastCheckIn.toLocaleDateString()}
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-[var(--success-bright)]">
                {last90Days.filter(d => d.checkedIn).length}
              </div>
              <div className="text-xs text-gray-400">check-ins (90d)</div>
            </div>
          </div>
          
          {/* Mini bar chart */}
          <div className="flex items-end gap-1 mt-4 h-12">
            {Array.from({ length: 12 }).map((_, idx) => {
              const weekStart = idx * 7;
              const weekData = last90Days.slice(weekStart, weekStart + 7);
              const weekCount = weekData.filter(d => d.checkedIn).length;
              const height = (weekCount / 7) * 100;
              
              return (
                <motion.div
                  key={idx}
                  className="flex-1 bg-gradient-to-t from-[var(--success-bright)] to-[var(--accent-primary)] rounded-t"
                  style={{ height: `${height}%` }}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: idx * 0.05, duration: 0.5 }}
                  whileHover={{ opacity: 0.8 }}
                  title={`Week ${idx + 1}: ${weekCount}/7 check-ins`}
                />
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
