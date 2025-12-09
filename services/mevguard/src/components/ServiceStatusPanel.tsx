import { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Activity, Server, RefreshCw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { api, ServicesData } from '../lib/api';
import { useApiData } from '../hooks/useApiData';
import { PageLoader } from './LoadingStates';

interface ServiceCardProps {
  name: string;
  healthy: boolean;
  url: string;
  status?: any;
  lastChecked?: Date;
}

function ServiceCard({ name, healthy, url, status, lastChecked }: ServiceCardProps) {
  const getStatusColor = () => {
    if (healthy) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  const getStatusIcon = () => {
    if (healthy) return <CheckCircle2 className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  const formatServiceName = (name: string) => {
    return name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-[#0f0f0f] rounded-lg flex items-center justify-center">
          <Server className={`w-5 h-5 ${healthy ? 'text-emerald-400' : 'text-red-400'}`} />
        </div>
        <Badge className={getStatusColor()}>
          {getStatusIcon()}
          <span className="ml-1">{healthy ? 'Healthy' : 'Unhealthy'}</span>
        </Badge>
      </div>

      <h3 className="text-white mb-2">{formatServiceName(name)}</h3>
      <code className="text-gray-500 text-xs block mb-4">{url}</code>

      {status && (
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Uptime</span>
            <span className="text-gray-300">{status.uptime || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Response</span>
            <span className="text-gray-300">{status.response_time || '<50ms'}</span>
          </div>
        </div>
      )}

      {lastChecked && (
        <p className="text-gray-500 text-xs">
          Last checked: {lastChecked.toLocaleTimeString()}
        </p>
      )}
    </Card>
  );
}

export function ServiceStatusPanel() {
  const [services, setServices] = useState<ServicesData['services'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const fetchServices = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);
      
      const response = await api.getServiceStatus();
      setServices(response.services);
      setLastChecked(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch service status');
      console.error('Failed to fetch services:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServices();
    const interval = setInterval(() => fetchServices(), 15000); // Poll every 15s
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchServices(true);
  };

  if (loading) {
    return (
      <Card className="p-8 bg-[#1a1a1a] border-[#2a2a2a]">
        <div className="flex items-center justify-center">
          <Activity className="w-6 h-6 text-emerald-400 animate-spin mr-3" />
          <span className="text-gray-400">Loading service status...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 bg-[#1a1a1a] border-[#2a2a2a]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-2">Failed to load service status</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <Button
            onClick={handleRefresh}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white mb-1">Service Status</h3>
          <p className="text-gray-400 text-sm">
            Monitoring {services ? Object.keys(services).length : 0} integrated services
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="border-[#2a2a2a] text-gray-300 hover:bg-[#0f0f0f]"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services && Object.entries(services).map(([name, service]) => (
          <ServiceCard
            key={name}
            name={name}
            healthy={service.healthy}
            url={service.url}
            status={service.status}
            lastChecked={lastChecked}
          />
        ))}
      </div>
    </div>
  );
}