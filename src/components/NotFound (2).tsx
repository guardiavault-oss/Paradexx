import { motion } from 'motion/react';
import { Home, ArrowLeft, Search, Compass } from 'lucide-react';

interface NotFoundProps {
  type?: 'degen' | 'regen';
  title?: string;
  message?: string;
  showSearch?: boolean;
  onGoHome?: () => void;
  onGoBack?: () => void;
}

export function NotFound({
  type = 'degen',
  title = '404 - Page Not Found',
  message = "This page doesn't exist or has been moved to another dimension.",
  showSearch = false,
  onGoHome,
  onGoBack,
}: NotFoundProps) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';
  const secondaryColor = isDegen ? '#8B0000' : '#000080';

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Animated 404 */}
        <motion.div
          className="relative mb-8"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Background glow */}
          <motion.div
            className="absolute inset-0 blur-3xl"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
            }}
          />

          {/* 404 Text */}
          <motion.h1
            className="relative text-[120px] md:text-[180px] font-black leading-none"
            style={{
              background: `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
            animate={{
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            404
          </motion.h1>

          {/* Floating elements */}
          <motion.div
            className="absolute top-1/4 left-1/4"
            animate={{
              y: [0, -20, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Compass className="w-8 h-8 text-white/20" />
          </motion.div>

          <motion.div
            className="absolute top-1/3 right-1/4"
            animate={{
              y: [0, 20, 0],
              rotate: [360, 180, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Search className="w-6 h-6 text-white/20" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl md:text-3xl font-black uppercase text-white mb-4"
        >
          {title}
        </motion.h2>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-white/60 mb-8 max-w-md mx-auto"
        >
          {message}
        </motion.p>

        {/* Search (optional) */}
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8 max-w-md mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search for something..."
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-white/30 outline-none"
              />
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGoHome}
            className="px-6 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2"
            style={{
              background: accentColor,
            }}
          >
            <Home className="w-5 h-5" />
            Go Home
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGoBack}
            className="px-6 py-3 rounded-xl font-bold text-white bg-white/10 border border-white/20 flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </motion.button>
        </motion.div>

        {/* Footer message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
        >
          <p className="text-xs text-white/40">
            Lost in the {isDegen ? 'degen' : 'regen'} multiverse? Don't worry, it happens.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// Inline 404 (for smaller sections)
export function NotFoundInline({
  type = 'degen',
  title = 'Not Found',
  message = 'The content you're looking for doesn't exist.',
  action,
}: {
  type?: 'degen' | 'regen';
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 rounded-xl bg-white/5 border border-white/10 text-center"
    >
      <motion.div
        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
        style={{
          background: `${accentColor}20`,
          border: `2px solid ${accentColor}`,
        }}
        animate={{
          rotate: [0, 10, -10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      >
        <Search className="w-8 h-8" style={{ color: accentColor }} />
      </motion.div>

      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/60 mb-4">{message}</p>

      {action && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className="px-4 py-2 rounded-lg font-bold text-white"
          style={{
            background: accentColor,
          }}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
