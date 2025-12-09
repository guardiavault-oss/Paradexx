// Mobile Navigation Menu
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Menu, 
  Shield, 
  LayoutDashboard, 
  Activity, 
  AlertTriangle,
  Search,
  BarChart3,
  Bell,
  Network,
  Radio,
  Code,
  Settings,
  Server,
  Database,
  FileText,
  Target,
  FlaskConical,
  LogOut
} from 'lucide-react';

interface MobileMenuProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const menuItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'services', label: 'Services', icon: Server },
  { id: 'unified', label: 'Unified Dashboard', icon: Database },
  { id: 'live', label: 'Live Monitor', icon: Activity },
  { id: 'protection', label: 'Protection Control', icon: Shield },
  { id: 'threats', label: 'Threats', icon: AlertTriangle },
  { id: 'mev', label: 'MEV Detection', icon: Target },
  { id: 'transactions', label: 'Transactions', icon: FileText },
  { id: 'enhanced-tx', label: 'Enhanced TX', icon: Search },
  { id: 'unified-mev', label: 'Unified MEV', icon: Database },
  { id: 'threat-intel', label: 'Threat Intel', icon: AlertTriangle },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'networks', label: 'Networks', icon: Network },
  { id: 'relays', label: 'Relays', icon: Radio },
  { id: 'api', label: 'API Integration', icon: Code },
  { id: 'edge-cases', label: 'Edge Cases', icon: FlaskConical },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function MobileMenu({ currentPage, onNavigate, onLogout }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="md:hidden text-gray-400 hover:text-white"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="bg-[#0f0f0f] border-[#2a2a2a] w-72 p-0">
        <SheetHeader className="border-b border-[#2a2a2a] p-6">
          <SheetTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-500" />
            <span className="text-white">MEVGUARD</span>
          </SheetTitle>
        </SheetHeader>
        
        <nav className="flex flex-col h-[calc(100vh-80px)]">
          <div className="flex-1 overflow-y-auto py-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-6 py-3 transition-colors ${
                    isActive
                      ? 'bg-emerald-500/10 border-r-2 border-emerald-500 text-emerald-500'
                      : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                  {item.id === 'alerts' && (
                    <Badge className="ml-auto bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                      5
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-[#2a2a2a] p-4">
            <Button
              onClick={() => {
                onLogout();
                setOpen(false);
              }}
              variant="outline"
              className="w-full border-[#2a2a2a] text-gray-400 hover:bg-[#1a1a1a] hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}