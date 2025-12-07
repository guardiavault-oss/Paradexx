import { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Activity, AlertTriangle, Shield, AlertOctagon, AlertCircle, Info } from 'lucide-react';
import { api, ThreatsData } from '../lib/api';
import { useApiData } from '../hooks/useApiData';
import { PageLoader } from './LoadingStates';

const NETWORKS = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'bsc'];
const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'];

export function ThreatIntelligence() {
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [limit, setLimit] = useState(100);

  // Fetch threats with filters
  const { data: threatsData, loading, error } = useApiData<ThreatsData>(
    () => api.getThreats({
      limit,
      network: selectedNetwork !== 'all' ? selectedNetwork : undefined,
      severity: selectedSeverity !== 'all' ? selectedSeverity : undefined,
    }),
    {
      autoFetch: true,
      refetchInterval: 10000,
    }
  );

  const threats = threatsData?.threats || [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertOctagon className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <AlertCircle className="w-4 h-4" />;
      case 'low': return <Info className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const threatCounts = {
    critical: threats.filter(t => t.severity === 'critical').length,
    high: threats.filter(t => t.severity === 'high').length,
    medium: threats.filter(t => t.severity === 'medium').length,
    low: threats.filter(t => t.severity === 'low').length,
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Threat Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
              <AlertOctagon className="w-5 h-5 text-red-400" />
            </div>
            <Badge className="bg-red-500/20 text-red-400">Critical</Badge>
          </div>
          <p className="text-white tracking-tight">{threatCounts.critical}</p>
        </Card>

        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
            </div>
            <Badge className="bg-orange-500/20 text-orange-400">High</Badge>
          </div>
          <p className="text-white tracking-tight">{threatCounts.high}</p>
        </Card>

        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            </div>
            <Badge className="bg-yellow-500/20 text-yellow-400">Medium</Badge>
          </div>
          <p className="text-white tracking-tight">{threatCounts.medium}</p>
        </Card>

        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
              <Info className="w-5 h-5 text-cyan-400" />
            </div>
            <Badge className="bg-cyan-500/20 text-cyan-400">Low</Badge>
          </div>
          <p className="text-white tracking-tight">{threatCounts.low}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
        <h3 className="text-white mb-4">Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
              <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] text-white">
                <SelectValue placeholder="Network" />
              </SelectTrigger>
              <SelectContent className="bg-[#0f0f0f] border-[#2a2a2a]">
                <SelectItem value="all" className="text-white">All Networks</SelectItem>
                {NETWORKS.map(network => (
                  <SelectItem key={network} value={network} className="text-white capitalize">
                    {network}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] text-white">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent className="bg-[#0f0f0f] border-[#2a2a2a]">
                <SelectItem value="all" className="text-white">All Severities</SelectItem>
                {SEVERITY_LEVELS.map(level => (
                  <SelectItem key={level} value={level} className="text-white capitalize">
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={limit.toString()} onValueChange={(v) => setLimit(parseInt(v))}>
              <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0f0f0f] border-[#2a2a2a]">
                <SelectItem value="50" className="text-white">50 Results</SelectItem>
                <SelectItem value="100" className="text-white">100 Results</SelectItem>
                <SelectItem value="200" className="text-white">200 Results</SelectItem>
                <SelectItem value="500" className="text-white">500 Results</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Threats List */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <div className="p-6 border-b border-[#2a2a2a]">
          <h3 className="text-white">Detected Threats</h3>
          <p className="text-gray-400 text-sm mt-1">
            {threats.length} threats detected
          </p>
        </div>

        {error ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-2">Failed to load threats</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        ) : threats.length === 0 ? (
          <div className="p-8 text-center">
            <Shield className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <p className="text-emerald-400 mb-2">All Clear!</p>
            <p className="text-gray-400 text-sm">No threats detected</p>
          </div>
        ) : (
          <div className="divide-y divide-[#2a2a2a]">
            {threats.map((threat) => (
              <div key={threat.threat_id} className="p-6 hover:bg-[#0f0f0f] transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getSeverityColor(threat.severity).replace('text-', 'bg-').replace('/20', '/10')}`}>
                    {getSeverityIcon(threat.severity)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className={getSeverityColor(threat.severity)}>
                        {getSeverityIcon(threat.severity)}
                        <span className="ml-1 capitalize">{threat.severity}</span>
                      </Badge>
                      <Badge className="bg-[#0f0f0f] text-gray-400 capitalize">
                        {threat.network}
                      </Badge>
                      <Badge className="bg-purple-500/20 text-purple-400 capitalize">
                        {threat.threat_type}
                      </Badge>
                      {threat.protection_applied && (
                        <Badge className="bg-emerald-500/20 text-emerald-400">
                          <Shield className="w-3 h-3 mr-1" />
                          Protected
                        </Badge>
                      )}
                    </div>

                    <h4 className="text-white mb-2 capitalize">{threat.threat_type} Attack</h4>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Target Transaction</p>
                        <code className="text-xs text-gray-400 bg-[#0f0f0f] px-2 py-1 rounded">
                          {threat.target_transaction.slice(0, 10)}...{threat.target_transaction.slice(-8)}
                        </code>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Attacker Address</p>
                        <code className="text-xs text-gray-400 bg-[#0f0f0f] px-2 py-1 rounded">
                          {threat.attacker_address.slice(0, 10)}...{threat.attacker_address.slice(-8)}
                        </code>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-gray-500">Profit Potential: </span>
                        <span className="text-emerald-400">{threat.profit_potential.toFixed(4)} ETH</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Estimated Loss: </span>
                        <span className="text-red-400">${threat.estimated_loss.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Confidence: </span>
                        <span className="text-white">{(threat.confidence * 100).toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                      <span>ID: {threat.threat_id}</span>
                      <span>•</span>
                      <span>{new Date(threat.detected_at).toLocaleString()}</span>
                      {threat.mitigation_strategy && (
                        <>
                          <span>•</span>
                          <span className="capitalize">Strategy: {threat.mitigation_strategy}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}