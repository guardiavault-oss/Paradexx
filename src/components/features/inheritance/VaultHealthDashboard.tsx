import { motion } from "motion/react";
import { CheckCircle2, Circle, Shield, AlertTriangle } from "lucide-react";

interface VaultSetupStep {
  id: string;
  label: string;
  completed: boolean;
  description?: string;
}

interface VaultHealthDashboardProps {
  vaultHealth: number;
  setupSteps: VaultSetupStep[];
  onStepClick?: (stepId: string) => void;
}

export function VaultHealthDashboard({
  vaultHealth,
  setupSteps,
  onStepClick,
}: VaultHealthDashboardProps) {
  const completedCount = setupSteps.filter(s => s.completed).length;
  const totalCount = setupSteps.length;
  const completionPercentage = (completedCount / totalCount) * 100;

  return (
    <div className="space-y-6">
      {/* Vault Health Score - Shield Meter */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 backdrop-blur-xl rounded-3xl"
        style={{
          background: 'var(--bg-overlay)',
          border: '1px solid var(--border-neutral)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 var(--bg-hover)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Vault Health</h3>
            <p className="text-sm text-gray-400">
              {completedCount} of {totalCount} steps completed
            </p>
          </div>
          <Shield className="w-8 h-8 text-[var(--success-bright)]" />
        </div>

        {/* Shield with segmented fill */}
        <div className="relative mx-auto mb-6" style={{ width: '200px', height: '220px' }}>
          {/* Shield SVG */}
          <svg viewBox="0 0 200 220" className="w-full h-full">
            {/* Shield outline */}
            <defs>
              <linearGradient id="healthGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={vaultHealth >= 80 ? 'var(--success-bright)' : vaultHealth >= 50 ? 'var(--warning)' : 'var(--error-bright)'} />
                <stop offset="100%" stopColor={vaultHealth >= 80 ? '#00A843' : vaultHealth >= 50 ? '#FFA000' : '#CC3D3D'} />
              </linearGradient>
            </defs>
            
            {/* Background shield */}
            <path
              d="M 100 10 L 180 50 L 180 120 Q 180 180 100 210 Q 20 180 20 120 L 20 50 Z"
              fill="rgba(128, 128, 128, 0.1)"
              stroke="rgba(128, 128, 128, 0.3)"
              strokeWidth="2"
            />
            
            {/* Filled shield (animated) */}
            <motion.path
              d="M 100 10 L 180 50 L 180 120 Q 180 180 100 210 Q 20 180 20 120 L 20 50 Z"
              fill="url(#healthGradient)"
              opacity={0.9}
              initial={{ clipPath: 'inset(100% 0 0 0)' }}
              animate={{ clipPath: `inset(${100 - vaultHealth}% 0 0 0)` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            
            {/* Segment lines */}
            {[25, 50, 75].map((percent) => (
              <line
                key={percent}
                x1="30"
                y1={210 - (percent / 100) * 160}
                x2="170"
                y2={210 - (percent / 100) * 160}
                stroke="rgba(0, 0, 0, 0.3)"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            ))}
            
            {/* Shield outline on top */}
            <path
              d="M 100 10 L 180 50 L 180 120 Q 180 180 100 210 Q 20 180 20 120 L 20 50 Z"
              fill="none"
              stroke="var(--border-strong)"
              strokeWidth="3"
            />
          </svg>
          
          {/* Center health score */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
            <motion.div
              className="text-5xl font-bold text-white"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              {vaultHealth}
            </motion.div>
            <div className="text-sm text-gray-400 mt-1">Health Score</div>
          </div>
          
          {/* Glow effect */}
          <motion.div 
            className="absolute inset-0 blur-2xl opacity-20 pointer-events-none"
            style={{
              background: vaultHealth >= 80 
                ? 'radial-gradient(ellipse at center, var(--success-bright) 0%, transparent 70%)' 
                : vaultHealth >= 50 
                ? 'radial-gradient(ellipse at center, var(--warning) 0%, transparent 70%)'
                : 'radial-gradient(ellipse at center, var(--error-bright) 0%, transparent 70%)',
            }}
            animate={{ opacity: [0.2, 0.3, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        {/* Status message */}
        <div className="text-center">
          <p className="text-base text-gray-300">
            {vaultHealth >= 80 && "🎉 Excellent! Your vault is well protected."}
            {vaultHealth >= 50 && vaultHealth < 80 && "⚠️ Good progress! Complete remaining steps."}
            {vaultHealth < 50 && "🚨 Action needed! Secure your vault now."}
          </p>
        </div>
      </motion.div>

      {/* Setup Checklist */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 backdrop-blur-xl rounded-2xl"
        style={{
          background: 'var(--bg-overlay)',
          border: '1px solid var(--border-neutral)',
        }}
      >
        <h4 className="text-lg font-bold text-white mb-4">Setup Checklist</h4>
        
        <div className="space-y-3">
          {setupSteps.map((step, idx) => (
            <motion.button
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => onStepClick?.(step.id)}
              className="w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left"
              style={{
                background: step.completed 
                  ? 'rgba(0, 200, 83, 0.1)' 
                  : 'rgba(128, 128, 128, 0.05)',
                border: `1px solid ${step.completed ? 'rgba(0, 200, 83, 0.3)' : 'var(--border-neutral)'}`,
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                animate={step.completed ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                {step.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-[var(--success-bright)]" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-500" />
                )}
              </motion.div>
              
              <div className="flex-1">
                <div className={`text-base font-semibold ${step.completed ? 'text-white' : 'text-gray-400'}`}>
                  {step.label}
                </div>
                {step.description && (
                  <div className="text-sm text-gray-500 mt-0.5">
                    {step.description}
                  </div>
                )}
              </div>
              
              {!step.completed && (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              )}
            </motion.button>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Overall Progress</span>
            <span className="text-sm font-semibold text-white">{Math.round(completionPercentage)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[var(--success-bright)] to-[var(--accent-primary)]"
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
