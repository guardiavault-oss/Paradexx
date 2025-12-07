import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Settings, Wallet, Shield, Zap, Bell, Moon, Sun,
  ChevronRight, Plus, Trash2, Edit, Copy, Check,
  RefreshCw, ExternalLink, Lock, Globe, Gauge, Info
} from 'lucide-react';
import {
  MobileContainer, PageHeader, Section, Card, Button, Input,
  Select, Toggle, Badge, Alert, Tabs, cn, Divider, ListItem
} from '../components/ui';
import { useAppStore } from '../store/appStore';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { wallets, status, toggleSystem } = useAppStore();
  
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
  // Settings state
  const [autoSnipe, setAutoSnipe] = useState(status.autoSnipe);
  const [flashbotsEnabled, setFlashbotsEnabled] = useState(true);
  const [safetyChecks, setSafetyChecks] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [whaleAlerts, setWhaleAlerts] = useState(true);
  
  // Trading defaults
  const [defaultSlippage, setDefaultSlippage] = useState('10');
  const [defaultGasMultiplier, setDefaultGasMultiplier] = useState('1.5');
  const [maxGasPrice, setMaxGasPrice] = useState('150');
  const [minLiquidity, setMinLiquidity] = useState('10000');
  
  // Take profit/Stop loss defaults
  const [defaultTP1, setDefaultTP1] = useState('50');
  const [defaultTP2, setDefaultTP2] = useState('100');
  const [defaultTP3, setDefaultTP3] = useState('200');
  const [defaultSL, setDefaultSL] = useState('30');
  const [trailingStopEnabled, setTrailingStopEnabled] = useState(true);
  const [trailingStopPercent, setTrailingStopPercent] = useState('20');
  
  // Theme
  const [darkMode, setDarkMode] = useState(true);
  
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Save settings to localStorage or API
    const settings = {
      autoSnipe,
      flashbotsEnabled,
      safetyChecks,
      notifications,
      whaleAlerts,
      defaultSlippage,
      defaultGasMultiplier,
      maxGasPrice,
      minLiquidity,
      defaultTP1,
      defaultTP2,
      defaultTP3,
      defaultSL,
      trailingStopEnabled,
      trailingStopPercent,
      darkMode,
    };
    
    localStorage.setItem('apex-settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('apex-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setAutoSnipe(settings.autoSnipe ?? status.autoSnipe);
      setFlashbotsEnabled(settings.flashbotsEnabled ?? true);
      setSafetyChecks(settings.safetyChecks ?? true);
      setNotifications(settings.notifications ?? true);
      setWhaleAlerts(settings.whaleAlerts ?? true);
      setDefaultSlippage(settings.defaultSlippage ?? '10');
      setDefaultGasMultiplier(settings.defaultGasMultiplier ?? '1.5');
      setMaxGasPrice(settings.maxGasPrice ?? '150');
      setMinLiquidity(settings.minLiquidity ?? '10000');
      setDefaultTP1(settings.defaultTP1 ?? '50');
      setDefaultTP2(settings.defaultTP2 ?? '100');
      setDefaultTP3(settings.defaultTP3 ?? '200');
      setDefaultSL(settings.defaultSL ?? '30');
      setTrailingStopEnabled(settings.trailingStopEnabled ?? true);
      setTrailingStopPercent(settings.trailingStopPercent ?? '20');
    }
  }, []);

  return (
    <MobileContainer>
      <PageHeader 
        title="Settings" 
        subtitle="Configure your trading preferences"
      />

      {/* Save Success */}
      {saved && (
        <Section>
          <Alert type="success" title="Settings Saved" />
        </Section>
      )}

      {/* System Control */}
      <Section title="System">
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                status.running ? 'bg-accent-green/10' : 'bg-dark-700'
              )}>
                <Zap className={status.running ? 'text-accent-green' : 'text-dark-500'} size={20} />
              </div>
              <div>
                <p className="text-white font-medium">Sniper Status</p>
                <p className="text-dark-400 text-sm">
                  {status.running ? 'System is active' : 'System is stopped'}
                </p>
              </div>
            </div>
            <Button
              variant={status.running ? 'danger' : 'success'}
              size="sm"
              onClick={toggleSystem}
            >
              {status.running ? 'Stop' : 'Start'}
            </Button>
          </div>
          <Divider />
          <Toggle
            value={autoSnipe}
            onChange={setAutoSnipe}
            label="Auto-Snipe"
            description="Automatically execute snipes when conditions are met"
          />
        </Card>
      </Section>

      {/* Wallets */}
      <Section 
        title="Wallets"
        action={
          <button className="text-accent-cyan text-sm flex items-center gap-1">
            <Plus size={16} /> Add
          </button>
        }
      >
        <Card>
          {wallets.length === 0 ? (
            <div className="p-6 text-center">
              <Wallet className="mx-auto mb-3 text-dark-600" size={32} />
              <p className="text-dark-400">No wallets configured</p>
              <Button variant="secondary" size="sm" className="mt-3">
                <Plus size={16} /> Add Wallet
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-dark-800">
              {wallets.map((wallet) => (
                <ListItem
                  key={wallet.id}
                  title={wallet.name}
                  subtitle={`${wallet.address.slice(0, 8)}...${wallet.address.slice(-6)}`}
                  leading={
                    <div className="w-10 h-10 rounded-full bg-accent-purple/10 flex items-center justify-center">
                      <Wallet className="text-accent-purple" size={18} />
                    </div>
                  }
                  trailing={
                    <span className="text-dark-400 text-sm">{wallet.ethBalance} ETH</span>
                  }
                />
              ))}
            </div>
          )}
        </Card>
      </Section>

      {/* Trading Settings */}
      <Section title="Trading Defaults">
        <Card className="p-4 space-y-4">
          <Input
            value={defaultSlippage}
            onChange={setDefaultSlippage}
            type="number"
            label="Default Slippage (%)"
            helper="Recommended: 10-15% for new tokens"
          />
          <Input
            value={defaultGasMultiplier}
            onChange={setDefaultGasMultiplier}
            type="number"
            label="Gas Multiplier"
            helper="Higher values = faster execution, more gas cost"
          />
          <Input
            value={maxGasPrice}
            onChange={setMaxGasPrice}
            type="number"
            label="Max Gas Price (Gwei)"
            helper="Maximum gas you're willing to pay"
          />
          <Input
            value={minLiquidity}
            onChange={setMinLiquidity}
            type="number"
            label="Minimum Liquidity ($)"
            helper="Minimum liquidity required to trade"
          />
        </Card>
      </Section>

      {/* Safety Settings */}
      <Section title="Safety">
        <Card className="p-4 space-y-4">
          <Toggle
            value={safetyChecks}
            onChange={setSafetyChecks}
            label="Safety Checks"
            description="Run honeypot detection before buying"
          />
          <Divider />
          <Toggle
            value={flashbotsEnabled}
            onChange={setFlashbotsEnabled}
            label="Flashbots Protection"
            description="Protect against frontrunning attacks"
          />
        </Card>
      </Section>

      {/* Position Management */}
      <Section title="Position Management">
        <Card className="p-4 space-y-4">
          <p className="text-dark-400 text-sm mb-2">Default Take Profit Targets (%)</p>
          <div className="grid grid-cols-3 gap-3">
            <Input
              value={defaultTP1}
              onChange={setDefaultTP1}
              type="number"
              label="TP 1"
            />
            <Input
              value={defaultTP2}
              onChange={setDefaultTP2}
              type="number"
              label="TP 2"
            />
            <Input
              value={defaultTP3}
              onChange={setDefaultTP3}
              type="number"
              label="TP 3"
            />
          </div>
          <Input
            value={defaultSL}
            onChange={setDefaultSL}
            type="number"
            label="Default Stop Loss (%)"
          />
          <Divider />
          <Toggle
            value={trailingStopEnabled}
            onChange={setTrailingStopEnabled}
            label="Trailing Stop"
            description="Automatically adjust stop loss as price increases"
          />
          {trailingStopEnabled && (
            <Input
              value={trailingStopPercent}
              onChange={setTrailingStopPercent}
              type="number"
              label="Trailing Stop Distance (%)"
            />
          )}
        </Card>
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <Card className="p-4 space-y-4">
          <Toggle
            value={notifications}
            onChange={setNotifications}
            label="Push Notifications"
            description="Receive alerts for trades and position updates"
          />
          <Divider />
          <Toggle
            value={whaleAlerts}
            onChange={setWhaleAlerts}
            label="Whale Alerts"
            description="Get notified when tracked wallets trade"
          />
        </Card>
      </Section>

      {/* Advanced */}
      <Section title="Advanced">
        <Card>
          <ListItem
            title="Network Settings"
            subtitle="RPC endpoints and chain configuration"
            leading={<Globe className="text-dark-400" size={20} />}
            onClick={() => {}}
          />
          <Divider className="mx-4" />
          <ListItem
            title="Gas Presets"
            subtitle="Configure gas strategies for different scenarios"
            leading={<Gauge className="text-dark-400" size={20} />}
            onClick={() => {}}
          />
          <Divider className="mx-4" />
          <ListItem
            title="Export Data"
            subtitle="Download your trading history"
            leading={<ExternalLink className="text-dark-400" size={20} />}
            onClick={() => {}}
          />
        </Card>
      </Section>

      {/* About */}
      <Section title="About">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
              <Zap className="text-white" size={24} />
            </div>
            <div>
              <p className="text-white font-semibold">APEX Sniper</p>
              <p className="text-dark-400 text-sm">Version 2.0.0</p>
            </div>
          </div>
          <Divider className="my-4" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-dark-400">Build</span>
              <span className="text-dark-300">2024.12.01</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Network</span>
              <span className="text-dark-300">Ethereum Mainnet</span>
            </div>
          </div>
        </Card>
      </Section>

      {/* Save Button */}
      <Section>
        <Button
          variant="primary"
          size="xl"
          fullWidth
          onClick={handleSave}
        >
          {saved ? <Check size={20} /> : <Settings size={20} />}
          {saved ? 'Saved!' : 'Save Settings'}
        </Button>
      </Section>

      {/* Disclaimer */}
      <Section>
        <div className="text-center text-dark-500 text-xs px-4 pb-8">
          <p>Trading cryptocurrencies involves substantial risk.</p>
          <p className="mt-1">Only trade with funds you can afford to lose.</p>
        </div>
      </Section>
    </MobileContainer>
  );
};

export default SettingsPage;
