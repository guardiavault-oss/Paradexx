import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { WalletConnection, useWallet } from './WalletConnection';
import { GasTracker } from './GasTracker';
import { EnhancedTransactionHistory } from './EnhancedTransactionHistory';
import { AlertSettings } from './AlertSettings';
import { 
  Wallet, 
  Fuel, 
  History, 
  Bell,
  CheckCircle
} from 'lucide-react';

export function FeatureShowcase() {
  const { wallet, connect, disconnect, switchNetwork } = useWallet();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl mb-2">Complete Feature Set</h1>
          <p className="text-gray-400">
            All production-ready features for professional MEV protection
          </p>
        </div>
        <WalletConnection
          wallet={wallet}
          onConnect={connect}
          onDisconnect={disconnect}
          onSwitchNetwork={switchNetwork}
          requiredChainId={1}
          showBalance={true}
        />
      </div>

      {/* Feature Completion Status */}
      <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
        <h3 className="text-white mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          Implementation Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { category: 'Real-Time Data', features: ['WebSocket Manager', 'Connection Status', 'Event Deduplication', 'Backfill Support', 'Stale Detection'], complete: 5, total: 5 },
            { category: 'MEV Detection', features: ['Confidence Scores', 'Attack Diagrams', 'Profit Calculations', 'False Positive Reporting', '6 Attack Types'], complete: 5, total: 5 },
            { category: 'Transaction Management', features: ['State Transitions', 'Virtual Scrolling', 'Advanced Filters', 'CSV Export', 'Search'], complete: 5, total: 5 },
            { category: 'Wallet Integration', features: ['Multi-Wallet Support', 'ENS Names', 'Network Switching', 'Balance Display', 'Auto-Reconnect'], complete: 5, total: 5 },
            { category: 'Gas Management', features: ['Real-Time Prices', 'EIP-1559 Breakdown', 'Recommendations', 'History Charts', 'Savings Tracking'], complete: 5, total: 5 },
            { category: 'Alerts & Notifications', features: ['7 Alert Types', 'Multiple Delivery Methods', 'Quiet Hours', 'Frequency Limits', 'Test Alerts'], complete: 5, total: 5 },
          ].map((item) => (
            <Card key={item.category} className="p-4 bg-[#0f0f0f] border-[#2a2a2a]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white text-sm">{item.category}</h4>
                <Badge 
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                >
                  {item.complete}/{item.total}
                </Badge>
              </div>
              <div className="space-y-1">
                {item.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-xs text-gray-400">
                    <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Feature Tabs */}
      <Tabs defaultValue="gas" className="space-y-4">
        <TabsList className="bg-[#1a1a1a] border border-[#2a2a2a]">
          <TabsTrigger value="gas" className="flex items-center gap-2">
            <Fuel className="w-4 h-4" />
            Gas Tracker
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Transaction History
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Alert Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gas">
          <GasTracker />
        </TabsContent>

        <TabsContent value="history">
          <EnhancedTransactionHistory />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertSettings />
        </TabsContent>
      </Tabs>

      {/* Quick Wins Implemented */}
      <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
        <h3 className="text-white mb-4">Quick Wins Implemented</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {[
            'Copy-to-clipboard with toast confirmation',
            'Keyboard shortcuts (Ctrl/Cmd + K)',
            'Smooth number animations (odometer effect)',
            'Loading skeletons instead of spinners',
            'Hover cards with previews',
            'Auto-save draft settings',
            'Sound effects (optional)',
            'Smart address truncation',
            'Virtual scrolling for performance',
            'Debounced search (300ms)',
            'Tab pause/resume for WebSocket',
            'Network status detection',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-gray-400">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Performance Optimizations */}
      <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
        <h3 className="text-white mb-4">Performance Optimizations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h4 className="text-emerald-400 text-sm">Rendering</h4>
            <div className="space-y-1 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                Virtual scrolling
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                Lazy loading
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                React.memo usage
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                Debounced search
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-emerald-400 text-sm">Data Management</h4>
            <div className="space-y-1 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                Event deduplication
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                Memory cleanup
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                LocalStorage caching
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                Pagination
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-emerald-400 text-sm">Network</h4>
            <div className="space-y-1 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                WebSocket pooling
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                Backfill requests
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                Tab visibility detection
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                Exponential backoff
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
