import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useDebounce } from "@/hooks/useDebounce";
import { useAnnounce, useKeyboardNavigation } from "@/utils/accessibility";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
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
  Search,
  LogOut,
  User,
  HelpCircle,
  FileText,
  Zap,
  Crown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PaletteCommandItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
  badge?: string;
  isDestructive?: boolean;
  isWarning?: boolean;
  isPremium?: boolean;
  description?: string;
}

interface PaletteCommandGroup {
  group: string;
  items: PaletteCommandItem[];
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const announce = useAnnounce();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K to toggle command palette
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      // Escape to close command palette
      if (e.key === "Escape" && open) {
        e.preventDefault();
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const runCommand = useCallback((command: () => void) => {
    onOpenChange(false);
    command();
  }, [onOpenChange]);

  const navigationCommands: PaletteCommandGroup[] = [
    {
      group: "Navigation",
      items: [
        {
          title: "Dashboard",
          icon: LayoutDashboard,
          shortcut: "⌘D",
          action: () => setLocation("/dashboard"),
        },
        {
          title: "Create Vault",
          icon: Plus,
          shortcut: "⌘N",
          action: () => setLocation("/create-vault"),
          badge: "Popular",
        },
        {
          title: "Guardians",
          icon: Users,
          action: () => setLocation("/dashboard/guardians"),
        },
        {
          title: "Beneficiaries",
          icon: Heart,
          action: () => setLocation("/dashboard/beneficiaries"),
        },
        {
          title: "Key Fragments",
          icon: Key,
          action: () => setLocation("/dashboard/fragments"),
          isPremium: true,
        },
        {
          title: "Legacy Messages",
          icon: MessageSquare,
          action: () => setLocation("/dashboard/legacy-messages"),
        },
      ],
    },
    {
      group: "Activity",
      items: [
        {
          title: "Check-Ins",
          icon: Calendar,
          action: () => setLocation("/dashboard/checkins"),
          badge: "1 pending",
        },
        {
          title: "Claims",
          icon: FileCheck,
          action: () => setLocation("/dashboard/claims"),
          badge: "3 new",
        },
        {
          title: "Recover Vault",
          icon: RotateCcw,
          action: () => setLocation("/recover"),
          isWarning: true,
        },
      ],
    },
    {
      group: "Advanced",
      items: [
        {
          title: "Yield Vaults",
          icon: TrendingUp,
          action: () => setLocation("/dashboard/yield-vaults"),
          badge: "12% APY",
          isPremium: true,
        },
        {
          title: "DAO Verification",
          icon: Shield,
          action: () => setLocation("/dashboard/dao-verification"),
        },
      ],
    },
    {
      group: "Account",
      items: [
        {
          title: "Profile Settings",
          icon: User,
          shortcut: "⌘,",
          action: () => setLocation("/dashboard/settings"),
        },
        {
          title: "Help & Documentation",
          icon: HelpCircle,
          shortcut: "⌘?",
          action: () => setLocation("/dashboard/help"),
        },
        {
          title: "Sign Out",
          icon: LogOut,
          shortcut: "⌘Q",
          action: () => {
            // TODO: Implement sign out functionality
            // This will be implemented when auth system is integrated
          },
          isDestructive: true,
        },
      ],
    },
  ];

  const quickActions: PaletteCommandItem[] = [
    {
      title: "Quick Create Vault",
      icon: Zap,
      description: "Start a new vault with default settings",
      action: () => {
        // TODO: Implement quick vault creation
      },
    },
    {
      title: "Generate Recovery Code",
      icon: Key,
      description: "Create a new recovery code for your vault",
      action: () => {
        // TODO: Implement recovery code generation
      },
    },
    {
      title: "Export Vault Data",
      icon: FileText,
      description: "Download your vault configuration",
      action: () => {
        // TODO: Implement vault data export
      },
    },
    {
      title: "Search Documentation",
      icon: Search,
      description: "Search through help articles and guides",
      action: () => {
        // TODO: Implement documentation search
      },
    },
  ];

  // Filter commands based on debounced search
  const allCommands = [
    ...quickActions,
    ...navigationCommands.flatMap(group => group.items),
  ];

  // Filter commands by search query
  const filteredQuickActions = debouncedSearch
    ? quickActions.filter(
        (cmd) =>
          cmd.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          cmd.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : quickActions;

  const filteredNavigationCommands = debouncedSearch
    ? navigationCommands.map(group => ({
        ...group,
        items: group.items.filter(
          (cmd) =>
            cmd.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            cmd.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
        ),
      })).filter(group => group.items.length > 0)
    : navigationCommands;

  const totalFilteredCount = filteredQuickActions.length + 
    filteredNavigationCommands.reduce((sum, group) => sum + group.items.length, 0);

  // Announce search results to screen readers
  useEffect(() => {
    if (debouncedSearch && open) {
      announce(
        totalFilteredCount > 0
          ? `Found ${totalFilteredCount} ${totalFilteredCount === 1 ? 'result' : 'results'} for "${debouncedSearch}"`
          : `No results found for "${debouncedSearch}"`
      );
    }
  }, [debouncedSearch, totalFilteredCount, open, announce]);

  return (
    <CommandDialog 
      open={open} 
      onOpenChange={onOpenChange}
      // Radix Dialog automatically handles focus trapping and Escape key
    >
      <Command className="rounded-lg border shadow-2xl">
        <CommandInput
          placeholder="Type a command or search..."
          value={search}
          onValueChange={setSearch}
          // Auto-focus handled by CommandDialog
          autoFocus
        />
        <CommandList>
          <CommandEmpty>
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">No results found.</p>
              <p className="text-xs text-muted-foreground mt-2">
                Try searching for "vault", "guardian", or "settings"
              </p>
            </div>
          </CommandEmpty>

          {/* Quick Actions */}
          {filteredQuickActions.length > 0 && (
            <CommandGroup heading="Quick Actions">
              {filteredQuickActions.map((action) => {
              const Icon = action.icon;
              return (
                <CommandItem
                  key={action.title}
                  onSelect={() => runCommand(action.action)}
                  className="group"
                >
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span>{action.title}</span>
                      <Badge variant="secondary" className="text-[9px] px-1 py-0">
                        Quick
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {action.description}
                    </p>
                  </div>
                </CommandItem>
              );
            })}
            </CommandGroup>
          )}

          {filteredQuickActions.length > 0 && filteredNavigationCommands.length > 0 && (
            <CommandSeparator />
          )}

          {/* Navigation Commands */}
          {filteredNavigationCommands.map((group) => (
            <CommandGroup key={group.group} heading={group.group}>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.title}
                    onSelect={() => runCommand(item.action)}
                    className={`group ${item.isDestructive ? "text-destructive" : ""} ${
                      item.isWarning ? "text-orange-600" : ""
                    }`}
                  >
                    <Icon
                      className={`mr-2 h-4 w-4 transition-colors ${
                        item.isDestructive
                          ? "text-destructive"
                          : item.isWarning
                          ? "text-orange-600"
                          : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    />
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <Badge
                        variant={
                          item.badge.includes("new") || item.badge.includes("pending")
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-[9px] px-1 py-0 ml-2"
                      >
                        {item.badge}
                      </Badge>
                    )}
                    {item.isPremium && <Crown className="h-3 w-3 text-yellow-500 ml-2" />}
                    {item.shortcut && (
                      <CommandShortcut>{item.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

