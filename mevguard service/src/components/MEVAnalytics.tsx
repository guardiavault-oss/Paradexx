import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Shield, AlertTriangle, DollarSign, Zap } from 'lucide-react';

// Mock data for MEV analytics
const attackTypeDistribution = [
  { name: 'Sandwich', value: 452, percentage: 45.2, color: '#a855f7' },
  { name: 'Frontrun', value: 298, percentage: 29.8, color: '#06b6d4' },
  { name: 'Backrun', value: 156, percentage: 15.6, color: '#10b981' },
  { name: 'Flash Loan', value: 94, percentage: 9.4, color: '#f59e0b' }
];

const mevSavedByNetwork = [
  { network: 'Ethereum', saved: 425.5, attacks: 892 },
  { network: 'Polygon', saved: 156.8, attacks: 234 },
  { network: 'BSC', saved: 98.4, attacks: 156 },
  { network: 'Arbitrum', saved: 76.2, attacks: 98 },
  { network: 'Optimism', saved: 54.3, attacks: 87 },
  { network: 'Base', saved: 36.0, attacks: 76 }
];

const timeSeriesData = [
  { time: 'Mon', threats: 145, protected: 142, mev_saved: 45.2 },
  { time: 'Tue', threats: 178, protected: 175, mev_saved: 58.6 },
  { time: 'Wed', threats: 198, protected: 192, mev_saved: 67.8 },
  { time: 'Thu', threats: 223, protected: 218, mev_saved: 82.4 },
  { time: 'Fri', threats: 267, protected: 262, mev_saved: 95.7 },
  { time: 'Sat', threats: 189, protected: 185, mev_saved: 68.3 },
  { time: 'Sun', threats: 156, protected: 153, mev_saved: 52.5 }
];

const protectionStrategies = [
  { strategy: 'Private Mempool', usage: 856, success_rate: 99.2 },
  { strategy: 'Gas Adjustment', usage: 743, success_rate: 97.8 },
  { strategy: 'Slippage Protection', usage: 621, success_rate: 98.5 },
  { strategy: 'Transaction Batching', usage: 234, success_rate: 96.3 },
  { strategy: 'Timing Optimization', usage: 178, success_rate: 94.7 }
];

const COLORS = ['#a855f7', '#06b6d4', '#10b981', '#f59e0b'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 shadow-xl">
        <p className="text-gray-400 text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function MEVAnalytics() {
  const totalMEVSaved = attackTypeDistribution.reduce((acc, item) => acc + item.value, 0);
  const protectionRate = 97.99;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-violet-500/10 border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-400 text-sm">Total MEV Saved</p>
            <DollarSign className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-white tracking-tight mb-1">847.25 ETH</p>
          <p className="text-gray-500 text-sm">$2.26M USD</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-400 text-sm">Protection Rate</p>
            <Shield className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-white tracking-tight mb-1">{protectionRate}%</p>
          <p className="text-gray-500 text-sm">1,512/1,543 threats</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-400 text-sm">Attacks Detected</p>
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-white tracking-tight mb-1">1,543</p>
          <p className="text-gray-500 text-sm">Last 7 days</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-400 text-sm">Avg Response Time</p>
            <Zap className="w-5 h-5 text-cyan-500" />
          </div>
          <p className="text-white tracking-tight mb-1">127ms</p>
          <p className="text-gray-500 text-sm">Detection to protection</p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attack Type Distribution */}
        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white">Attack Type Distribution</h3>
            <Badge className="bg-[#0f0f0f] text-gray-400">Last 7 days</Badge>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={attackTypeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {attackTypeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-3 mt-6">
            {attackTypeDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <div className="flex-1">
                  <p className="text-gray-400 text-xs">{item.name}</p>
                  <p className="text-white text-sm">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* MEV Saved by Network */}
        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white">MEV Saved by Network</h3>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:bg-[#0f0f0f]">
              View All
            </Button>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mevSavedByNetwork}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="network" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="saved" fill="#8b5cf6" name="ETH Saved" />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-6 space-y-2">
            {mevSavedByNetwork.slice(0, 3).map((network, idx) => (
              <div key={network.network} className="flex items-center justify-between p-2 rounded bg-[#0f0f0f]">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-[#2a2a2a] text-gray-300">
                    #{idx + 1}
                  </Badge>
                  <span className="text-gray-300 text-sm">{network.network}</span>
                </div>
                <span className="text-purple-400">{network.saved} ETH</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Time Series Analysis */}
      <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white">Weekly Protection Performance</h3>
          <div className="flex gap-2">
            <Badge className="bg-purple-500/10 text-purple-400">
              <TrendingUp className="w-3 h-3 mr-1" />
              +23.5%
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="threats" className="space-y-4">
          <TabsList className="bg-[#0f0f0f] border border-[#2a2a2a]">
            <TabsTrigger value="threats">Threats Detected</TabsTrigger>
            <TabsTrigger value="mev">MEV Saved</TabsTrigger>
          </TabsList>

          <TabsContent value="threats">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="time" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="threats" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', r: 4 }}
                  name="Threats Detected"
                />
                <Line 
                  type="monotone" 
                  dataKey="protected" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  name="Successfully Protected"
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="mev">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="time" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="mev_saved" fill="#8b5cf6" name="MEV Saved (ETH)" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Protection Strategies Performance */}
      <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white">Protection Strategy Performance</h3>
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            Avg Success: 97.3%
          </Badge>
        </div>

        <div className="space-y-4">
          {protectionStrategies.map((strategy, idx) => (
            <div key={strategy.strategy} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-[#0f0f0f] text-gray-300">
                    #{idx + 1}
                  </Badge>
                  <span className="text-gray-300">{strategy.strategy}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-400 text-sm">{strategy.usage} uses</span>
                  <Badge 
                    className={
                      strategy.success_rate >= 98 
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : strategy.success_rate >= 95
                        ? 'bg-yellow-500/10 text-yellow-400'
                        : 'bg-orange-500/10 text-orange-400'
                    }
                  >
                    {strategy.success_rate}%
                  </Badge>
                </div>
              </div>
              <div className="h-2 bg-[#0f0f0f] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                  style={{ width: `${strategy.success_rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}