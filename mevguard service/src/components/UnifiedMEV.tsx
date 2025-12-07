import { useState } from 'react';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Activity, TrendingUp, DollarSign, Shield } from 'lucide-react';
import { api, MEVMetrics } from '../lib/api';
import { useApiData } from '../hooks/useApiData';
import { PageLoader } from './LoadingStates';

export function UnifiedMEV() {
  const [timePeriod, setTimePeriod] = useState('24h');

  // Fetch MEV metrics
  const { data: mevMetrics, loading } = useApiData<MEVMetrics>(
    () => api.getMEVMetrics({ time_period: timePeriod }),
    {
      autoFetch: true,
      refetchInterval: 10000,
    }
  );

  if (loading) {
    return <PageLoader />;
  }

  const totalProtected = mevMetrics?.transactions_protected || 0;
  const totalSaved = mevMetrics?.total_mev_saved || 0;
  const successRate = mevMetrics?.protection_success_rate || 0;
  const gasSaved = mevMetrics?.gas_cost_saved || 0;

  return (
    <div className="space-y-6">
      {/* Time Period Filter */}
      <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white mb-1">MEV Protection Metrics</h3>
            <p className="text-gray-400 text-sm">Overview of your MEV protection performance</p>
          </div>
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-32 bg-[#0f0f0f] border-[#2a2a2a] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0f0f0f] border-[#2a2a2a]">
              <SelectItem value="1h" className="text-white">1 Hour</SelectItem>
              <SelectItem value="6h" className="text-white">6 Hours</SelectItem>
              <SelectItem value="24h" className="text-white">24 Hours</SelectItem>
              <SelectItem value="7d" className="text-white">7 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-gray-400 text-sm">Transactions Protected</p>
          </div>
          <p className="text-white tracking-tight">{totalProtected.toLocaleString()}</p>
        </Card>

        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-gray-400 text-sm">Total MEV Saved</p>
          </div>
          <p className="text-white tracking-tight">{totalSaved.toFixed(4)} ETH</p>
        </Card>

        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-gray-400 text-sm">Success Rate</p>
          </div>
          <p className="text-white tracking-tight">{successRate.toFixed(2)}%</p>
        </Card>

        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-gray-400 text-sm">Avg MEV/TX</p>
          </div>
          <p className="text-white tracking-tight">{(mevMetrics?.average_mev_per_transaction || 0).toFixed(6)} ETH</p>
        </Card>
      </div>

      {/* Network Breakdown */}
      {mevMetrics?.network_breakdown && (
        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <h3 className="text-white mb-4">Network Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(mevMetrics.network_breakdown).map(([network, value]) => (
              <div key={network} className="p-4 bg-[#0f0f0f] rounded-lg">
                <p className="text-gray-400 text-sm mb-1 capitalize">{network}</p>
                <p className="text-white">{value.toFixed(4)} ETH</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <h3 className="text-white mb-4">Protection Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Successful Protections</span>
              <span className="text-emerald-400">{mevMetrics?.successful_protections?.toLocaleString() || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Failed Protections</span>
              <span className="text-red-400">{mevMetrics?.failed_protections?.toLocaleString() || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Gas Cost Saved</span>
              <span className="text-white">{(gasSaved / 1000000).toFixed(2)}M Gwei</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <h3 className="text-white mb-4">Relay Usage</h3>
          <div className="text-center py-8">
            <p className="text-gray-400">
              {mevMetrics?.relay_usage_stats && Object.keys(mevMetrics.relay_usage_stats).length > 0
                ? 'Relay usage data available'
                : 'No relay usage data available'}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}