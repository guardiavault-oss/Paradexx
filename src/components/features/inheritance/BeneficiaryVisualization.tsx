import { motion } from "motion/react";
import { User, Heart, Wallet, TrendingUp } from "lucide-react";

interface Beneficiary {
  id: string;
  name: string;
  address: string;
  allocation: number;
  relationship: string;
}

interface BeneficiaryVisualizationProps {
  beneficiaries: Beneficiary[];
  ownerName?: string;
  onBeneficiaryClick?: (beneficiary: Beneficiary) => void;
}

export function BeneficiaryVisualization({
  beneficiaries,
  ownerName = "You",
  onBeneficiaryClick,
}: BeneficiaryVisualizationProps) {
  const centerX = 200;
  const centerY = 200;
  const radius = 120;

  const positions = beneficiaries.map((_, idx) => {
    const angle = (idx * (360 / beneficiaries.length) - 90) * (Math.PI / 180);
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  return (
    <div className="p-6 md:p-8 backdrop-blur-xl rounded-3xl"
      style={{
        background: 'var(--bg-overlay)',
        border: '1px solid var(--border-neutral)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 var(--bg-hover)',
      }}
    >
      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-2">Beneficiary Network</h3>
        <p className="text-sm text-gray-400">
          {beneficiaries.length} beneficiaries · Total allocation: {beneficiaries.reduce((sum, b) => sum + b.allocation, 0)}%
        </p>
      </div>

      {/* SVG Visualization */}
      <div className="relative w-full max-w-md mx-auto" style={{ height: '400px' }}>
        <svg viewBox="0 0 400 400" className="w-full h-full">
          {/* Connection lines */}
          {beneficiaries.map((beneficiary, idx) => (
            <motion.line
              key={`line-${beneficiary.id}`}
              x1={centerX}
              y1={centerY}
              x2={positions[idx].x}
              y2={positions[idx].y}
              stroke="rgba(0, 200, 83, 0.3)"
              strokeWidth="2"
              strokeDasharray="5,5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1, delay: idx * 0.1 }}
            />
          ))}

          {/* Center node (owner) */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.3 }}
          >
            <circle
              cx={centerX}
              cy={centerY}
              r="40"
              fill="rgba(0, 200, 83, 0.2)"
              stroke="var(--success-bright)"
              strokeWidth="3"
            />
            <circle
              cx={centerX}
              cy={centerY}
              r="35"
              fill="rgba(10, 10, 15, 0.95)"
            />
          </motion.g>

          {/* Beneficiary nodes */}
          {beneficiaries.map((beneficiary, idx) => (
            <motion.g
              key={beneficiary.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 + idx * 0.15, type: "spring" }}
            >
              <circle
                cx={positions[idx].x}
                cy={positions[idx].y}
                r="32"
                fill="rgba(0, 173, 239, 0.2)"
                stroke="var(--accent-primary)"
                strokeWidth="2"
              />
              <circle
                cx={positions[idx].x}
                cy={positions[idx].y}
                r="28"
                fill="rgba(10, 10, 15, 0.95)"
              />
            </motion.g>
          ))}
        </svg>

        {/* Center icon and label */}
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          <div className="flex flex-col items-center">
            <Wallet className="w-8 h-8 text-[var(--success-bright)] mb-1" />
            <div className="text-xs font-semibold text-white">{ownerName}</div>
          </div>
        </motion.div>

        {/* Beneficiary icons and labels */}
        {beneficiaries.map((beneficiary, idx) => (
          <motion.button
            key={`label-${beneficiary.id}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{
              left: `${(positions[idx].x / 400) * 100}%`,
              top: `${(positions[idx].y / 400) * 100}%`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7 + idx * 0.15, type: "spring" }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onBeneficiaryClick?.(beneficiary)}
          >
            <div className="flex flex-col items-center gap-1 relative">
              <User className="w-6 h-6 text-[var(--accent-primary)] group-hover:text-white transition-colors" />
              <div className="text-[10px] font-semibold text-gray-300 group-hover:text-white transition-colors whitespace-nowrap">
                {beneficiary.name.length > 12 ? beneficiary.name.slice(0, 12) + '...' : beneficiary.name}
              </div>
              <div className="text-xs font-bold text-[var(--success-bright)]">{beneficiary.allocation}%</div>
              
              {/* Tooltip on hover */}
              <motion.div
                className="absolute top-full mt-2 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10"
                style={{
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                }}
              >
                <div className="font-semibold mb-1">{beneficiary.name}</div>
                <div className="text-gray-400 text-[10px] mb-1">{beneficiary.relationship}</div>
                <div className="text-gray-500 text-[10px] font-mono">
                  {beneficiary.address.slice(0, 6)}...{beneficiary.address.slice(-4)}
                </div>
              </motion.div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-8 flex flex-wrap gap-6 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[var(--success-bright)] border-2 border-[var(--success-bright)]" />
          <span className="text-gray-400">Vault Owner</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-transparent border-2 border-[var(--accent-primary)]" />
          <span className="text-gray-400">Beneficiary</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 border-t-2 border-dashed border-[var(--success-bright)]" />
          <span className="text-gray-400">Inheritance Link</span>
        </div>
      </div>

      {/* Quick stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center p-3 rounded-xl bg-gray-800/30">
          <Heart className="w-5 h-5 text-[var(--success-bright)] mx-auto mb-1" />
          <div className="text-lg font-bold text-white">{beneficiaries.length}</div>
          <div className="text-xs text-gray-400">Loved Ones</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-gray-800/30">
          <TrendingUp className="w-5 h-5 text-[var(--accent-primary)] mx-auto mb-1" />
          <div className="text-lg font-bold text-white">
            {Math.round(beneficiaries.reduce((sum, b) => sum + b.allocation, 0))}%
          </div>
          <div className="text-xs text-gray-400">Allocated</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-gray-800/30">
          <Wallet className="w-5 h-5 text-[var(--warning)] mx-auto mb-1" />
          <div className="text-lg font-bold text-white">
            {100 - beneficiaries.reduce((sum, b) => sum + b.allocation, 0)}%
          </div>
          <div className="text-xs text-gray-400">Unallocated</div>
        </div>
      </div>
    </div>
  );
}
