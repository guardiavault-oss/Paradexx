import { motion } from "motion/react";
import { AlertTriangle, Bell, Mail, Unlock, Clock, Pause } from "lucide-react";

interface TimelockStage {
  id: string;
  name: string;
  daysFromInactive: number;
  icon: React.ReactNode;
  color: string;
  description: string;
}

interface MultiStageTimelockProps {
  daysRemaining: number;
  totalDays: number;
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  loading?: boolean;
}

export function MultiStageTimelock({
  daysRemaining,
  totalDays = 30,
  isPaused = false,
  onPause,
  onResume,
  loading = false,
}: MultiStageTimelockProps) {
  const stages: TimelockStage[] = [
    {
      id: 'warning',
      name: 'Warning Phase',
      daysFromInactive: 0,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'var(--warning)',
      description: 'Initial warning period begins',
    },
    {
      id: 'alert',
      name: 'Alert Phase',
      daysFromInactive: Math.floor(totalDays * 0.4),
      icon: <Bell className="w-5 h-5" />,
      color: 'var(--degen-secondary)',
      description: 'Frequent notifications sent',
    },
    {
      id: 'notify',
      name: 'Notify Guardians',
      daysFromInactive: Math.floor(totalDays * 0.7),
      icon: <Mail className="w-5 h-5" />,
      color: '#FF5722',
      description: 'Guardians are contacted',
    },
    {
      id: 'unlock',
      name: 'Vault Unlock',
      daysFromInactive: totalDays,
      icon: <Unlock className="w-5 h-5" />,
      color: '#F44336',
      description: 'Beneficiaries can claim assets',
    },
  ];

  const daysElapsed = totalDays - daysRemaining;
  const progressPercentage = (daysElapsed / totalDays) * 100;

  const getCurrentStage = () => {
    for (let i = stages.length - 1; i >= 0; i--) {
      if (daysElapsed >= stages[i].daysFromInactive) {
        return i;
      }
    }
    return -1;
  };

  const currentStageIndex = getCurrentStage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 backdrop-blur-xl rounded-2xl"
        style={{
          background: 'var(--bg-overlay)',
          border: '1px solid var(--border-neutral)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Timelock Timeline</h3>
            <p className="text-sm text-gray-400">
              {daysRemaining} days remaining until vault unlock
            </p>
          </div>
          <Clock className={`w-8 h-8 ${isPaused ? 'text-[var(--warning)]' : 'text-[var(--success-bright)]'}`} />
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Time Elapsed</span>
            <span className="text-sm font-semibold text-white">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[var(--success-bright)] via-[var(--warning)] to-[#F44336]"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Pause/Resume button */}
        {(onPause || onResume) && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={isPaused ? onResume : onPause}
            disabled={loading}
            className={`w-full mt-4 py-3 px-4 font-semibold rounded-xl flex items-center justify-center gap-2 ${
              isPaused
                ? 'bg-gradient-to-r from-[var(--success-bright)] to-[var(--accent-primary)] text-white'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Pause className="w-5 h-5" />
            {loading ? 'Processing...' : isPaused ? 'Resume Countdown' : 'Pause Timeline'}
          </motion.button>
        )}
      </motion.div>

      {/* Timeline visualization */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="p-6 backdrop-blur-xl rounded-2xl"
        style={{
          background: 'var(--bg-overlay)',
          border: '1px solid var(--border-neutral)',
        }}
      >
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-700" />

          {/* Progress line */}
          <motion.div
            className="absolute left-8 top-0 w-0.5 bg-gradient-to-b from-[var(--success-bright)] via-[var(--warning)] to-[#F44336]"
            initial={{ height: 0 }}
            animate={{ height: `${progressPercentage}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />

          {/* Stages */}
          <div className="space-y-8 relative">
            {stages.map((stage, idx) => {
              const isActive = idx === currentStageIndex;
              const isPast = idx < currentStageIndex;
              const isFuture = idx > currentStageIndex;

              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="flex items-start gap-4 relative"
                >
                  {/* Icon circle */}
                  <motion.div
                    className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      background: isActive || isPast
                        ? `${stage.color}20`
                        : 'rgba(128, 128, 128, 0.1)',
                      border: `2px solid ${isActive || isPast ? stage.color : '#808080'}`,
                    }}
                    whileHover={{ scale: 1.1 }}
                  >
                    <div style={{ color: isActive || isPast ? stage.color : '#808080' }}>
                      {stage.icon}
                    </div>
                    
                    {/* Pulse effect for active stage */}
                    {isActive && !isPaused && (
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{ border: `2px solid ${stage.color}` }}
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.8, 0, 0.8],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    )}
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 pt-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4
                        className={`text-lg font-bold ${
                          isActive || isPast ? 'text-white' : 'text-gray-500'
                        }`}
                      >
                        {stage.name}
                      </h4>
                      {isActive && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-xs px-2 py-1 rounded-full bg-[var(--success-bright)]/20 text-[var(--success-bright)] font-semibold"
                        >
                          CURRENT
                        </motion.span>
                      )}
                      {isPast && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-400 font-semibold"
                        >
                          COMPLETED
                        </motion.span>
                      )}
                    </div>
                    <p
                      className={`text-sm ${
                        isActive || isPast ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      {stage.description}
                    </p>
                    <div
                      className={`text-xs mt-2 ${
                        isActive || isPast ? 'text-gray-500' : 'text-gray-700'
                      }`}
                    >
                      Day {stage.daysFromInactive} of {totalDays}
                      {stage.daysFromInactive > daysElapsed && (
                        <span className="ml-2">
                          (in {stage.daysFromInactive - daysElapsed} days)
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Info card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-4 backdrop-blur-xl rounded-xl"
        style={{
          background: 'rgba(0, 200, 83, 0.1)',
          border: '1px solid rgba(0, 200, 83, 0.3)',
        }}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white mb-1">Timelock Protection</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Your vault uses a multi-stage timelock to ensure your safety. Regular check-ins 
              prevent unauthorized access. Guardians will be notified if you become inactive 
              for an extended period.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
