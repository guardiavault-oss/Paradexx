import './globals.css'
import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { SidebarProvider } from './contexts/sidebar-context'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import QuickActions from './components/QuickActions'
import ActivityFeed from './components/ActivityFeed'
import KeyboardShortcuts from './components/KeyboardShortcuts'

export const metadata: Metadata = {
  title: 'Wallet Guard - Enterprise Dashboard',
  description: 'Enterprise-grade multi-chain wallet protection and monitoring',
  keywords: 'blockchain, wallet protection, security, monitoring, cryptocurrency, threat detection',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-dark-50 overflow-x-hidden">
        {/* MetaMask-style gradient background */}
        <div className="metamask-bg" />
        
        {/* Subtle grid overlay */}
        <div className="subtle-grid" />

        <SidebarProvider>
          <div className="flex h-screen relative z-10">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden w-full md:w-auto">
              <Header />
              <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 md:p-6 pt-20 sm:pt-24">
                {children}
              </main>
            </div>
          </div>
          
          {/* Global UI Components */}
          <QuickActions />
          <ActivityFeed />
          <KeyboardShortcuts />
        </SidebarProvider>
        
        <Toaster
          position="top-right"
          containerClassName="!top-20 sm:!top-24"
          toastOptions={{
            style: {
              background: 'rgba(20, 20, 32, 0.95)',
              color: '#F5F5F7',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              backdropFilter: 'blur(20px)',
              borderRadius: '12px',
              padding: '14px 18px',
              fontSize: '14px',
              fontWeight: '500',
              maxWidth: '400px',
              boxShadow: '0 10px 40px rgba(139, 92, 246, 0.15)',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#141420',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#141420',
              },
            },
            duration: 4000,
          }}
        />
      </body>
    </html>
  )
}
