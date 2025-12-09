import { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, DollarSign, Shield, Activity } from 'lucide-react';
import { api } from '../lib/api';
import { useApiData } from '../hooks/useApiData';
import { PageLoader } from './LoadingStates';

export function Analytics() {
  const [timePeriod, setTimePeriod] = useState('24h');

  // Fetch analytics data
  const { data: analyticsData, loading } = useApiData(
    () => api.getAnalyticsDashboard({ time_period: timePeriod }),
    {
      autoFetch: true,
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  const { data: performanceData } = useApiData(
    () => api.getAnalyticsPerformance({ time_period: timePeriod }),
    {
      autoFetch: true,
      refetchInterval: 30000,
    }
  );

  const { data: securityData } = useApiData(
    () => api.getAnalyticsSecurity({ time_period: timePeriod }),
    {
      autoFetch: true,
      refetchInterval: 30000,
    }
  );

  if (loading) {
    return <PageLoader />;
  }

  const COLORS = ['#22c55e', '#10b981', '#4ade80', '#86efac', '#a7f3d0'];

  return (
    <div className="space-y-6">
      {/* Time Period Selector */}
      <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white mb-1">MEV Analytics Dashboard</h2>
            <p className="text-gray-400 text-sm">Comprehensive protection analytics and insights</p>
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
              <SelectItem value="30d" className="text-white">30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-gray-400 text-sm">Total Protected</p>
          </div>
          <p className="text-white tracking-tight">{analyticsData?.total_transactions_protected?.toLocaleString() || 0}</p>
          <p className="text-emerald-400 text-sm mt-2">
            <TrendingUp className="w-4 h-4 inline mr-1" />
            {analyticsData?.protection_growth_rate?.toFixed(1) || 0}% growth
          </p>
        </Card>

        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-gray-400 text-sm">MEV Saved</p>
          </div>
          <p className="text-white tracking-tight">{analyticsData?.total_mev_saved?.toFixed(4) || 0} ETH</p>
          <p className="text-gray-400 text-sm mt-2">
            ${(analyticsData?.total_mev_saved_usd || 0).toLocaleString()}
          </p>
        </Card>

        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-gray-400 text-sm">Success Rate</p>
          </div>
          <p className="text-white tracking-tight">{analyticsData?.success_rate?.toFixed(2) || 0}%</p>
          <p className="text-emerald-400 text-sm mt-2">
            {analyticsData?.successful_protections?.toLocaleString() || 0} successful
          </p>
        </Card>

        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-gray-400 text-sm">Threats Blocked</p>
          </div>
          <p className="text-white tracking-tight">{analyticsData?.threats_blocked?.toLocaleString() || 0}</p>
          <p className="text-gray-400 text-sm mt-2">
            {analyticsData?.avg_threats_per_day?.toFixed(1) || 0} per day
          </p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Protection Performance */}
        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <h3 className="text-white mb-6">Protection Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData?.timeline_data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="timestamp" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px'
                }}
              />
              <Legend wrapperStyle={{ color: '#9ca3af' }} />
              <Line 
                type="monotone" 
                dataKey="protections" 
                stroke="#22c55e" 
                strokeWidth={2}
                name="Protections"
              />
              <Line 
                type="monotone" 
                dataKey="threats" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Threats"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Network Distribution */}
        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <h3 className="text-white mb-6">Network Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData?.network_distribution || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {(analyticsData?.network_distribution || []).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Threat Types */}
        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <h3 className="text-white mb-6">Threat Types Detected</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={securityData?.threat_type_breakdown || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="type" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="count" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Severity Distribution */}
        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <h3 className="text-white mb-6">Threat Severity</h3>
          <div className="space-y-4">
            {securityData?.severity_distribution?.map((item: any) => (
              <div key={item.severity}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={
                        item.severity === 'critical' ? 'bg-red-500/10 text-red-400' :
                        item.severity === 'high' ? 'bg-orange-500/10 text-orange-400' :
                        item.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-cyan-500/10 text-cyan-400'
                      }
                    >
                      {item.severity}
                    </Badge>
                    <span className="text-gray-400 text-sm">{item.count} threats</span>
                  </div>
                  <span className="text-white">{item.percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[#0f0f0f] rounded-full h-2">
                  <div 
                    className={
                      item.severity === 'critical' ? 'bg-red-500' :
                      item.severity === 'high' ? 'bg-orange-500' :
                      item.severity === 'medium' ? 'bg-yellow-500' :
                      'bg-cyan-500'
                    }
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            )) || (
              <p className="text-gray-400 text-center py-8">No severity data available</p>
            )}
          </div>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <h3 className="text-white mb-4">Avg Response Time</h3>
          <p className="text-emerald-400 tracking-tight">{performanceData?.avg_response_time?.toFixed(0) || 0}ms</p>
          <p className="text-gray-500 text-sm mt-2">Across all networks</p>
        </Card>

        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <h3 className="text-white mb-4">Gas Saved</h3>
          <p className="text-emerald-400 tracking-tight">{((analyticsData?.gas_saved || 0) / 1000000).toFixed(2)}M</p>
          <p className="text-gray-500 text-sm mt-2">Gwei saved total</p>
        </Card>

        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <h3 className="text-white mb-4">Uptime</h3>
          <p className="text-emerald-400 tracking-tight">{performanceData?.uptime_percentage?.toFixed(2) || 99.9}%</p>
          <p className="text-gray-500 text-sm mt-2">Service availability</p>
        </Card>
      </div>
    </div>
  );
}
