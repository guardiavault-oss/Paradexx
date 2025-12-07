import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  HelpCircle,
  Mail,
  MessageSquare,
  FileText,
  ExternalLink,
  ChevronRight,
  Shield,
  Lock,
  Key,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { EnhancedAppSidebar } from "@/components/EnhancedAppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useWallet } from "@/hooks/useWallet";
import "../design-system.css";

export default function HelpSupport() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useWallet();
  const currentPath = window.location.pathname;
  const isPublicRoute = currentPath === "/support";

  const helpCategories = [
    {
      title: "Getting Started",
      icon: Key,
      description: "Learn the basics of GuardiaVault",
      articles: [
        "How to create your first vault",
        "Connecting your crypto wallet",
        "Setting up guardians",
        "Understanding check-ins",
      ],
    },
    {
      title: "Security",
      icon: Shield,
      description: "Keep your assets protected",
      articles: [
        "How inheritance protection works",
        "Two-factor authentication setup",
        "Best security practices",
        "Recovery process explained",
      ],
    },
    {
      title: "Account Management",
      icon: Lock,
      description: "Manage your GuardiaVault account",
      articles: [
        "Updating profile settings",
        "Managing beneficiaries",
        "Guardian management",
        "Subscription and billing",
      ],
    },
  ];

  // Render main content (shared between public and authenticated routes)
  const renderContent = () => (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Premium Mesh Gradient Background */}
      <div className="mesh-gradient" />
      <div className="noise-overlay" />
      
      {/* Animated Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute right-0 bottom-0 w-96 h-96 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      <div className="relative z-10 container max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {isPublicRoute && !isAuthenticated ? (
            <button
              onClick={() => setLocation("/")}
              className="mb-6 glass px-4 py-2 rounded-xl flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          ) : (
            <button
              onClick={() => setLocation("/dashboard")}
              className="mb-6 glass px-4 py-2 rounded-xl flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          )}
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-5xl font-bold display-font heading-glow mb-3 flex items-center gap-3">
                    <HelpCircle className="w-10 h-10 text-cyan-400" />
                    Help & Support
                  </h1>
                  <p className="text-slate-400 text-lg">
                    Find answers to common questions or get in touch with our support team
                  </p>
                </div>
              </div>
            </motion.div>

        {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="glass-card border-cyan-500/20 hover:border-cyan-500/40 transition-all cursor-pointer group">
                  <CardHeader>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 w-fit mb-3 group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-6 h-6 text-cyan-400" />
                    </div>
                    <CardTitle className="text-white">Live Chat</CardTitle>
                    <CardDescription>
                      Chat with our support team in real-time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full bg-cyan-500 hover:bg-cyan-600">
                      Start Chat
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="glass-card border-cyan-500/20 hover:border-cyan-500/40 transition-all cursor-pointer group">
                  <CardHeader>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 w-fit mb-3 group-hover:scale-110 transition-transform">
                      <Mail className="w-6 h-6 text-purple-400" />
                    </div>
                    <CardTitle className="text-white">Email Support</CardTitle>
                    <CardDescription>
                      Send us an email and we'll respond within 24 hours
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full border-purple-500/30 hover:bg-purple-500/10"
                      onClick={() => window.location.href = "mailto:support@guardiavault.com"}
                    >
                      Send Email
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="glass-card border-cyan-500/20 hover:border-cyan-500/40 transition-all cursor-pointer group">
                  <CardHeader>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 w-fit mb-3 group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6 text-emerald-400" />
                    </div>
                    <CardTitle className="text-white">Documentation</CardTitle>
                    <CardDescription>
                      Browse our comprehensive guides and tutorials
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full border-emerald-500/30 hover:bg-emerald-500/10"
                      onClick={() => {
                        window.open("https://docs.guardiavault.com", "_blank");
                      }}
                    >
                      View Docs
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Help Categories */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-2xl font-bold text-white mb-6">Browse by Category</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {helpCategories.map((category, index) => (
                  <Card
                    key={category.title}
                    className="glass-card border-cyan-500/20 hover:border-cyan-500/40 transition-all"
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                          <category.icon className="w-5 h-5 text-cyan-400" />
                        </div>
                        <CardTitle className="text-white text-lg">{category.title}</CardTitle>
                      </div>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {category.articles.map((article, idx) => (
                          <button
                            key={idx}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white transition-all flex items-center justify-between group"
                          >
                            <span className="text-sm">{article}</span>
                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>

            {/* FAQs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
              <Card className="glass-card border-cyan-500/20">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {[
                      {
                        q: "How does GuardiaVault protect my crypto inheritance?",
                        a: "GuardiaVault uses a decentralized guardian system and smart contracts to ensure your crypto assets are securely passed to your beneficiaries according to your wishes.",
                      },
                      {
                        q: "What happens if I miss a check-in?",
                        a: "If you miss multiple check-ins, your designated guardians will be notified and the recovery process may be initiated based on your vault settings.",
                      },
                      {
                        q: "Can I change my beneficiaries and guardians?",
                        a: "Yes, you can update your beneficiaries and guardians at any time from your vault settings.",
                      },
                    ].map((faq, idx) => (
                      <div key={idx} className="pb-6 border-b border-white/10 last:border-0 last:pb-0">
                        <h3 className="text-lg font-semibold text-white mb-2">{faq.q}</h3>
                        <p className="text-slate-400">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
  );

  // If public route and not authenticated, render without sidebar
  if (isPublicRoute && !isAuthenticated) {
    return renderContent();
  }

  // Authenticated route with sidebar
  return (
    <SidebarProvider>
      <EnhancedAppSidebar />
      <SidebarInset>
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
        </div>
        <DashboardHeader />
        {renderContent()}
      </SidebarInset>
    </SidebarProvider>
  );
}





