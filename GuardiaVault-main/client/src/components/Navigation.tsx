import { useEffect, useRef, useState, memo } from "react";
import { useThrottle } from "@/hooks/useThrottle";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, LayoutDashboard, Settings, LogOut } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// Optimized GSAP import - use optimized imports for better tree-shaking
import { gsap, registerPlugin } from "@/lib/gsap-optimized";

// Note: Navigation doesn't use ScrollTrigger, so we don't need to import/register it

function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const { isAuthenticated, isWalletConnected, user, logout } = useWallet();
  const [location, setLocation] = useLocation();

  const navItems = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  const handleScroll = useThrottle(() => {
    setScrolled(window.scrollY > 50);
  }, 100);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initial check
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (!navRef.current) return;

    try {
      gsap.fromTo(
        navRef.current,
        { y: -100, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
        }
      );
    } catch (error) {
      // Silently fail if GSAP isn't available or has issues
      // Animation failure is non-critical
    }
  }, []);

  return (
    <nav
      ref={navRef}
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] transition-all duration-300",
        scrolled
          ? "bg-slate-950/95 backdrop-blur-xl shadow-xl border-b border-white/10"
          : "bg-slate-950/80 backdrop-blur-md border-b border-white/5"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">

          {/* LEFT: Logo + Navigation Links (Standard layout) */}
          <div className="flex items-center gap-8 flex-1">
            {/* Logo - text only, left aligned, bigger and better font */}
            <Link href="/" className="group -ml-2">
              <span className="text-2xl sm:text-3xl md:text-4xl font-black font-display text-white tracking-tight">
                GuardiaVault
              </span>
            </Link>

            {/* Desktop Navigation - clear hierarchy */}
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-sm font-medium text-slate-300 hover:text-white
                           transition-colors relative group py-2"
                  data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (item.href === "#faq") {
                      document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" });
                    } else {
                      const element = document.querySelector(item.href);
                      element?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                >
                  {item.label}
                  {/* Animated underline */}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r
                               from-blue-400 to-purple-400 transition-all duration-300
                               group-hover:w-full" />
                </a>
              ))}
            </div>
          </div>

          {/* RIGHT: CTAs with clear hierarchy */}
          <div className="flex items-center gap-3">
            {/* Wallet Connect Button - Always visible when wallet is available */}
            <div className="hidden sm:block">
              <WalletConnectButton variant="outline" size="sm" />
            </div>
            
            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/dashboard")}
                  className="hidden sm:flex text-slate-300 hover:text-white hover:bg-white/5 min-h-[44px]"
                  data-testid="button-dashboard"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full min-w-[44px] min-h-[44px]">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                          {user?.email?.substring(0, 2).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      {user?.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setLocation("/dashboard/settings")}>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={async () => {
                        await logout();
                        setLocation("/");
                      }}
                      className="text-destructive focus:text-destructive"
                      data-testid="button-logout"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* Login - subtle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/login")}
                  className="hidden sm:flex text-slate-300 hover:text-white hover:bg-white/5 min-h-[44px]"
                  data-testid="button-login"
                >
                  Log in
                </Button>
                {/* Sign up - prominent */}
                <Button
                  size="sm"
                  onClick={() => setLocation("/signup")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500
                           hover:to-purple-500 text-white font-semibold shadow-lg shadow-blue-500/20
                           min-h-[44px] px-6"
                >
                  Sign up
                </Button>
              </>
            )}

            {/* Mobile menu - right side (standard) */}
            <Button
              size="icon"
              variant="ghost"
              className="md:hidden min-w-[44px] min-h-[44px]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu - improved with active states */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "px-4 py-3 rounded-lg text-base font-medium transition-colors min-h-[44px] flex items-center",
                    location === item.href
                      ? "bg-white/10 text-white"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    if (item.href === "#faq") {
                      document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" });
                    } else {
                      const element = document.querySelector(item.href);
                      element?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                >
                  {item.label}
                </a>
              ))}

              {/* Mobile CTAs */}
              <div className="pt-4 border-t border-white/10 space-y-2">
                {/* Wallet Connect Button - Mobile */}
                <div className="sm:hidden">
                  <WalletConnectButton variant="outline" size="sm" className="w-full" />
                </div>
                
                {isAuthenticated ? (
                  <>
                    <Button
                      variant="default"
                      className="w-full min-h-[44px]"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setLocation("/dashboard");
                      }}
                      data-testid="button-dashboard-mobile"
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full min-h-[44px]"
                      onClick={async () => {
                        setMobileMenuOpen(false);
                        await logout();
                        setLocation("/");
                      }}
                      data-testid="button-logout-mobile"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      className="w-full min-h-[44px]"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setLocation("/login");
                      }}
                      data-testid="button-login-mobile"
                    >
                      Log in
                    </Button>
                    <Button
                      variant="default"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 min-h-[44px]"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setLocation("/signup");
                      }}
                    >
                      Sign up
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default memo(Navigation);
