'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, CheckCircle } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
      return {
        icon: AlertTriangle,
        iconColor: 'text-cyber-orange',
        iconBg: 'bg-cyber-orange/20',
        iconBorder: 'border-cyber-orange/30',
        buttonBg: 'bg-cyber-orange/20 hover:bg-cyber-orange/30',
        buttonText: 'text-cyber-orange',
        buttonBorder: 'border-cyber-orange/30',
      }
      case 'warning':
      return {
        icon: AlertTriangle,
        iconColor: 'text-cyber-yellow',
        iconBg: 'bg-cyber-yellow/20',
        iconBorder: 'border-cyber-yellow/30',
        buttonBg: 'bg-cyber-yellow/20 hover:bg-cyber-yellow/30',
        buttonText: 'text-cyber-yellow',
        buttonBorder: 'border-cyber-yellow/30',
      }
      default:
      return {
        icon: CheckCircle,
        iconColor: 'text-cyber-blue',
        iconBg: 'bg-cyber-blue/20',
        iconBorder: 'border-cyber-blue/30',
        buttonBg: 'bg-cyber-blue/20 hover:bg-cyber-blue/30',
        buttonText: 'text-cyber-blue',
        buttonBorder: 'border-cyber-blue/30',
      }
    }
  }

  const styles = getVariantStyles()
  const Icon = styles.icon

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              className="bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-cyan-500/20 mobile-modal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className={`p-3 rounded-xl ${styles.iconBg} border ${styles.iconBorder}`}>
                  <Icon className={`w-6 h-6 ${styles.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{message}</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                  disabled={isLoading}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-3">
                <motion.button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-gray-500/20 text-gray-400 rounded-xl hover:bg-gray-500/30 border border-gray-500/30 backdrop-blur-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                >
                  {cancelText}
                </motion.button>
                <motion.button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={`flex-1 px-4 py-2.5 ${styles.buttonBg} ${styles.buttonText} rounded-xl border ${styles.buttonBorder} backdrop-blur-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation flex items-center justify-center gap-2`}
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                >
                  {isLoading ? (
                    <>
                      <div className="cyber-spinner w-4 h-4"></div>
                      Processing...
                    </>
                  ) : (
                    confirmText
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

