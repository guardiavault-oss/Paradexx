'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

interface BreadcrumbItem {
  label: string
  href?: string
}

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/wallets': 'Wallets',
  '/threats': 'Threats',
  '/transactions': 'Transactions',
  '/analytics': 'Analytics',
  '/address-book': 'Address Book',
  '/audit-logs': 'Audit Logs',
  '/security-rules': 'Security Rules',
  '/phishing': 'Phishing Protection',
  '/reputation': 'Address Reputation',
  '/settings': 'Settings',
}

export default function Breadcrumbs() {
  const pathname = usePathname()
  
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/' }]
    
    let currentPath = ''
    paths.forEach((path, index) => {
      currentPath += `/${path}`
      
      // Check if it's a dynamic route (ID)
      if (/^[a-f0-9-]+$/i.test(path) && paths[index - 1]) {
        // It's likely an ID, use previous path label
        const parentLabel = routeLabels[`/${paths[index - 1]}`] || paths[index - 1]
        breadcrumbs.push({
          label: `${parentLabel} Details`,
          href: currentPath,
        })
      } else {
        breadcrumbs.push({
          label: routeLabels[currentPath] || path.charAt(0).toUpperCase() + path.slice(1),
          href: currentPath,
        })
      }
    })
    
    return breadcrumbs
  }
  
  const breadcrumbs = generateBreadcrumbs()
  
  if (breadcrumbs.length <= 1) return null
  
  return (
    <nav className="flex items-center gap-2 text-sm mb-4" aria-label="Breadcrumb">
      <ol className="flex items-center gap-2">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1
          
          return (
            <li key={crumb.href || index} className="flex items-center gap-2">
              {index === 0 ? (
                <Link
                  href={crumb.href || '/'}
                  className="flex items-center gap-1 text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  <Home className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                  {isLast ? (
                    <span className="text-white font-medium">{crumb.label}</span>
                  ) : (
                    <Link
                      href={crumb.href || '#'}
                      className="text-gray-400 hover:text-cyan-400 transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

