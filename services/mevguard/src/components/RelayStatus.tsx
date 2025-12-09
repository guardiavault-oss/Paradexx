import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Activity, Wifi, WifiOff, Zap, DollarSign, TrendingUp } from 'lucide-react';
import { api, RelaysData } from '../lib/api';
import { useApiData } from '../hooks/useApiData';
import { PageLoader } from './LoadingStates';

interface Relay {
  name: string;
  status: string;
  latency: number;
  success_rate: number;
  requests_24h: number;
  revenue_24h: number;
  endpoint: string;
}

const mockRelays: Relay[] = [
  {
    name: 'Flashbots',
    status: 'connected',
    latency: 145,
    success_rate: 99.5,
    requests_24h: 1200,
    revenue_24h: 500,
    endpoint: 'https://relay.flashbots.net'
  },
  {
    name: 'MEV-Share',
    status: 'connected',
    latency: 168,
    success_rate: 98.8,
    requests_24h: 800,
    revenue_24h: 300,
    endpoint: 'https://mev-share.flashbots.net'
  },
  {
    name: 'Eden Network',
    status: 'connected',
    latency: 132,
    success_rate: 97.2,
    requests_24h: 1000,
    revenue_24h: 400,
    endpoint: 'https://api.edennetwork.io'
  },
  {
    name: 'Custom Relay',
    status: 'degraded',
    latency: 245,
    success_rate: 92.5,
    requests_24h: 500,
    revenue_24h: 200,
    endpoint: 'https://custom-relay.example.com'
  }
];

function getLatencyColor(latency: number) {
  if (latency < 150) return 'text-emerald-400';
  if (latency < 200) return 'text-yellow-400';
  return 'text-orange-400';
}

function getSuccessRateColor(rate: number) {
  if (rate >= 99) return 'text-emerald-400';
  if (rate >= 95) return 'text-yellow-400';
  return 'text-orange-400';
}

export function RelayStatus() {
  const { data: relaysData, loading } = useApiData<RelaysData>(
    () => api.getRelays(),
    {
      autoFetch: true,
      refetchInterval: 10000,
    }
  );

  if (loading) {
    return <PageLoader />;
  }

  // Convert API data format to component format
  const relays = relaysData ? Object.entries(relaysData.relays).map(([key, relay]) => ({
    name: relay.relay_type,
    status: relay.status,
    latency: relay.latency,
    success_rate: relay.success_rate,
    requests_24h: 0, // TODO: Add to API response
    revenue_24h: 0,  // TODO: Add to API response
    endpoint: relay.endpoint,
  })) : [];

  const activeRelays = relays.filter(r => r.status === 'connected').length;
  const avgLatency = relays.length > 0 
    ? Math.round(relays.reduce((acc, r) => acc + r.latency, 0) / relays.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">Active Relays</p>
              <p className="text-white tracking-tight">{activeRelays}/{relays.length || 0}</p>
            </div>
            <Wifi className="w-8 h-8 text-emerald-500" />
          </div>
        </Card>

        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">Avg. Latency</p>
              <p className={`tracking-tight ${getLatencyColor(avgLatency)}`}>{avgLatency}ms</p>
            </div>
            <Zap className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">Health Score</p>
              <p className="text-white tracking-tight">98.5%</p>
            </div>
            <Activity className="w-8 h-8 text-emerald-500" />
          </div>
        </Card>
      </div>

      {/* Relay Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {relays.map((relay) => (
          <Card key={relay.name} className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {relay.status === 'connected' ? (
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                    <Wifi className="w-5 h-5 text-emerald-500" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                    <WifiOff className="w-5 h-5 text-orange-500" />
                  </div>
                )}
                <div>
                  <h4 className="text-white">{relay.name}</h4>
                  <p className="text-xs text-gray-500">{relay.endpoint}</p>
                </div>
              </div>
              
              <Badge 
                className={
                  relay.status === 'connected' 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                }
              >
                {relay.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 rounded-lg bg-[#0f0f0f]">
                <p className="text-gray-400 text-xs mb-1">Latency</p>
                <p className={`${getLatencyColor(relay.latency)}`}>{relay.latency}ms</p>
              </div>
              <div className="p-3 rounded-lg bg-[#0f0f0f]">
                <p className="text-gray-400 text-xs mb-1">Success Rate</p>
                <p className={getSuccessRateColor(relay.success_rate)}>{relay.success_rate}%</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className="text-gray-400 text-xs">Requests (24h):</span>
              <Badge variant="secondary" className="bg-[#0f0f0f] text-gray-300 text-xs">
                {relay.requests_24h}
              </Badge>
              <span className="text-gray-400 text-xs">Revenue (24h):</span>
              <Badge variant="secondary" className="bg-[#0f0f0f] text-gray-300 text-xs">
                ${relay.revenue_24h}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="flex-1 border-[#2a2a2a] text-gray-300 hover:bg-[#0f0f0f]">
                Test Connection
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:bg-[#0f0f0f]">
                Details
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}