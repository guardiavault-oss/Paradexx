import { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Bell, Search, Filter, AlertTriangle, Info, AlertCircle, CheckCircle2, X, Settings } from 'lucide-react';
import { api, ThreatsData } from '../lib/api';
import { useApiData } from '../hooks/useApiData';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  network?: string;
  transaction_hash?: string;
}

const alertTypeConfig = {
  critical: {
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20'
  },
  info: {
    icon: Info,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20'
  },
  success: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20'
  }
};

function formatTimeAgo(dateString: string) {
  const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function AlertsCenter() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [threatAlerts, setThreatAlerts] = useState(true);
  const [successAlerts, setSuccessAlerts] = useState(true);
  const [gasAlerts, setGasAlerts] = useState(false);
  const [relayAlerts, setRelayAlerts] = useState(true);

  const unreadCount = alerts.filter(a => !a.read).length;

  const markAsRead = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const markAllAsRead = () => {
    setAlerts(alerts.map(a => ({ ...a, read: true })));
  };

  const dismissAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const filteredAlerts = activeTab === 'all' 
    ? alerts 
    : activeTab === 'unread'
    ? alerts.filter(a => !a.read)
    : alerts.filter(a => a.type === activeTab);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">Total Alerts</p>
              <p className="text-white tracking-tight">{alerts.length}</p>
            </div>
            <Bell className="w-8 h-8 text-gray-600" />
          </div>
        </Card>

        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">Unread</p>
              <p className="text-orange-400 tracking-tight">{unreadCount}</p>
            </div>
            <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-orange-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">Critical</p>
              <p className="text-red-400 tracking-tight">
                {alerts.filter(a => a.type === 'critical').length}
              </p>
            </div>
            <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">Success</p>
              <p className="text-emerald-400 tracking-tight">
                {alerts.filter(a => a.type === 'success').length}
              </p>
            </div>
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-[#1a1a1a] border border-[#2a2a2a]">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-orange-500/20 text-orange-400">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="critical">Critical</TabsTrigger>
            <TabsTrigger value="warning">Warning</TabsTrigger>
            <TabsTrigger value="success">Success</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={markAllAsRead}
              className="border-[#2a2a2a] text-gray-300 hover:bg-[#0f0f0f]"
            >
              Mark All Read
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Alerts List */}
          <div className="lg:col-span-2 space-y-3">
            {filteredAlerts.length === 0 ? (
              <Card className="p-12 bg-[#1a1a1a] border-[#2a2a2a] text-center">
                <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No alerts to display</p>
              </Card>
            ) : (
              filteredAlerts.map((alert) => {
                const config = alertTypeConfig[alert.type] || alertTypeConfig.info;
                const Icon = config.icon;
                
                return (
                  <Card 
                    key={alert.id} 
                    className={`p-6 bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#0f0f0f] transition-colors ${
                      !alert.read ? 'border-l-4 ' + config.borderColor : ''
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="text-white">{alert.title}</h4>
                            {!alert.read && (
                              <div className="w-2 h-2 bg-orange-400 rounded-full" />
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => dismissAlert(alert.id)}
                            className="text-gray-500 hover:text-white -mt-1 -mr-2"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <p className="text-gray-400 text-sm mb-3">{alert.message}</p>

                        <div className="flex items-center gap-3">
                          <span className="text-gray-500 text-xs">{formatTimeAgo(alert.timestamp)}</span>
                          {alert.network && (
                            <Badge variant="secondary" className="bg-[#0f0f0f] text-gray-400 text-xs capitalize">
                              {alert.network}
                            </Badge>
                          )}
                          {!alert.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(alert.id)}
                              className="text-emerald-400 hover:text-emerald-300 text-xs h-auto p-0"
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          {/* Settings Panel */}
          <div>
            <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
              <div className="flex items-center gap-2 mb-6">
                <Settings className="w-5 h-5 text-gray-400" />
                <h3 className="text-white">Notification Settings</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#0f0f0f]">
                  <Label className="text-gray-300 text-sm">Email Notifications</Label>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="border-t border-[#2a2a2a] pt-4 space-y-4">
                  <p className="text-gray-400 text-sm">Alert Types</p>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300 text-sm">Threat Alerts</Label>
                    <Switch
                      checked={threatAlerts}
                      onCheckedChange={setThreatAlerts}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300 text-sm">Success Alerts</Label>
                    <Switch
                      checked={successAlerts}
                      onCheckedChange={setSuccessAlerts}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300 text-sm">Gas Price Alerts</Label>
                    <Switch
                      checked={gasAlerts}
                      onCheckedChange={setGasAlerts}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300 text-sm">Relay Status Alerts</Label>
                    <Switch
                      checked={relayAlerts}
                      onCheckedChange={setRelayAlerts}
                    />
                  </div>
                </div>

                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4">
                  Save Settings
                </Button>
              </div>
            </Card>

            {/* Quick Stats */}
            <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a] mt-6">
              <h4 className="text-white mb-4">Alert Summary (24h)</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Critical</span>
                  <span className="text-red-400">{alerts.filter(a => a.type === 'critical').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Warning</span>
                  <span className="text-orange-400">{alerts.filter(a => a.type === 'warning').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Info</span>
                  <span className="text-cyan-400">{alerts.filter(a => a.type === 'info').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Success</span>
                  <span className="text-emerald-400">{alerts.filter(a => a.type === 'success').length}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  );
}