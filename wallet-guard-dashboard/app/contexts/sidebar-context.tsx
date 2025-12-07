'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface SidebarContextType {
  sidebarCollapsed: boolean
  sidebarMobileOpen: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarMobileOpen: (open: boolean) => void
  toggleSidebar: () => void
  toggleMobileSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const toggleMobileSidebar = () => {
    setSidebarMobileOpen(!sidebarMobileOpen)
  }

  return (
    <SidebarContext.Provider
      value={{
        sidebarCollapsed,
        sidebarMobileOpen,
        setSidebarCollapsed,
        setSidebarMobileOpen,
        toggleSidebar,
        toggleMobileSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
