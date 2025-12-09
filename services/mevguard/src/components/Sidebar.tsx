import { Shield, Activity, AlertTriangle, History, TrendingUp, Bell, Network, Wifi, Code, Settings as SettingsIcon, LogOut, BarChart3, Server, Database, Target, FlaskConical, Sparkles, Fuel, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const menuItems = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'services', label: 'Services', icon: Server, badge: '3' },
  { id: 'unified', label: 'Unified Dashboard', icon: Database },
  { id: 'live', label: 'Live Monitor', icon: Activity, badge: 'Live' },
  { id: 'control', label: 'Protection', icon: Shield },
  { id: 'threats', label: 'Threats', icon: AlertTriangle, badge: '1543' },
  { id: 'mev', label: 'MEV Detection', icon: Target },
  { id: 'transactions', label: 'Transactions', icon: History },
  { id: 'gas', label: 'Gas Tracker', icon: Fuel },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'alerts', label: 'Alerts', icon: Bell, badge: '3' },
  { id: 'security', label: 'Token Security', icon: Lock },
  { id: 'networks', label: 'Networks', icon: Network },
  { id: 'relays', label: 'Relays', icon: Wifi },
  { id: 'api', label: 'API', icon: Code },
  { id: 'edge-cases', label: 'Edge Cases', icon: FlaskConical, badge: 'Demo' },
  { id: 'settings', label: 'Settings', icon: SettingsIcon }
];

export function Sidebar({ currentPage, onNavigate, onLogout }: SidebarProps) {
  return (
    <aside className="w-64 h-screen bg-[#0f0f0f] border-r border-[#2a2a2a] flex flex-col sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-white tracking-tight">MEVGUARD</h1>
            <p className="text-xs text-gray-500">MEV Protection</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all
                  ${isActive 
                    ? 'bg-emerald-500/10 text-white border border-emerald-500/20' 
                    : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-500' : ''}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <Badge 
                    className={
                      item.badge === 'Live' 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs'
                        : item.badge === 'Demo'
                        ? 'bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs'
                        : 'bg-[#2a2a2a] text-gray-400 border-[#3a3a3a] text-xs'
                    }
                  >
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-[#2a2a2a]">
        <div className="flex items-center gap-3 mb-3 px-3 py-2 rounded-lg bg-[#1a1a1a]">
          <div className="w-8 h-8 bg-[#2a2a2a] rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">John Doe</p>
            <p className="text-gray-500 text-xs truncate">john@example.com</p>
          </div>
        </div>
        <Button
          onClick={onLogout}
          variant="ghost"
          className="w-full justify-start text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </aside>
  );
}