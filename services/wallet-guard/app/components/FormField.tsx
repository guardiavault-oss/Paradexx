'use client'

import { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface FormFieldProps {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
  className?: string
}

export default function FormField({
  label,
  error,
  hint,
  required = false,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-300">
        {label}
        {required && <span className="text-cyber-orange ml-1">*</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center gap-2 text-sm text-cyber-orange"
          >
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </motion.div>
        )}
        {hint && !error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs text-gray-500"
          >
            {hint}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

