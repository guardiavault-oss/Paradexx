import { motion } from 'motion/react';
import { Loader2, Wallet, Shield, Zap, TrendingUp } from 'lucide-react';

interface LoadingStateProps {
  type?: 'degen' | 'regen';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars';
  message?: string;
  fullScreen?: boolean;
}

export function LoadingState({
  type = 'degen',
  size = 'md',
  variant = 'spinner',
  message,
  fullScreen = false,
}: LoadingStateProps) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      {variant === 'spinner' && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <Loader2 className={sizeClasses[size]} style={{ color: accentColor }} />
        </motion.div>
      )}

      {variant === 'dots' && (
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="rounded-full"
              style={{
                width: size === 'sm' ? 8 : size === 'md' ? 12 : 16,
                height: size === 'sm' ? 8 : size === 'md' ? 12 : 16,
                background: accentColor,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      )}

      {variant === 'pulse' && (
        <motion.div
          className={`rounded-full ${sizeClasses[size]}`}
          style={{ background: accentColor }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {variant === 'bars' && (
        <div className="flex items-end gap-1 h-12">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="w-2 rounded-full"
              style={{ background: accentColor }}
              animate={{
                height: ['20%', '100%', '20%'],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
      )}

      {message && (
        <motion.p
          className="text-sm text-white/60"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {message}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

// Inline loader (for buttons, etc.)
export function InlineLoader({
  type = 'degen',
  size = 'sm',
}: {
  type?: 'degen' | 'regen';
  size?: 'sm' | 'md' | 'lg';
}) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <Loader2 className={sizeClasses[size]} style={{ color: accentColor }} />
    </motion.div>
  );
}

// Loading overlay (for sections)
export function LoadingOverlay({
  type = 'degen',
  message,
}: {
  type?: 'degen' | 'regen';
  message?: string;
}) {
  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
      <LoadingState type={type} message={message} />
    </div>
  );
}

// Loading card (placeholder)
export function LoadingCard({ type = 'degen' }: { type?: 'degen' | 'regen' }) {
  return (
    <div className="p-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
      <LoadingState type={type} size="md" />
    </div>
  );
}

// Blockchain transaction loader
export function TransactionLoader({
  type = 'degen',
  step = 1,
  totalSteps = 3,
}: {
  type?: 'degen' | 'regen';
  step?: number;
  totalSteps?: number;
}) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';

  const steps = [
    { icon: Wallet, label: 'Preparing' },
    { icon: Shield, label: 'Signing' },
    { icon: Zap, label: 'Confirming' },
  ].slice(0, totalSteps);

  return (
    <div className="space-y-6">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="mx-auto"
      >
        <Loader2 className="w-16 h-16" style={{ color: accentColor }} />
      </motion.div>

      <div className="space-y-3">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = i + 1 === step;
          const isComplete = i + 1 < step;

          return (
            <motion.div
              key={i}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: isActive || isComplete ? `${accentColor}20` : 'rgba(255, 255, 255, 0.05)',
                  border: `2px solid ${isActive || isComplete ? accentColor : 'rgba(255, 255, 255, 0.1)'}`,
                }}
              >
                {isComplete ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-3 h-3 rounded-full"
                    style={{ background: accentColor }}
                  />
                ) : (
                  <Icon
                    className="w-4 h-4"
                    style={{ color: isActive ? accentColor : 'rgba(255, 255, 255, 0.4)' }}
                  />
                )}
              </div>
              <span
                className={`text-sm font-bold ${
                  isActive ? 'text-white' : isComplete ? 'text-white/60' : 'text-white/40'
                }`}
              >
                {s.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Progress loader
export function ProgressLoader({
  type = 'degen',
  progress = 0,
  message,
}: {
  type?: 'degen' | 'regen';
  progress?: number;
  message?: string;
}) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';

  return (
    <div className="space-y-4">
      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}80 100%)`,
          }}
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/60">{message || 'Loading...'}</span>
        <span className="font-bold text-white">{progress}%</span>
      </div>
    </div>
  );
}

// Animated logo loader
export function LogoLoader({ type = 'degen' }: { type?: 'degen' | 'regen' }) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';

  return (
    <div className="flex flex-col items-center gap-6">
      <motion.div
        className="relative"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 blur-2xl"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
          }}
        />

        {/* Logo */}
        <div
          className="relative w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-black"
          style={{
            background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}80 100%)`,
          }}
        >
          {isDegen ? '🔥' : '❄️'}
        </div>
      </motion.div>

      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-full"
            style={{ background: accentColor }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Chart loading placeholder
export function ChartLoader({ type = 'degen' }: { type?: 'degen' | 'regen' }) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';

  return (
    <div className="flex items-end justify-between h-48 gap-2">
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-t"
          style={{ background: `${accentColor}40` }}
          animate={{
            height: ['20%', `${Math.random() * 80 + 20}%`, '20%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
}
