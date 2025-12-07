import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { api, StatsData } from '../lib/api';
import { useApiData } from '../hooks/useApiData';
import { PageLoader } from './LoadingStates';
import { useMemo } from 'react';

interface ProtectionChartProps {
  title: string;
  type?: 'threats' | 'success-rate' | 'mev-saved';
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

// Mock data for charts
const mockThreatsData = [
  { time: '00:00', sandwich: 45, frontrun: 32, backrun: 18 },
  { time: '04:00', sandwich: 52, frontrun: 38, backrun: 22 },
  { time: '08:00', sandwich: 68, frontrun: 45, backrun: 28 },
  { time: '12:00', sandwich: 82, frontrun: 56, backrun: 35 },
  { time: '16:00', sandwich: 95, frontrun: 62, backrun: 41 },
  { time: '20:00', sandwich: 88, frontrun: 58, backrun: 38 },
  { time: '24:00', sandwich: 75, frontrun: 48, backrun: 30 }
];

const mockSuccessRateData = [
  { time: '00:00', rate: 96.5 },
  { time: '04:00', rate: 97.2 },
  { time: '08:00', rate: 98.1 },
  { time: '12:00', rate: 97.8 },
  { time: '16:00', rate: 98.5 },
  { time: '20:00', rate: 97.9 },
  { time: '24:00', rate: 98.2 }
];

const mockMevSavedData = [
  { time: '00:00', eth: 45.2, usd: 120450 },
  { time: '04:00', eth: 52.8, usd: 140760 },
  { time: '08:00', eth: 68.5, usd: 182575 },
  { time: '12:00', eth: 82.3, usd: 219335 },
  { time: '16:00', eth: 95.7, usd: 255085 },
  { time: '20:00', eth: 88.4, usd: 235660 },
  { time: '24:00', eth: 75.6, usd: 201600 }
];

const timeframes = ['1h', '6h', '24h', '7d', '30d'];

export function ProtectionChart({ title, type = 'threats', timeframe, onTimeframeChange }: ProtectionChartProps) {
  const { data: statsData, loading } = useApiData<StatsData>(
    () => api.getStats({ timeframe }),
    {
      autoFetch: true,
      refetchInterval: 10000,
    }
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 shadow-xl">
          <p className="text-gray-400 text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-white" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'rate' ? `${entry.value}%` : entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // For now, use mock data until API provides time-series data
  // TODO: Update when API returns time-series data for charts
  const chartData = type === 'success-rate' ? mockSuccessRateData : 
                    type === 'mev-saved' ? mockMevSavedData : 
                    mockThreatsData;

  if (loading) return <PageLoader />;

  return (
    <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-white">{title}</h3>
          {type === 'success-rate' && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              <TrendingUp className="w-3 h-3 mr-1" />
              98.2%
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {timeframes.map((tf) => (
            <Button
              key={tf}
              variant={timeframe === tf ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTimeframeChange(tf)}
              className={timeframe === tf ? 'bg-emerald-600 hover:bg-emerald-700 text-black' : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'}
            >
              {tf}
            </Button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        {type === 'success-rate' ? (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis dataKey="time" stroke="#6b7280" />
            <YAxis stroke="#6b7280" domain={[95, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="rate" 
              stroke="#22c55e" 
              fill="url(#colorRate)"
              strokeWidth={2}
            />
          </AreaChart>
        ) : type === 'mev-saved' ? (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorEth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis dataKey="time" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="eth" 
              stroke="#22c55e" 
              fill="url(#colorEth)"
              strokeWidth={2}
              name="ETH Saved"
            />
          </AreaChart>
        ) : (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis dataKey="time" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ color: '#9ca3af' }}
              iconType="circle"
            />
            <Line 
              type="monotone" 
              dataKey="sandwich" 
              stroke="#22c55e" 
              strokeWidth={2}
              dot={{ fill: '#22c55e', r: 4 }}
              name="Sandwich"
            />
            <Line 
              type="monotone" 
              dataKey="frontrun" 
              stroke="#4ade80" 
              strokeWidth={2}
              dot={{ fill: '#4ade80', r: 4 }}
              name="Frontrun"
            />
            <Line 
              type="monotone" 
              dataKey="backrun" 
              stroke="#86efac" 
              strokeWidth={2}
              dot={{ fill: '#86efac', r: 4 }}
              name="Backrun"
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </Card>
  );
}