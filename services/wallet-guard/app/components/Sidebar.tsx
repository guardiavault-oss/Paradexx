'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useSidebar } from '../contexts/sidebar-context'
import { 
  LayoutDashboard, 
  Wallet, 
  AlertTriangle, 
  Search, 
  BarChart3, 
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  User,
  BookOpen,
  FileText,
  Lock,
  Link as LinkIcon,
  UserCheck
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, color: '#00D4FF' },
  { name: 'Wallets', href: '/wallets', icon: Wallet, color: '#39FF14' },
  { name: 'Threats', href: '/threats', icon: AlertTriangle, color: '#FF6B35' },
  { name: 'Transactions', href: '/transactions', icon: Search, color: '#8B5CF6' },
  { name: 'Security Rules', href: '/security-rules', icon: Lock, color: '#FFD700' },
  { name: 'Phishing Protection', href: '/phishing', icon: LinkIcon, color: '#EC4899' },
  { name: 'Address Reputation', href: '/reputation', icon: UserCheck, color: '#10B981' },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, color: '#FFD700' },
  { name: 'Address Book', href: '/address-book', icon: BookOpen, color: '#00D4FF' },
  { name: 'Audit Logs', href: '/audit-logs', icon: FileText, color: '#39FF14' },
  { name: 'Settings', href: '/settings', icon: Settings, color: '#8B5CF6' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, sidebarMobileOpen, setSidebarCollapsed, setSidebarMobileOpen } = useSidebar()

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarMobileOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.div
        className={`fixed md:relative left-0 top-0 h-full z-40 backdrop-blur-xl bg-dark-100/80 border-r border-metamask-purple/20 shadow-2xl ${
          sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        animate={{ 
          width: sidebarCollapsed ? '80px' : '280px',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
      {/* Header */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-metamask-purple/20">
        <AnimatePresence mode="wait">
          {!sidebarCollapsed ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl metamask-gradient flex items-center justify-center shadow-lg glow-primary-subtle">
                <Shield size={20} className="text-white font-bold" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Wallet Guard</h1>
                <p className="text-xs text-muted-foreground font-medium">Enterprise Edition</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-10 h-10 rounded-xl metamask-gradient flex items-center justify-center mx-auto shadow-lg glow-primary-subtle"
            >
              <Shield size={20} className="text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <div className="space-y-2 px-3 pb-4">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <motion.div
                key={item.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href={item.href}
                  onClick={() => setSidebarMobileOpen(false)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden touch-manipulation ${
                    isActive
                      ? 'bg-gradient-to-r from-metamask-purple/20 to-metamask-blue/20 border border-metamask-purple/40 shadow-lg glow-primary-subtle'
                      : 'hover:bg-muted/50 border border-transparent'
                  }`}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      className="absolute left-0 top-0 w-1 h-full rounded-r-full metamask-gradient"
                      layoutId="activeIndicator"
                    />
                  )}

                  {/* Icon */}
                  <div
                    className={`p-2 rounded-lg transition-all ${
                      isActive 
                        ? 'bg-metamask-purple/20 shadow-md' 
                        : 'group-hover:bg-muted/30'
                    }`}
                  >
                    <Icon
                      size={18}
                      className={isActive ? 'text-metamask-purple' : 'text-muted-foreground group-hover:text-foreground'}
                    />
                  </div>

                  {/* Label */}
                  <AnimatePresence mode="wait">
                    {!sidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className={`font-medium transition-colors ${
                          isActive 
                            ? 'text-foreground' 
                            : 'text-muted-foreground group-hover:text-foreground'
                        }`}
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-metamask-purple/20">
        <AnimatePresence mode="wait">
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-muted-foreground"
            >
              <p>Version 2.0.0</p>
              <p className="mt-1">© 2024 Wallet Guard</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collapse Toggle - Desktop Only */}
      <motion.button
        className="hidden md:flex absolute -right-4 top-20 w-8 h-8 rounded-full bg-dark-200 border border-metamask-purple/30 items-center justify-center hover:bg-metamask-purple/20 transition-colors z-40 backdrop-blur-sm"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {sidebarCollapsed ? <ChevronRight size={16} className="text-metamask-purple" /> : <ChevronLeft size={16} className="text-metamask-purple" />}
      </motion.button>
    </motion.div>
    </>
  )
}

