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
  FileText,
  MessageSquare,
  Plus,
  Lock,
  TrendingUp,
  Crown,
  HelpCircle,
  User,
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function EnhancedAppSidebar() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useWallet();

  // REORGANIZED menu items - reduced from 21 to 13 items with better grouping
  const menuItems = [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          icon: LayoutDashboard,
          href: "/dashboard",
        },
        {
          title: "Yield Vaults",
          icon: TrendingUp,
          href: "/dashboard/yield-vaults",
          badge: "5.2% APY",
        },
      ],
    },
    {
      title: "Inheritance Protection",
      items: [
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
          title: "Legacy Messages",
          icon: MessageSquare,
          href: "/dashboard/legacy-messages",
        },
        {
          title: "Smart Will",
          icon: FileText,
          href: "/dashboard/smart-will",
        },
      ],
    },
    {
      title: "Account Activity",
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
          title: "Key Fragments",
          icon: Key,
          href: "/dashboard/fragments",
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
    <TooltipProvider>
      <Sidebar
        collapsible="icon"
        className="border-r border-white/5 bg-slate-900/50 backdrop-blur-xl"
      >
        <SidebarHeader className="border-b border-white/5 bg-slate-900/30">
          <div className="px-4 py-4">
            {/* User Profile - simplified */}
            {user?.email && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start p-2 hover:bg-white/5 group-data-[collapsible=icon]:justify-center">
                    <div className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center">
                      <Avatar className="w-9 h-9 ring-2 ring-primary/20 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-sm">
                          {user.email.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left min-w-0 group-data-[collapsible=icon]:hidden">
                        <div className="text-sm font-medium text-white truncate">{user.email}</div>
                        <div className="text-xs text-slate-400">Premium Plan</div>
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation("/dashboard/settings")}>
                    <User className="w-4 h-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade Plan
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/dashboard/support")}>
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Help & Support
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => {
                      logout();
                      setLocation("/");
                    }}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Quick Actions - NEW, replacing search and vault health */}
            <div className="mt-4 space-y-2 group-data-[collapsible=icon]:hidden">
              <Button
                size="sm"
                className="w-full justify-start bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 h-10"
                onClick={() => setLocation("/create-vault")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Vault
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start h-10"
                onClick={() => setLocation("/dashboard/yield-vaults")}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Start Earning 5.2%
              </Button>
            </div>
          </div>
        </SidebarHeader>
        
        <SidebarContent className="px-2 py-4">
          {menuItems.map((group, groupIndex) => (
            <SidebarGroup key={group.title} className={groupIndex > 0 ? "mt-6" : ""}>
              <SidebarGroupLabel className="px-3 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {group.title}
              </SidebarGroupLabel>

              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                      <SidebarMenuItem key={item.title}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton
                              asChild
                              isActive={active}
                              tooltip={item.title}
                              className={cn(
                                "h-11 px-3 rounded-lg transition-colors",
                                active
                                  ? "bg-primary/15 text-white font-medium border-l-2 border-primary"
                                  : "text-slate-300 hover:bg-white/5 hover:text-white"
                              )}
                            >
                              <Link href={item.href} className="flex items-center gap-3">
                                <Icon className="w-5 h-5 shrink-0 group-data-[collapsible=icon]:w-6 group-data-[collapsible=icon]:h-6" />
                                <span className="flex-1 group-data-[collapsible=icon]:hidden">{item.title}</span>
                                {/* Only show badge on active items */}
                                {item.badge && active && (
                                  <Badge variant="secondary" className="text-xs group-data-[collapsible=icon]:hidden">
                                    {item.badge}
                                  </Badge>
                                )}
                              </Link>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="text-xs">
                            <div className="font-semibold">{item.title}</div>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="border-t border-white/5 p-4">
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => setLocation("/dashboard/settings")}
            >
              <Settings className="w-4 h-4 mr-2" />
              <span className="group-data-[collapsible=icon]:hidden">Settings</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => setLocation("/dashboard/support")}
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              <span className="group-data-[collapsible=icon]:hidden">Help & Support</span>
            </Button>
          </div>
        </SidebarFooter>
        
        <SidebarRail />
      </Sidebar>
    </TooltipProvider>
  );
}
