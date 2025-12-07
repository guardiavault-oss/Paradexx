import { useLocation } from "wouter";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { Bell, Clock, Shield, MessageSquare, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SimpleOptimizedImage } from "@/components/OptimizedImage";

export function DashboardHeader() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useWallet();

  return (
    <header className="relative flex h-16 sm:h-20 shrink-0 items-center border-b border-primary/30 bg-gradient-to-r from-card/80 via-card/70 to-card/80 backdrop-blur-xl px-4 sm:px-6 shadow-lg">
      {/* Animated Background Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.2), transparent 50%), radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.2), transparent 50%)",
          }}
        />
      </div>
      
      {/* Subtle Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "30px 30px",
          }}
        />
      </div>

      {/* Logo - Center - Optimized Size */}
      <div className="absolute left-1/2 transform -translate-x-1/2 z-10 flex items-center">
        <SimpleOptimizedImage
          src="logo"
          alt="GuardiaVault - Secure Your Crypto Inheritance"
          className="h-16 sm:h-20 md:h-24 w-auto transition-all duration-300 hover:scale-105"
          priority
          width={96}
          height={96}
          role="img"
          aria-label="GuardiaVault Logo"
        />
      </div>

      {/* Notifications and Wallet - Right Corner */}
      <div className="relative z-10 flex items-center gap-3 ml-auto">
        {!isAuthenticated && (
          <Button
            variant="default"
            size="sm"
            onClick={() => setLocation("/login")}
            className="glow-primary min-h-[44px]"
          >
            Login
          </Button>
        )}
        
        {/* Notification Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="relative hover:bg-white/10 min-h-[44px] min-w-[44px]"
              aria-label="Notifications"
              aria-describedby="notification-count"
            >
              <Bell className="w-5 h-5" aria-hidden="true" />
              {/* Notification Badge */}
              <Badge 
                id="notification-count"
                className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center bg-red-500 hover:bg-red-500 text-white text-xs px-1.5 rounded-full"
                aria-label="6 unread notifications"
              >
                6
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-slate-900 border border-slate-700/50 backdrop-blur-xl shadow-2xl">
            <DropdownMenuLabel className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Notifications</span>
                <Badge className="bg-red-500 hover:bg-red-500 text-white text-xs">6 New</Badge>
              </div>
            </DropdownMenuLabel>
            
            <div className="max-h-96 overflow-y-auto">
              {/* Check-in Due Notification */}
              <DropdownMenuItem
                onClick={() => setLocation("/dashboard/checkins")}
                className="px-4 py-3 cursor-pointer hover:bg-white/5 focus:bg-white/5 border-b border-white/5"
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/30 shrink-0">
                    <Clock className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">Check-in Due</p>
                    <p className="text-xs text-slate-400 mt-0.5">Your monthly check-in is due in 2 days</p>
                    <p className="text-xs text-slate-500 mt-1">2 hours ago</p>
                  </div>
                </div>
              </DropdownMenuItem>

              {/* New Claim Notification */}
              <DropdownMenuItem
                onClick={() => setLocation("/dashboard/claims")}
                className="px-4 py-3 cursor-pointer hover:bg-white/5 focus:bg-white/5 border-b border-white/5"
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30 shrink-0">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">New Recovery Claim</p>
                    <p className="text-xs text-slate-400 mt-0.5">A guardian has initiated a recovery claim</p>
                    <p className="text-xs text-slate-500 mt-1">5 hours ago</p>
                  </div>
                </div>
              </DropdownMenuItem>

              {/* Guardian Invitation Notification */}
              <DropdownMenuItem
                onClick={() => setLocation("/dashboard/guardians")}
                className="px-4 py-3 cursor-pointer hover:bg-white/5 focus:bg-white/5 border-b border-white/5"
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30 shrink-0">
                    <Shield className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">Guardian Accepted</p>
                    <p className="text-xs text-slate-400 mt-0.5">alice.eth accepted your guardian invitation</p>
                    <p className="text-xs text-slate-500 mt-1">1 day ago</p>
                  </div>
                </div>
              </DropdownMenuItem>

              {/* Legacy Message Notification */}
              <DropdownMenuItem
                onClick={() => setLocation("/dashboard/legacy-messages")}
                className="px-4 py-3 cursor-pointer hover:bg-white/5 focus:bg-white/5 border-b border-white/5"
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30 shrink-0">
                    <MessageSquare className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">Legacy Message Scheduled</p>
                    <p className="text-xs text-slate-400 mt-0.5">Your message to family has been saved</p>
                    <p className="text-xs text-slate-500 mt-1">2 days ago</p>
                  </div>
                </div>
              </DropdownMenuItem>

              {/* Yield Vault Notification */}
              <DropdownMenuItem
                onClick={() => setLocation("/dashboard/yield-vaults")}
                className="px-4 py-3 cursor-pointer hover:bg-white/5 focus:bg-white/5 border-b border-white/5"
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 shrink-0">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">Yield Earned</p>
                    <p className="text-xs text-slate-400 mt-0.5">Your vault earned 0.025 ETH this week</p>
                    <p className="text-xs text-slate-500 mt-1">3 days ago</p>
                  </div>
                </div>
              </DropdownMenuItem>

              {/* Security Update Notification */}
              <DropdownMenuItem
                onClick={() => setLocation("/dashboard/settings")}
                className="px-4 py-3 cursor-pointer hover:bg-white/5 focus:bg-white/5"
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30 shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">Security Update</p>
                    <p className="text-xs text-slate-400 mt-0.5">Two-factor authentication enabled successfully</p>
                    <p className="text-xs text-slate-500 mt-1">1 week ago</p>
                  </div>
                </div>
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="bg-white/10" />
            
            <div className="px-4 py-3">
              <Button 
                variant="ghost" 
                className="w-full text-sm text-slate-400 hover:text-white hover:bg-white/5"
                onClick={() => setLocation("/dashboard/settings")}
              >
                View All Notifications
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <WalletConnectButton variant="outline" size="sm" />
      </div>
    </header>
  );
}

