import { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Activity, TrendingUp, Shield, AlertTriangle, Database, Network } from 'lucide-react';
import { api, DashboardData } from '../lib/api';
import { useApiData } from '../hooks/useApiData';
import { PageLoader } from './LoadingStates';

function MetricCard({ title, value, icon, change, trend }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  trend?: 'up' | 'down';
}) {
  return (
    <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        {change && (
          <Badge className={
            trend === 'up' 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/20 text-red-400'
          }>
            {change}
          </Badge>
        )}
      </div>
      <p className="text-gray-400 text-sm mb-2">{title}</p>
      <p className="text-white tracking-tight">{value}</p>
    </Card>
  );
}

function ServiceDataPanel({ serviceName, data }: { serviceName: string; data: any }) {
  const formatServiceName = (name: string) => {
    return name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (!data) {
    return (
      <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
        <p className="text-gray-500 text-center">No data available for {formatServiceName(serviceName)}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
      <h4 className="text-white mb-4 flex items-center gap-2">
        <Database className="w-4 h-4 text-emerald-400" />
        {formatServiceName(serviceName)}
      </h4>
      
      <div className="space-y-3">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-[#0f0f0f]">
            <span className="text-gray-400 text-sm capitalize">
              {key.replace(/_/g, ' ')}
            </span>
            <span className="text-gray-300">
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function UnifiedDashboard() {
  const { data: dashboard, loading, error } = useApiData<DashboardData>(api.getDashboard);

  if (loading) {
    return (
      <Card className="p-8 bg-[#1a1a1a] border-[#2a2a2a]">
        <div className="flex items-center justify-center">
          <Activity className="w-6 h-6 text-emerald-400 animate-spin mr-3" />
          <span className="text-gray-400">Loading unified dashboard...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 bg-[#1a1a1a] border-[#2a2a2a]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-2">Failed to load dashboard</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Aggregated Metrics */}
      {dashboard?.aggregated && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Transactions"
            value={dashboard.aggregated.total_transactions.toLocaleString()}
            icon={<Activity className="w-5 h-5 text-emerald-400" />}
            change="+12.5%"
            trend="up"
          />
          <MetricCard
            title="Active Networks"
            value={dashboard.aggregated.active_networks}
            icon={<Network className="w-5 h-5 text-emerald-400" />}
          />
          <MetricCard
            title="MEV Opportunities"
            value={dashboard.aggregated.mev_opportunities}
            icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
            change="+8.2%"
            trend="up"
          />
          <MetricCard
            title="Threats Detected"
            value={dashboard.aggregated.threats_detected}
            icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
            change="-5.1%"
            trend="down"
          />
        </div>
      )}

      {/* Service-Specific Data */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <Tabs defaultValue="unified-engine" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white">Service Data</h3>
            <TabsList className="bg-[#0f0f0f] border border-[#2a2a2a]">
              <TabsTrigger value="unified-engine">Unified Engine</TabsTrigger>
              <TabsTrigger value="mempool-hub">Mempool Hub</TabsTrigger>
              <TabsTrigger value="mempool-core">Mempool Core</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="unified-engine">
            <ServiceDataPanel 
              serviceName="unified-engine" 
              data={dashboard?.services?.['unified-engine']} 
            />
          </TabsContent>

          <TabsContent value="mempool-hub">
            <ServiceDataPanel 
              serviceName="mempool-hub" 
              data={dashboard?.services?.['mempool-hub']} 
            />
          </TabsContent>

          <TabsContent value="mempool-core">
            <ServiceDataPanel 
              serviceName="mempool-core" 
              data={dashboard?.services?.['mempool-core']} 
            />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Timestamp */}
      {dashboard?.timestamp && (
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            Last updated: {new Date(dashboard.timestamp).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}