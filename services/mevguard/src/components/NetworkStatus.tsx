import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { api, NetworksData } from '../lib/api';
import { useApiData } from '../hooks/useApiData';
import { PageLoader } from './LoadingStates';

interface NetworkData {
  threats: number;
  protected: number;
  status: string;
}

interface NetworkStatusProps {
  networks: Record<string, NetworkData>;
  detailed?: boolean;
}

const networkDisplayNames: Record<string, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  bsc: 'BSC',
  arbitrum: 'Arbitrum',
  optimism: 'Optimism',
  base: 'Base',
  avalanche: 'Avalanche',
  fantom: 'Fantom'
};

const networkColors: Record<string, string> = {
  ethereum: 'bg-blue-500',
  polygon: 'bg-purple-500',
  bsc: 'bg-yellow-500',
  arbitrum: 'bg-cyan-500',
  optimism: 'bg-red-500',
  base: 'bg-blue-600',
  avalanche: 'bg-red-600',
  fantom: 'bg-blue-400'
};

export function NetworkStatus({ networks, detailed = false }: NetworkStatusProps) {
  if (detailed) {
    // Detailed view for individual network card
    const [networkName, networkData] = Object.entries(networks)[0];
    return (
      <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${networkColors[networkName]} animate-pulse`} />
            <h3 className="text-white">{networkDisplayNames[networkName]}</h3>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <Activity className="w-3 h-3 mr-1" />
            Active
          </Badge>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#0f0f0f]">
            <span className="text-gray-400 text-sm">Threats Detected</span>
            <span className="text-orange-400">{networkData.threats.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#0f0f0f]">
            <span className="text-gray-400 text-sm">Txns Protected</span>
            <span className="text-emerald-400">{networkData.protected.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#0f0f0f]">
            <span className="text-gray-400 text-sm">Success Rate</span>
            <span className="text-white">
              {((networkData.protected / (networkData.protected + networkData.threats)) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </Card>
    );
  }

  // Compact view for overview
  return (
    <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white">Network Status</h3>
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          {Object.keys(networks).length} Active
        </Badge>
      </div>

      <div className="space-y-3">
        {Object.entries(networks).map(([name, data]) => (
          <div key={name} className="flex items-center justify-between p-3 rounded-lg bg-[#0f0f0f] hover:bg-[#2a2a2a] transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${networkColors[name]} animate-pulse`} />
              <span className="text-gray-300 text-sm">{networkDisplayNames[name]}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-orange-400" />
                <span className="text-xs text-gray-400">{data.threats}</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span className="text-xs text-gray-400">{data.protected}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function NetworkStatusWithApi() {
  const { data, loading, error } = useApiData<NetworksData>(api.getNetworkStatus);

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return <div className="text-red-500">Error loading network status</div>;
  }

  return <NetworkStatus networks={data} />;
}