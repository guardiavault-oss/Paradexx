// Notification Center Component
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Bell, Check, Trash2, Shield, AlertTriangle, Activity, Settings as SettingsIcon } from 'lucide-react';
import { getTimeAgo } from '../lib/preferences';
import { demoAlerts } from '../lib/demo-data';

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(demoAlerts.slice(0, 20));
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'threat':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'mev':
        return <Activity className="w-4 h-4 text-cyan-400" />;
      case 'system':
        return <SettingsIcon className="w-4 h-4 text-gray-400" />;
      default:
        return <Shield className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 border-red-500/30 text-red-400';
      case 'warning':
        return 'bg-orange-500/20 border-orange-500/30 text-orange-400';
      case 'info':
        return 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400';
      default:
        return 'bg-gray-500/20 border-gray-500/30 text-gray-400';
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative text-gray-400 hover:text-white"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 bg-red-500 text-white border-0 text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-[#0f0f0f] border-[#2a2a2a] w-full sm:w-96 p-0">
        <SheetHeader className="border-b border-[#2a2a2a] p-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-white flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  {unreadCount}
                </Badge>
              )}
            </SheetTitle>
            {notifications.length > 0 && (
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Read all
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear
                  </Button>
              </div>
            )}
          </div>
        </SheetHeader>

        <Tabs defaultValue="all" className="h-[calc(100vh-88px)]">
          <TabsList className="w-full bg-[#1a1a1a] border-b border-[#2a2a2a] rounded-none">
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              Unread
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="h-full overflow-y-auto p-0 m-0">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Bell className="w-12 h-12 text-gray-500 mb-3" />
                <p className="text-gray-400">No notifications</p>
                <p className="text-gray-500 text-sm mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-[#2a2a2a]">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-[#1a1a1a] transition-colors ${
                      !notification.read ? 'bg-emerald-500/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-white text-sm">{notification.title}</p>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-gray-400 text-xs mb-2">{notification.message}</p>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${getSeverityColor(notification.severity)}`}>
                            {notification.severity}
                          </Badge>
                          <span className="text-gray-500 text-xs">
                            {getTimeAgo(notification.timestamp)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                            aria-label="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-400"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="unread" className="h-full overflow-y-auto p-0 m-0">
            {notifications.filter(n => !n.read).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Check className="w-12 h-12 text-emerald-500 mb-3" />
                <p className="text-white">All caught up!</p>
                <p className="text-gray-400 text-sm mt-1">No unread notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-[#2a2a2a]">
                {notifications.filter(n => !n.read).map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 hover:bg-[#1a1a1a] transition-colors bg-emerald-500/5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-white text-sm">{notification.title}</p>
                          <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1" />
                        </div>
                        <p className="text-gray-400 text-xs mb-2">{notification.message}</p>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${getSeverityColor(notification.severity)}`}>
                            {notification.severity}
                          </Badge>
                          <span className="text-gray-500 text-xs">
                            {getTimeAgo(notification.timestamp)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                          aria-label="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-400"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
