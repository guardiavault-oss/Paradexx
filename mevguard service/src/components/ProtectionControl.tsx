import { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Shield, Play, Square, Lock, Zap } from 'lucide-react';
import { api } from '../lib/api';
import { useApiData } from '../hooks/useApiData';
import { toast } from 'sonner';

const networks = [
  'ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism', 
  'avalanche', 'fantom', 'base', 'linea', 'scroll', 'starknet'
];

const protectionLevels = [
  { value: 'basic', label: 'Basic', description: '2% slippage, public mempool' },
  { value: 'standard', label: 'Standard', description: '1% slippage, basic detection' },
  { value: 'high', label: 'High', description: '0.5% slippage, private relay' },
  { value: 'maximum', label: 'Maximum', description: '0.1% slippage, all protection' },
  { value: 'enterprise', label: 'Enterprise', description: 'Custom algorithms, dedicated infra' }
];

export function ProtectionControl() {
  const [isActive, setIsActive] = useState(false);
  const [selectedNetworks, setSelectedNetworks] = useState(['ethereum', 'polygon']);
  const [protectionLevel, setProtectionLevel] = useState('high');
  const [slippageTolerance, setSlippageTolerance] = useState([0.5]);
  const [privateMempool, setPrivateMempool] = useState(true);
  const [txHash, setTxHash] = useState('');
  const [gasLimit, setGasLimit] = useState('21000');
  const [maxGasPrice, setMaxGasPrice] = useState('50');

  // Fetch current protection status
  const { data: protectionStatus } = useApiData(
    () => api.getProtectionStatus(),
    {
      autoFetch: true,
      refetchInterval: 5000,
      onSuccess: (data: any) => {
        if (data.is_active !== undefined) setIsActive(data.is_active);
        if (data.protection_level) setProtectionLevel(data.protection_level);
      }
    }
  );

  const toggleNetwork = (network: string) => {
    if (selectedNetworks.includes(network)) {
      setSelectedNetworks(selectedNetworks.filter(n => n !== network));
    } else {
      setSelectedNetworks([...selectedNetworks, network]);
    }
  };

  const handleStartProtection = async () => {
    try {
      await api.startProtection({ 
        network: selectedNetworks[0] || 'ethereum',
        protection_level: protectionLevel 
      });
      setIsActive(true);
      toast.success('Protection started successfully');
    } catch (error) {
      toast.error('Failed to start protection');
      console.error(error);
    }
  };

  const handleStopProtection = async () => {
    try {
      await api.stopProtection();
      setIsActive(false);
      toast.success('Protection stopped successfully');
    } catch (error) {
      toast.error('Failed to stop protection');
      console.error(error);
    }
  };

  const handleProtectTransaction = async () => {
    try {
      await api.protectTransaction({
        transaction_hash: txHash,
        network: 'ethereum',
        protection_level: protectionLevel,
      });
      toast.success('Transaction protected successfully');
      setTxHash('');
    } catch (error) {
      toast.error('Failed to protect transaction');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white mb-2">Protection Control</h3>
            <p className="text-gray-400 text-sm">Manage your MEV protection settings</p>
          </div>
          <Badge 
            className={isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-[#0f0f0f] text-gray-400'}
          >
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={handleStartProtection}
            disabled={isActive}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Protection
          </Button>
          <Button 
            onClick={handleStopProtection}
            disabled={!isActive}
            variant="outline"
            className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10"
          >
            <Square className="w-4 h-4 mr-2" />
            Stop Protection
          </Button>
        </div>
      </Card>

      {/* Tabs for different controls */}
      <Tabs defaultValue="global" className="space-y-6">
        <TabsList className="bg-[#1a1a1a] border border-[#2a2a2a]">
          <TabsTrigger value="global">Global Settings</TabsTrigger>
          <TabsTrigger value="transaction">Protect Transaction</TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="space-y-6">
          {/* Protection Level */}
          <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
            <h4 className="text-white mb-4">Protection Level</h4>
            <Select value={protectionLevel} onValueChange={setProtectionLevel}>
              <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0f0f0f] border-[#2a2a2a]">
                {protectionLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value} className="text-white hover:bg-[#2a2a2a]">
                    <div>
                      <div className="font-medium">{level.label}</div>
                      <div className="text-xs text-gray-400">{level.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Network Selection */}
          <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
            <h4 className="text-white mb-4">Protected Networks</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {networks.map((network) => (
                <Button
                  key={network}
                  variant={selectedNetworks.includes(network) ? 'default' : 'outline'}
                  className={
                    selectedNetworks.includes(network)
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'border-[#2a2a2a] text-gray-400 hover:bg-[#0f0f0f]'
                  }
                  onClick={() => toggleNetwork(network)}
                >
                  {network}
                </Button>
              ))}
            </div>
            <p className="text-gray-500 text-sm mt-4">
              {selectedNetworks.length} networks selected
            </p>
          </Card>

          {/* Advanced Settings */}
          <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
            <h4 className="text-white mb-6">Advanced Settings</h4>
            
            <div className="space-y-6">
              {/* Slippage Tolerance */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-gray-300">Slippage Tolerance</Label>
                  <span className="text-emerald-400">{slippageTolerance[0]}%</span>
                </div>
                <Slider
                  value={slippageTolerance}
                  onValueChange={setSlippageTolerance}
                  min={0.1}
                  max={5}
                  step={0.1}
                  className="[&_[role=slider]]:bg-emerald-500"
                />
                <p className="text-gray-500 text-xs mt-2">
                  Lower tolerance = better protection, higher chance of failed transactions
                </p>
              </div>

              {/* Private Mempool */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-[#0f0f0f]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="w-4 h-4 text-gray-400" />
                    <Label className="text-gray-300">Private Mempool Routing</Label>
                  </div>
                  <p className="text-gray-500 text-xs">
                    Route transactions through private relays (Flashbots, MEV-Share)
                  </p>
                </div>
                <Switch
                  checked={privateMempool}
                  onCheckedChange={setPrivateMempool}
                />
              </div>

              {/* Auto Protection */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-[#0f0f0f]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-gray-400" />
                    <Label className="text-gray-300">Auto-Protection</Label>
                  </div>
                  <p className="text-gray-500 text-xs">
                    Automatically protect all transactions
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="transaction" className="space-y-6">
          <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
            <h4 className="text-white mb-6">Protect Specific Transaction</h4>
            
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Transaction Hash</Label>
                <Input
                  placeholder="0x..."
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  className="bg-[#0f0f0f] border-[#2a2a2a] text-white mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Network</Label>
                  <Select defaultValue="ethereum">
                    <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] text-white mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f0f0f] border-[#2a2a2a]">
                      {networks.map((network) => (
                        <SelectItem key={network} value={network} className="text-white">
                          {network}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-300">Protection Level</Label>
                  <Select defaultValue="high">
                    <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] text-white mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f0f0f] border-[#2a2a2a]">
                      {protectionLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value} className="text-white">
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Gas Limit</Label>
                  <Input
                    type="number"
                    value={gasLimit}
                    onChange={(e) => setGasLimit(e.target.value)}
                    className="bg-[#0f0f0f] border-[#2a2a2a] text-white mt-2"
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Max Gas Price (Gwei)</Label>
                  <Input
                    type="number"
                    value={maxGasPrice}
                    onChange={(e) => setMaxGasPrice(e.target.value)}
                    className="bg-[#0f0f0f] border-[#2a2a2a] text-white mt-2"
                  />
                </div>
              </div>

              <Button
                onClick={handleProtectTransaction}
                className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4"
                disabled={!txHash}
              >
                <Shield className="w-4 h-4 mr-2" />
                Protect Transaction
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}