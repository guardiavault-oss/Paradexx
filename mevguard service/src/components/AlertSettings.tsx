import { useState } from 'react';
import { Card } from './ui/card';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Bell,
  Mail,
  MessageSquare,
  Volume2,
  Moon,
  DollarSign,
  Shield,
  AlertTriangle,
  TrendingUp,
  Target,
  Check
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface AlertType {
  id: string;
  label: string;
  description: string;
  icon: typeof Bell;
  enabled: boolean;
  threshold?: number;
  thresholdLabel?: string;
}

export function AlertSettings() {
  const [alerts, setAlerts] = useState<AlertType[]>([
    {
      id: 'mev-detected',
      label: 'MEV Attack Detected',
      description: 'Alert when an MEV attack targeting your transactions is detected',
      icon: Target,
      enabled: true,
      threshold: 100,
      thresholdLabel: 'Alert if potential loss > $',
    },
    {
      id: 'protection-success',
      label: 'Protection Successful',
      description: 'Notify when a transaction is successfully protected from MEV',
      icon: Shield,
      enabled: true,
    },
    {
      id: 'protection-failed',
      label: 'Protection Failed',
      description: 'Alert when MEV protection fails for a transaction',
      icon: AlertTriangle,
      enabled: true,
    },
    {
      id: 'gas-spike',
      label: 'High Gas Price Spike',
      description: 'Alert when gas prices exceed your threshold',
      icon: TrendingUp,
      enabled: true,
      threshold: 100,
      thresholdLabel: 'Alert if gas > ',
      thresholdUnit: 'gwei',
    },
    {
      id: 'large-bot',
      label: 'Large MEV Bot Detected',
      description: 'Alert when a large MEV bot is detected in the mempool',
      icon: AlertTriangle,
      enabled: false,
      threshold: 50000,
      thresholdLabel: 'Alert if bot value > $',
    },
    {
      id: 'address-targeted',
      label: 'Your Address Being Targeted',
      description: 'Immediate alert if your address is being targeted by MEV bots',
      icon: Target,
      enabled: true,
    },
    {
      id: 'service-degraded',
      label: 'Protection Service Degraded',
      description: 'Alert when MEV protection service performance is degraded',
      icon: AlertTriangle,
      enabled: true,
    },
  ]);

  const [deliveryMethods, setDeliveryMethods] = useState({
    inApp: true,
    browserPush: false,
    email: false,
    telegram: false,
    discord: false,
  });

  const [preferences, setPreferences] = useState({
    soundEffects: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    frequencyLimit: 5, // max alerts per 5 minutes
    digestMode: false, // daily summary instead of individual alerts
  });

  const [emailAddress, setEmailAddress] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [discordWebhook, setDiscordWebhook] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const toggleAlert = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, enabled: !alert.enabled } : alert
    ));
    setHasChanges(true);
  };

  const updateThreshold = (id: string, value: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, threshold: value } : alert
    ));
    setHasChanges(true);
  };

  const updateDeliveryMethod = (method: keyof typeof deliveryMethods) => {
    setDeliveryMethods(prev => ({ ...prev, [method]: !prev[method] }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Save to preferences
    toast.success('Alert settings saved successfully');
    setHasChanges(false);
  };

  const handleTestAlert = () => {
    toast.success('🎯 Test Alert', {
      description: 'MEV attack detected! Your transaction is being protected.',
    });
  };

  const enabledCount = alerts.filter(a => a.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl mb-1">Alert Settings</h2>
          <p className="text-gray-500 text-sm">
            Configure when and how you want to be notified
          </p>
        </div>
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
          {enabledCount} / {alerts.length} Active
        </Badge>
      </div>

      {/* Alert Types */}
      <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-emerald-400" />
          <h3 className="text-white">Alert Types</h3>
        </div>

        <div className="space-y-4">
          {alerts.map((alert) => {
            const Icon = alert.icon;
            return (
              <div key={alert.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white text-sm">{alert.label}</span>
                        {alert.enabled && (
                          <Check className="w-3 h-3 text-emerald-400" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{alert.description}</p>
                      
                      {/* Threshold Control */}
                      {alert.threshold !== undefined && alert.enabled && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>{alert.thresholdLabel}</span>
                            <Input
                              type="number"
                              value={alert.threshold}
                              onChange={(e) => updateThreshold(alert.id, parseInt(e.target.value) || 0)}
                              className="w-24 h-7 bg-[#0f0f0f] border-[#2a2a2a] text-white text-xs"
                            />
                            {(alert as any).thresholdUnit && (
                              <span>{(alert as any).thresholdUnit}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={alert.enabled}
                    onCheckedChange={() => toggleAlert(alert.id)}
                  />
                </div>
                {alert !== alerts[alerts.length - 1] && (
                  <Separator className="mt-4 bg-[#2a2a2a]" />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Delivery Methods */}
      <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-emerald-400" />
          <h3 className="text-white">Delivery Methods</h3>
        </div>

        <div className="space-y-4">
          {/* In-App */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-white text-sm">In-App Notifications</div>
                <div className="text-xs text-gray-500">Toast notifications within the dashboard</div>
              </div>
            </div>
            <Switch
              checked={deliveryMethods.inApp}
              onCheckedChange={() => updateDeliveryMethod('inApp')}
            />
          </div>

          <Separator className="bg-[#2a2a2a]" />

          {/* Browser Push */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-white text-sm">Browser Push Notifications</div>
                <div className="text-xs text-gray-500">Receive alerts even when tab is inactive</div>
              </div>
            </div>
            <Switch
              checked={deliveryMethods.browserPush}
              onCheckedChange={() => updateDeliveryMethod('browserPush')}
            />
          </div>

          <Separator className="bg-[#2a2a2a]" />

          {/* Email */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-white text-sm">Email Notifications</div>
                  <div className="text-xs text-gray-500">Get alerts via email</div>
                </div>
              </div>
              <Switch
                checked={deliveryMethods.email}
                onCheckedChange={() => updateDeliveryMethod('email')}
              />
            </div>
            {deliveryMethods.email && (
              <Input
                type="email"
                placeholder="your@email.com"
                value={emailAddress}
                onChange={(e) => {
                  setEmailAddress(e.target.value);
                  setHasChanges(true);
                }}
                className="ml-8 mt-2 bg-[#0f0f0f] border-[#2a2a2a] text-white"
              />
            )}
          </div>

          <Separator className="bg-[#2a2a2a]" />

          {/* Telegram */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-white text-sm flex items-center gap-2">
                    Telegram
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                      Enterprise
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">Receive alerts via Telegram bot</div>
                </div>
              </div>
              <Switch
                checked={deliveryMethods.telegram}
                onCheckedChange={() => updateDeliveryMethod('telegram')}
              />
            </div>
            {deliveryMethods.telegram && (
              <Input
                placeholder="@yourusername"
                value={telegramUsername}
                onChange={(e) => {
                  setTelegramUsername(e.target.value);
                  setHasChanges(true);
                }}
                className="ml-8 mt-2 bg-[#0f0f0f] border-[#2a2a2a] text-white"
              />
            )}
          </div>

          <Separator className="bg-[#2a2a2a]" />

          {/* Discord */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-white text-sm flex items-center gap-2">
                    Discord
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                      Enterprise
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">Send alerts to Discord webhook</div>
                </div>
              </div>
              <Switch
                checked={deliveryMethods.discord}
                onCheckedChange={() => updateDeliveryMethod('discord')}
              />
            </div>
            {deliveryMethods.discord && (
              <Input
                placeholder="Discord webhook URL"
                value={discordWebhook}
                onChange={(e) => {
                  setDiscordWebhook(e.target.value);
                  setHasChanges(true);
                }}
                className="ml-8 mt-2 bg-[#0f0f0f] border-[#2a2a2a] text-white font-mono text-xs"
              />
            )}
          </div>
        </div>
      </Card>

      {/* Preferences */}
      <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
        <div className="flex items-center gap-2 mb-4">
          <Volume2 className="w-5 h-5 text-emerald-400" />
          <h3 className="text-white">Alert Preferences</h3>
        </div>

        <div className="space-y-4">
          {/* Sound Effects */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-white text-sm">Sound Effects</div>
                <div className="text-xs text-gray-500">Play sound when alerts are triggered</div>
              </div>
            </div>
            <Switch
              checked={preferences.soundEffects}
              onCheckedChange={(checked) => {
                setPreferences(prev => ({ ...prev, soundEffects: checked }));
                setHasChanges(true);
              }}
            />
          </div>

          <Separator className="bg-[#2a2a2a]" />

          {/* Quiet Hours */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-white text-sm">Quiet Hours / Do Not Disturb</div>
                  <div className="text-xs text-gray-500">Disable non-critical alerts during specified hours</div>
                </div>
              </div>
              <Switch
                checked={preferences.quietHoursEnabled}
                onCheckedChange={(checked) => {
                  setPreferences(prev => ({ ...prev, quietHoursEnabled: checked }));
                  setHasChanges(true);
                }}
              />
            </div>
            {preferences.quietHoursEnabled && (
              <div className="ml-8 flex items-center gap-3">
                <Input
                  type="time"
                  value={preferences.quietHoursStart}
                  onChange={(e) => {
                    setPreferences(prev => ({ ...prev, quietHoursStart: e.target.value }));
                    setHasChanges(true);
                  }}
                  className="bg-[#0f0f0f] border-[#2a2a2a] text-white"
                />
                <span className="text-gray-500">to</span>
                <Input
                  type="time"
                  value={preferences.quietHoursEnd}
                  onChange={(e) => {
                    setPreferences(prev => ({ ...prev, quietHoursEnd: e.target.value }));
                    setHasChanges(true);
                  }}
                  className="bg-[#0f0f0f] border-[#2a2a2a] text-white"
                />
              </div>
            )}
          </div>

          <Separator className="bg-[#2a2a2a]" />

          {/* Frequency Limit */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-white text-sm">Alert Frequency Limit</div>
                <div className="text-xs text-gray-500">Maximum alerts per 5 minutes: {preferences.frequencyLimit}</div>
              </div>
            </div>
            <Slider
              value={[preferences.frequencyLimit]}
              onValueChange={([value]) => {
                setPreferences(prev => ({ ...prev, frequencyLimit: value }));
                setHasChanges(true);
              }}
              max={20}
              min={1}
              step={1}
              className="ml-8"
            />
          </div>

          <Separator className="bg-[#2a2a2a]" />

          {/* Digest Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-white text-sm">Daily Digest Mode</div>
                <div className="text-xs text-gray-500">Receive one daily summary instead of individual alerts</div>
              </div>
            </div>
            <Switch
              checked={preferences.digestMode}
              onCheckedChange={(checked) => {
                setPreferences(prev => ({ ...prev, digestMode: checked }));
                setHasChanges(true);
              }}
            />
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={!hasChanges}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
        >
          <Check className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
        <Button
          variant="outline"
          onClick={handleTestAlert}
          className="border-[#2a2a2a] text-gray-400 hover:text-white"
        >
          <Bell className="w-4 h-4 mr-2" />
          Test Alert
        </Button>
        {hasChanges && (
          <span className="text-xs text-yellow-500">You have unsaved changes</span>
        )}
      </div>
    </div>
  );
}
