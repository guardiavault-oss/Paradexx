'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, BookOpen, X, ExternalLink } from 'lucide-react'

interface HelpSection {
  id: string
  title: string
  content: string | React.ReactNode
  links?: Array<{ label: string; href: string }>
}

interface ContextualHelpProps {
  sections: HelpSection[]
  title?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

export default function ContextualHelp({
  sections,
  title = 'Help & Documentation',
  position = 'bottom-right',
}: ContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState(sections[0]?.id || '')

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-24 right-6',
    'top-left': 'top-24 left-6',
  }

  return (
    <>
      {/* Help Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed ${positionClasses[position]} z-40 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-500/50 flex items-center justify-center hover:shadow-xl hover:shadow-cyan-500/70 transition-all`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Help"
      >
        <HelpCircle className="w-6 h-6 text-white" />
      </motion.button>

      {/* Help Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className={`fixed ${positionClasses[position]} z-50 w-96 max-w-[calc(100vw-3rem)] max-h-[80vh] bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/20 overflow-hidden flex flex-col`}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-cyan-500/20">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-bold text-white">{title}</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Navigation */}
                {sections.length > 1 && (
                  <div className="p-4 border-b border-cyan-500/20">
                    <div className="flex gap-2 flex-wrap">
                      {sections.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => setActiveSection(section.id)}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            activeSection === section.id
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                              : 'bg-black/20 text-gray-400 border border-transparent hover:border-cyan-500/20'
                          }`}
                        >
                          {section.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Section Content */}
                <div className="p-4">
                  <AnimatePresence mode="wait">
                    {sections
                      .filter((section) => section.id === activeSection)
                      .map((section) => (
                        <motion.div
                          key={section.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-4"
                        >
                          <h4 className="text-lg font-semibold text-white">{section.title}</h4>
                          <div className="text-sm text-gray-300 leading-relaxed">
                            {typeof section.content === 'string' ? (
                              <p>{section.content}</p>
                            ) : (
                              section.content
                            )}
                          </div>
                          {section.links && section.links.length > 0 && (
                            <div className="pt-4 border-t border-cyan-500/20">
                              <p className="text-xs font-medium text-gray-400 mb-2">Related Links:</p>
                              <div className="space-y-2">
                                {section.links.map((link, index) => (
                                  <a
                                    key={index}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    {link.label}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

