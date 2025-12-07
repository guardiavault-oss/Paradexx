import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { EnhancedAppSidebar } from "@/components/EnhancedAppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import "../design-system.css";

interface PremiumPageLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backButtonText?: string;
  backButtonPath?: string;
  customHeader?: ReactNode;
  orbConfig?: {
    color1?: string;
    color2?: string;
    animate1?: any;
    animate2?: any;
  };
}

export function PremiumPageLayout({
  children,
  title,
  subtitle,
  showBackButton = true,
  backButtonText = "Back to Dashboard",
  backButtonPath = "/dashboard",
  customHeader,
  orbConfig = {},
}: PremiumPageLayoutProps) {
  const [, setLocation] = useLocation();

  const {
    color1 = "rgba(59, 130, 246, 0.15)",
    color2 = "rgba(34, 197, 94, 0.15)",
    animate1 = { x: [0, 100, 0], y: [0, -100, 0] },
    animate2 = { x: [0, -100, 0], y: [0, 100, 0] },
  } = orbConfig;

  return (
    <SidebarProvider>
      <EnhancedAppSidebar />
      <SidebarInset>
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
        </div>
        <DashboardHeader />
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          {/* Premium Mesh Gradient Background */}
          <div className="mesh-gradient" />
          <div className="noise-overlay" />
          
          {/* Animated Orbs */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute top-20 left-20 w-96 h-96 rounded-full"
              style={{
                background: `radial-gradient(circle, ${color1} 0%, transparent 70%)`,
                filter: "blur(40px)",
              }}
              animate={animate1}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <motion.div
              className="absolute right-0 bottom-0 w-96 h-96 rounded-full"
              style={{
                background: `radial-gradient(circle, ${color2} 0%, transparent 70%)`,
                filter: "blur(40px)",
              }}
              animate={animate2}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>

          <div className="relative z-10 container max-w-6xl mx-auto px-6 py-8">
            {/* Header */}
            {(showBackButton || title || subtitle || customHeader) && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                {showBackButton && (
                  <button
                    onClick={() => setLocation(backButtonPath)}
                    className="mb-6 glass px-4 py-2 rounded-xl flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {backButtonText}
                  </button>
                )}
                
                {customHeader ? (
                  customHeader
                ) : (
                  title && (
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h1 className="text-5xl font-bold display-font heading-glow mb-3">
                          {title}
                        </h1>
                        {subtitle && (
                          <p className="text-slate-400 text-lg">
                            {subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                )}
              </motion.div>
            )}

            {/* Main Content */}
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
