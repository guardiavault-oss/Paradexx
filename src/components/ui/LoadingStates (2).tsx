import { motion } from 'motion/react';
import { Loader2, Zap, Shield, TrendingUp, Wallet } from 'lucide-react';

interface LoadingStatesProps {
  variant?:
    | 'spinner'
    | 'pulse'
    | 'dots'
    | 'skeleton'
    | 'progress'
    | 'fullscreen';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  progress?: number;
  type?: 'degen' | 'regen';
}

export function LoadingStates({
  variant = 'spinner',
  size = 'md',
  text,
  progress = 0,
  type = 'degen',
}: LoadingStatesProps) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';
  const secondaryColor = isDegen ? '#8B0000' : '#000080';

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  // Spinner Loading
  if (variant === 'spinner') {
    return (
      <div className="flex flex-col items-center justify-center gap-3">
        <motion.div
          className={`${sizeClasses[size]} rounded-full border-2 border-t-transparent`}
          style={{
            borderColor: `${accentColor}40`,
            borderTopColor: 'transparent',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <motion.div
            className="w-full h-full rounded-full border-2 border-transparent border-t-current"
            style={{ color: accentColor }}
          />
        </motion.div>
        {text && (
          <p className="text-sm text-white/70 font-medium uppercase tracking-wider">
            {text}
          </p>
        )}
      </div>
    );
  }

  // Pulse Loading
  if (variant === 'pulse') {
    return (
      <div className="flex flex-col items-center justify-center gap-3">
        <motion.div
          className={`${sizeClasses[size]} rounded-full`}
          style={{
            background: `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
            boxShadow: `0 0 20px ${accentColor}40`,
          }}
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
        {text && (
          <p className="text-sm text-white/70 font-medium uppercase tracking-wider">
            {text}
          </p>
        )}
      </div>
    );
  }

  // Dots Loading
  if (variant === 'dots') {
    return (
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={`${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'} rounded-full`}
              style={{ background: accentColor }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
        {text && (
          <p className="text-sm text-white/70 font-medium uppercase tracking-wider">
            {text}
          </p>
        )}
      </div>
    );
  }

  // Skeleton Loading
  if (variant === 'skeleton') {
    return (
      <div className="w-full space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <motion.div
              className="w-12 h-12 rounded-full bg-white/10"
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
            <div className="flex-1 space-y-2">
              <motion.div
                className="h-4 bg-white/10 rounded w-3/4"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
              <motion.div
                className="h-3 bg-white/10 rounded w-1/2"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2 + 0.1,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Progress Loading
  if (variant === 'progress') {
    return (
      <div className="w-full space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/70 font-medium uppercase tracking-wider">
            {text || 'Loading...'}
          </p>
          <p className="text-sm font-black" style={{ color: accentColor }}>
            {Math.round(progress)}%
          </p>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
            }}
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    );
  }

  // Fullscreen Loading
  if (variant === 'fullscreen') {
    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center">
        <div className="text-center">
          {/* Animated Logo/Icon */}
          <motion.div
            className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${accentColor}40 0%, ${secondaryColor}20 100%)`,
              border: `2px solid ${accentColor}40`,
            }}
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            {/* Rotating border */}
            <motion.div
              className="absolute inset-0 rounded-3xl"
              style={{
                background: `conic-gradient(from 0deg, ${accentColor}, ${secondaryColor}, ${accentColor})`,
                opacity: 0.3,
              }}
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
            />

            {/* Icon */}
            <Wallet
              className="w-12 h-12 relative z-10"
              style={{ color: accentColor }}
            />
          </motion.div>

          {/* Loading Text */}
          <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
            {text || 'Loading Paradex Wallet'}
          </h3>

          {/* Animated dots */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ background: accentColor }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>

          {/* Features Loading */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { icon: Shield, text: 'Securing Wallet' },
              { icon: Zap, text: 'Loading Features' },
              { icon: TrendingUp, text: 'Fetching Prices' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="flex flex-col items-center gap-2 p-4 bg-white/5 border border-white/10 rounded-xl"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: index * 0.3,
                  }}
                >
                  <item.icon className="w-6 h-6 text-white/50" />
                </motion.div>
                <p className="text-xs text-white/50 uppercase tracking-wider font-bold">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Progress bar */}
          {progress > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 max-w-md mx-auto"
            >
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
                  }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// Individual component exports for convenience
export function SpinnerLoading(props: Omit<LoadingStatesProps, 'variant'>) {
  return <LoadingStates {...props} variant="spinner" />;
}

export function PulseLoading(props: Omit<LoadingStatesProps, 'variant'>) {
  return <LoadingStates {...props} variant="pulse" />;
}

export function DotsLoading(props: Omit<LoadingStatesProps, 'variant'>) {
  return <LoadingStates {...props} variant="dots" />;
}

export function SkeletonLoading(props: Omit<LoadingStatesProps, 'variant'>) {
  return <LoadingStates {...props} variant="skeleton" />;
}

export function ProgressLoading(props: Omit<LoadingStatesProps, 'variant'>) {
  return <LoadingStates {...props} variant="progress" />;
}

export function FullscreenLoading(props: Omit<LoadingStatesProps, 'variant'>) {
  return <LoadingStates {...props} variant="fullscreen" />;
}
