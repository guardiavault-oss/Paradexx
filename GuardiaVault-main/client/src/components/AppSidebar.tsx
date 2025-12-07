import { useLocation, Link } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Settings,
  Users,
  Heart,
  Key,
  Calendar,
  FileCheck,
  MessageSquare,
  Plus,
  RotateCcw,
  Lock,
  TrendingUp,
  Shield,
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { user, logout, isAuthenticated } = useWallet();

  const menuItems = [
    {
      title: "Main",
      items: [
        {
          title: "Dashboard",
          icon: LayoutDashboard,
          href: "/dashboard",
        },
      ],
    },
    {
      title: "Vault Management",
      items: [
        {
          title: "Create Vault",
          icon: Plus,
          href: "/create-vault",
        },
        {
          title: "Guardians",
          icon: Users,
          href: "/dashboard/guardians",
        },
        {
          title: "Beneficiaries",
          icon: Heart,
          href: "/dashboard/beneficiaries",
        },
        {
          title: "Key Fragments",
          icon: Key,
          href: "/dashboard/fragments",
        },
        {
          title: "Legacy Messages",
          icon: MessageSquare,
          href: "/dashboard/legacy-messages",
        },
      ],
    },
    {
      title: "Activity",
      items: [
        {
          title: "Check-Ins",
          icon: Calendar,
          href: "/dashboard/checkins",
        },
        {
          title: "Claims",
          icon: FileCheck,
          href: "/dashboard/claims",
        },
        {
          title: "Recover Vault",
          icon: RotateCcw,
          href: "/recover",
        },
      ],
    },
    {
      title: "Advanced Features",
      items: [
        {
          title: "Yield Vaults",
          icon: TrendingUp,
          href: "/dashboard/yield-vaults",
        },
        {
          title: "DAO Verification",
          icon: Shield,
          href: "/dashboard/dao-verification",
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          title: "Settings",
          icon: Settings,
          href: "/dashboard/settings",
        },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location === "/dashboard";
    }
    return location.startsWith(href);
  };

  return (
    <Sidebar 
      collapsible="icon" 
      className="relative overflow-hidden border-r-2 border-primary/30 shadow-2xl"
      style={{
        background: "linear-gradient(135deg, hsl(var(--sidebar)) 0%, hsl(var(--sidebar) / 0.95) 100%)",
      }}
    >
      {/* Animated Background Effects */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.3), transparent 50%), radial-gradient(circle at 100% 100%, rgba(139, 92, 246, 0.3), transparent 50%)",
          }}
        />
      </div>
      
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      <SidebarHeader className="relative z-10 border-b border-primary/30 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 blur-xl rounded-lg" />
            <Lock className="relative w-7 h-7 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              GuardiaVault
            </span>
            <span className="text-xs text-muted-foreground font-medium">Digital Inheritance</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="relative z-10 px-2 py-4">
        {menuItems.map((group, groupIndex) => (
          <SidebarGroup key={group.title} className={groupIndex > 0 ? "mt-6" : ""}>
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-2">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                        className={`
                          relative group transition-all duration-200
                          ${active 
                            ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-semibold shadow-lg shadow-primary/20 border border-primary/30" 
                            : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                          }
                        `}
                      >
                        <Link href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-md">
                          <div className={`relative transition-transform duration-200 ${active ? "scale-110" : "group-hover:scale-110"}`}>
                            {active && <div className="absolute inset-0 bg-primary/20 blur-md rounded-full" />}
                            <Icon className={`relative w-5 h-5 transition-colors ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                          </div>
                          <span className="font-medium">{item.title}</span>
                          {active && (
                            <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="relative z-10 border-t border-primary/30 p-4 space-y-3 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-xl">
        {isAuthenticated && user?.email && (
          <div className="px-2 py-2 rounded-lg bg-muted/30 border border-border/50">
            <div className="text-xs font-medium text-muted-foreground mb-1">Signed in as</div>
            <div className="text-sm font-semibold text-foreground truncate">{user.email}</div>
          </div>
        )}
        <div className="px-2">
          <WalletConnectButton />
        </div>
        {isAuthenticated && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start hover:bg-destructive/10 hover:text-destructive transition-colors"
            onClick={() => {
              logout();
              setLocation("/");
            }}
          >
            <Lock className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        )}
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  );
}

