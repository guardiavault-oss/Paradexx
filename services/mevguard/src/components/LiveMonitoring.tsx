import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Activity, Radio, Pause, Play, Maximize2 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { api, LiveMonitoringData } from '../lib/api';
import { useApiData } from '../hooks/useApiData';
import { PageLoader } from './LoadingStates';

interface LiveEvent {
  id: string;
  type: 'threat' | 'protection' | 'transaction' | 'mev';
  message?: string;
  description?: string;
  timestamp: Date | string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  network?: string;
  value?: string;
  tx_hash?: string;
}

const eventTypes = {
  threat: { color: 'text-red-500', bg: 'bg-red-500/10', icon: '🚨' },
  protection: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: '🛡️' },
  transaction: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', icon: '📝' },
  mev: { color: 'text-purple-400', bg: 'bg-purple-500/10', icon: '🔗' }
};

const generateMockEvent = (): LiveEvent => {
  const types: Array<'threat' | 'protection' | 'transaction' | 'mev'> = ['threat', 'protection', 'transaction', 'mev'];
  const type = types[Math.floor(Math.random() * types.length)];
  const networks = ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism'];
  const network = networks[Math.floor(Math.random() * networks.length)];

  const messages = {
    threat: [
      `Sandwich attack detected on ${network}`,
      `Frontrunning attempt blocked on ${network}`,
      `MEV bot activity spike on ${network}`,
      `Flash loan attack prevented on ${network}`
    ],
    protection: [
      `Transaction protected via Flashbots on ${network}`,
      `Slippage protection applied on ${network}`,
      `Private mempool routing successful on ${network}`,
      `Gas optimization saved 15,000 gas on ${network}`
    ],
    transaction: [
      `New transaction protected on ${network}`,
      `High-value swap secured on ${network}`,
      `NFT purchase protected on ${network}`,
      `Liquidity provision secured on ${network}`
    ],
    mev: [
      `Flashbots relay latency: 145ms`,
      `MEV-Share connection stable`,
      `Eden Network relay active`,
      `Fallback relay activated`
    ]
  };

  return {
    id: `event_${Date.now()}_${Math.random()}`,
    type,
    message: messages[type][Math.floor(Math.random() * messages[type].length)],
    timestamp: new Date(),
    severity: type === 'threat' ? (['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any) : undefined,
    network: type !== 'mev' ? network : undefined
  };
};

export function LiveMonitoring() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [chartData, setChartData] = useState<Array<{ value: number }>>([]);

  // Fetch live monitoring data from API
  const { data: monitoringData, loading } = useApiData<LiveMonitoringData>(
    () => api.getLiveMonitoring(),
    {
      autoFetch: isLive,
      refetchInterval: 2000, // Refetch every 2 seconds for live data
    }
  );

  // Update events when new data arrives
  useEffect(() => {
    if (monitoringData?.recent_events) {
      // Convert API events to our LiveEvent format
      const apiEvents: LiveEvent[] = monitoringData.recent_events.map((event: any) => ({
        id: event.id || `event_${Date.now()}_${Math.random()}`,
        type: event.event_type || 'transaction',
        message: event.description || event.message,
        timestamp: new Date(event.timestamp),
        severity: event.severity,
        network: event.network,
        value: event.value,
        tx_hash: event.transaction_hash,
      }));
      setEvents(apiEvents);
    }
  }, [monitoringData]);

  // Update chart data
  useEffect(() => {
    if (monitoringData?.active_threats !== undefined) {
      setChartData(prev => {
        const newData = [...prev, { value: monitoringData.active_threats || 0 }];
        return newData.slice(-20);
      });
    }
  }, [monitoringData]);

  const metrics = {
    threats_per_min: monitoringData?.threats_per_minute || 0,
    protections_per_min: monitoringData?.protections_per_minute || 0,
    avg_response_time: monitoringData?.average_response_time || 0
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Live Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-400 text-sm">Threats/min</p>
            <Badge className="bg-red-500/10 text-red-500">Live</Badge>
          </div>
          <p className="text-white tracking-tight mb-2">{metrics.threats_per_min.toFixed(1)}</p>
          <ResponsiveContainer width="100%" height={40}>
            <LineChart data={chartData}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-400 text-sm">Protections/min</p>
            <Badge className="bg-emerald-500/20 text-emerald-400">Live</Badge>
          </div>
          <p className="text-white tracking-tight mb-2">{metrics.protections_per_min.toFixed(1)}</p>
          <ResponsiveContainer width="100%" height={40}>
            <LineChart data={chartData}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-400 text-sm">Avg Response</p>
            <Badge className="bg-cyan-500/10 text-cyan-400">Live</Badge>
          </div>
          <p className="text-white tracking-tight mb-2">{metrics.avg_response_time.toFixed(0)}ms</p>
          <ResponsiveContainer width="100%" height={40}>
            <LineChart data={chartData}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#06b6d4" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Live Feed */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <div className="p-6 border-b border-[#2a2a2a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'}`} />
              <h3 className="text-white">Live Event Feed</h3>
              <Badge className="bg-[#0f0f0f] text-gray-400">{events.length} events</Badge>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLive(!isLive)}
                className="border-[#2a2a2a] text-gray-300 hover:bg-[#0f0f0f]"
              >
                {isLive ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEvents([])}
                className="border-[#2a2a2a] text-gray-300 hover:bg-[#0f0f0f]"
              >
                Clear
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-[#0f0f0f]"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="h-[500px] overflow-y-auto">
          {events.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Radio className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Waiting for events...</p>
                <p className="text-gray-500 text-sm mt-2">Live monitoring is {isLive ? 'active' : 'paused'}</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#2a2a2a]">
              {events.map((event) => {
                const config = eventTypes[event.type];
                return (
                  <div
                    key={event.id}
                    className="p-4 hover:bg-[#0f0f0f] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 ${config.bg} rounded-lg flex items-center justify-center flex-shrink-0 text-lg`}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`${config.color} capitalize`}>{event.type}</span>
                          {event.network && (
                            <Badge variant="secondary" className="bg-[#0f0f0f] text-gray-400 text-xs capitalize">
                              {event.network}
                            </Badge>
                          )}
                          {event.severity && (
                            <Badge 
                              className={
                                event.severity === 'critical' ? 'bg-red-500/10 text-red-400' :
                                event.severity === 'high' ? 'bg-orange-500/10 text-orange-400' :
                                event.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                                'bg-cyan-500/10 text-cyan-400'
                              }
                            >
                              {event.severity}
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-300 text-sm mb-1">{event.message}</p>
                        <p className="text-gray-500 text-xs">{formatTime(event.timestamp)}</p>
                      </div>
                      <div className="text-gray-600 text-xs whitespace-nowrap">
                        {Math.floor((Date.now() - event.timestamp.getTime()) / 1000)}s ago
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}