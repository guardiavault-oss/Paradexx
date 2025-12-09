import { RestartTourButton } from './OnboardingTour';
import { api } from '../lib/api';
import { toast } from 'sonner@2.0.3';

export function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoProtection, setAutoProtection] = useState(true);
  const [apiKeyRotation, setApiKeyRotation] = useState(false);

  useEffect(() => {
    // Fetch user settings from the API
    api.get('/user/settings')
      .then(response => {
        const settings = response.data;
        setEmailNotifications(settings.emailNotifications);
        setAutoProtection(settings.autoProtection);
        setApiKeyRotation(settings.apiKeyRotation);
      })
      .catch(error => {
        toast.error('Failed to load settings');
      });
  }, []);

  const saveSettings = () => {
    // Save user settings to the API
    api.post('/user/settings', {
      emailNotifications,
      autoProtection,
      apiKeyRotation
    })
    .then(response => {
      toast.success('Settings saved successfully');
    })
    .catch(error => {
      toast.error('Failed to save settings');
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white tracking-tight mb-2">Settings</h2>
          <p className="text-gray-400">Manage your MEVGUARD configuration and preferences</p>
        </div>
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          All changes saved automatically
        </Badge>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="bg-[#1a1a1a] border border-[#2a2a2a]">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="protection">Protection</TabsTrigger>
          <TabsTrigger value="notifications">Alerts</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        {/* Account Settings */}
        <TabsContent value="account" className="space-y-6">
          <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-gray-400" />
              <h3 className="text-white">Profile Information</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Full Name</Label>
                  <Input
                    defaultValue="John Doe"
                    className="bg-[#0f0f0f] border-[#2a2a2a] text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Email Address</Label>
                  <Input
                    type="email"
                    defaultValue="john@example.com"
                    className="bg-[#0f0f0f] border-[#2a2a2a] text-white mt-2"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Company</Label>
                <Input
                  defaultValue="ACME Protocol"
                  className="bg-[#0f0f0f] border-[#2a2a2a] text-white mt-2"
                />
              </div>

              <div>
                <Label className="text-gray-300">Wallet Address</Label>
                <Input
                  defaultValue="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
                  disabled
                  className="bg-[#0f0f0f] border-[#2a2a2a] text-gray-500 mt-2 font-mono"
                />
                <p className="text-gray-500 text-xs mt-2">Connected wallet cannot be changed</p>
              </div>

              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </Card>

          <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
            <div className="flex items-center gap-2 mb-6">
              <SettingsIcon className="w-5 h-5 text-gray-400" />
              <h3 className="text-white">Preferences</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Default Network</Label>
                <Select defaultValue="ethereum">
                  <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] text-white mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f0f0f] border-[#2a2a2a]">
                    <SelectItem value="ethereum" className="text-white">Ethereum</SelectItem>
                    <SelectItem value="polygon" className="text-white">Polygon</SelectItem>
                    <SelectItem value="bsc" className="text-white">BSC</SelectItem>
                    <SelectItem value="arbitrum" className="text-white">Arbitrum</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300">Timezone</Label>
                <Select defaultValue="utc">
                  <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] text-white mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f0f0f] border-[#2a2a2a]">
                    <SelectItem value="utc" className="text-white">UTC</SelectItem>
                    <SelectItem value="est" className="text-white">EST</SelectItem>
                    <SelectItem value="pst" className="text-white">PST</SelectItem>
                    <SelectItem value="cet" className="text-white">CET</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Protection Settings */}
        <TabsContent value="protection" className="space-y-6">
          <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-5 h-5 text-gray-400" />
              <h3 className="text-white">Default Protection Settings</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Default Protection Level</Label>
                <Select defaultValue="high">
                  <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] text-white mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f0f0f] border-[#2a2a2a]">
                    <SelectItem value="basic" className="text-white">Basic</SelectItem>
                    <SelectItem value="standard" className="text-white">Standard</SelectItem>
                    <SelectItem value="high" className="text-white">High</SelectItem>
                    <SelectItem value="maximum" className="text-white">Maximum</SelectItem>
                    <SelectItem value="enterprise" className="text-white">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300">Default Slippage Tolerance (%)</Label>
                <Input
                  type="number"
                  defaultValue="0.5"
                  step="0.1"
                  className="bg-[#0f0f0f] border-[#2a2a2a] text-white mt-2"
                />
              </div>

              <div>
                <Label className="text-gray-300">Max Gas Price (Gwei)</Label>
                <Input
                  type="number"
                  defaultValue="100"
                  className="bg-[#0f0f0f] border-[#2a2a2a] text-white mt-2"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-[#0f0f0f]">
                <div>
                  <Label className="text-gray-300">Auto-Protection</Label>
                  <p className="text-gray-500 text-xs mt-1">
                    Automatically protect all transactions
                  </p>
                </div>
                <Switch
                  checked={autoProtection}
                  onCheckedChange={setAutoProtection}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-[#0f0f0f]">
                <div>
                  <Label className="text-gray-300">Private Mempool by Default</Label>
                  <p className="text-gray-500 text-xs mt-1">
                    Route transactions through private relays
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-[#0f0f0f]">
                <div>
                  <Label className="text-gray-300">Gas Optimization</Label>
                  <p className="text-gray-500 text-xs mt-1">
                    Automatically optimize gas prices
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="w-4 h-4 mr-2" />
                Save Protection Settings
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
            <div className="flex items-center gap-2 mb-6">
              <Bell className="w-5 h-5 text-gray-400" />
              <h3 className="text-white">Notification Preferences</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-[#0f0f0f]">
                <div>
                  <Label className="text-gray-300">Email Notifications</Label>
                  <p className="text-gray-500 text-xs mt-1">
                    Receive updates via email
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-[#0f0f0f]">
                <div>
                  <Label className="text-gray-300">Threat Alerts</Label>
                  <p className="text-gray-500 text-xs mt-1">
                    Notify when threats are detected
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-[#0f0f0f]">
                <div>
                  <Label className="text-gray-300">Protection Success</Label>
                  <p className="text-gray-500 text-xs mt-1">
                    Notify when protection is successful
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-[#0f0f0f]">
                <div>
                  <Label className="text-gray-300">Weekly Summary</Label>
                  <p className="text-gray-500 text-xs mt-1">
                    Receive weekly protection summary
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-[#0f0f0f]">
                <div>
                  <Label className="text-gray-300">System Updates</Label>
                  <p className="text-gray-500 text-xs mt-1">
                    Notify about system updates and maintenance
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="w-4 h-4 mr-2" />
                Save Notification Settings
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Display Settings */}
        <TabsContent value="display" className="space-y-6">
          <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
            <div className="flex items-center gap-2 mb-6">
              <Palette className="w-5 h-5 text-gray-400" />
              <h3 className="text-white">Theme Settings</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Theme</Label>
                <Select defaultValue="dark">
                  <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] text-white mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f0f0f] border-[#2a2a2a]">
                    <SelectItem value="dark" className="text-white">Dark</SelectItem>
                    <SelectItem value="light" className="text-white">Light</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300">Font Size</Label>
                <Select defaultValue="medium">
                  <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] text-white mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f0f0f] border-[#2a2a2a]">
                    <SelectItem value="small" className="text-white">Small</SelectItem>
                    <SelectItem value="medium" className="text-white">Medium</SelectItem>
                    <SelectItem value="large" className="text-white">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
            <div className="flex items-center gap-2 mb-6">
              <Key className="w-5 h-5 text-gray-400" />
              <h3 className="text-white">API Keys</h3>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[#0f0f0f] flex items-center justify-between">
                <div>
                  <p className="text-gray-300">Production API Key</p>
                  <code className="text-xs text-gray-500">mevguard_live_**********************</code>
                </div>
                <Button variant="outline" className="border-[#2a2a2a] text-gray-300 hover:bg-[#0f0f0f]">
                  Regenerate
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-[#0f0f0f]">
                <div>
                  <Label className="text-gray-300">Auto-Rotate API Keys</Label>
                  <p className="text-gray-500 text-xs mt-1">
                    Automatically rotate keys every 90 days
                  </p>
                </div>
                <Switch
                  checked={apiKeyRotation}
                  onCheckedChange={setApiKeyRotation}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-5 h-5 text-gray-400" />
              <h3 className="text-white">Security Options</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-[#0f0f0f]">
                <div>
                  <Label className="text-gray-300">Two-Factor Authentication</Label>
                  <p className="text-gray-500 text-xs mt-1">
                    Add an extra layer of security
                  </p>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400">Enabled</Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-[#0f0f0f]">
                <div>
                  <Label className="text-gray-300">IP Whitelisting</Label>
                  <p className="text-gray-500 text-xs mt-1">
                    Restrict API access to specific IPs
                  </p>
                </div>
                <Switch />
              </div>

              <div>
                <Label className="text-gray-300">Session Timeout (minutes)</Label>
                <Input
                  type="number"
                  defaultValue="60"
                  className="bg-[#0f0f0f] border-[#2a2a2a] text-white mt-2"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-red-500/10 border-red-500/20">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-red-500 mb-2">Danger Zone</h4>
                <p className="text-gray-400 text-sm mb-4">
                  Irreversible actions that will permanently affect your account.
                </p>
                <Button variant="outline" className="border-red-500/50 text-red-500 hover:bg-red-500/10">
                  Delete Account
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing" className="space-y-6">
          <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-gray-400" />
              <h3 className="text-white">Current Plan</h3>
            </div>

            <div className="p-6 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-white mb-1">Business Plan</h4>
                  <p className="text-gray-400 text-sm">Unlimited transactions, all features</p>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400">Active</Badge>
              </div>
              <p className="text-white tracking-tight mb-1">$499/month</p>
              <p className="text-gray-400 text-sm">Billed annually • Renews on Dec 15, 2024</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-[#0f0f0f]">
                <p className="text-gray-400 text-sm mb-1">API Calls This Month</p>
                <p className="text-white">12,847</p>
              </div>
              <div className="p-4 rounded-lg bg-[#0f0f0f]">
                <p className="text-gray-400 text-sm mb-1">Transactions Protected</p>
                <p className="text-white">Unlimited</p>
              </div>
              <div className="p-4 rounded-lg bg-[#0f0f0f]">
                <p className="text-gray-400 text-sm mb-1">Support</p>
                <p className="text-white">Priority</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="border-[#2a2a2a] text-gray-300 hover:bg-[#0f0f0f]">
                View All Plans
              </Button>
              <Button variant="outline" className="border-[#2a2a2a] text-gray-300 hover:bg-[#0f0f0f]">
                Billing History
              </Button>
            </div>
          </Card>

          <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-white">Payment Method</h3>
            </div>

            <div className="p-4 rounded-lg bg-[#0f0f0f] flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-8 bg-[#2a2a2a] rounded flex items-center justify-center text-gray-400 text-xs">
                  VISA
                </div>
                <div>
                  <p className="text-gray-300">•••• •••• •••• 4242</p>
                  <p className="text-gray-500 text-xs">Expires 12/25</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:bg-[#2a2a2a]">
                Edit
              </Button>
            </div>

            <Button variant="outline" className="border-[#2a2a2a] text-gray-300 hover:bg-[#0f0f0f]">
              Add Payment Method
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}