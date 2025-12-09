import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { AlertTriangle, Shield, Clock } from 'lucide-react';
import { api, ThreatsData } from '../lib/api';
import { useApiData } from '../hooks/useApiData';
import { PageLoader } from './LoadingStates';

interface Threat {
  threat_id: string;
  threat_type: string;
  target_transaction: string;
  attacker_address: string;
  profit_potential: number;
  severity: string;
  detected_at: string;
  network: string;
  protection_applied: boolean;
  estimated_loss: number;
}

interface ThreatsTableProps {
  expanded?: boolean;
}

const severityColors: Record<string, string> = {
  low: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-400 border-red-500/20'
};

const threatTypeColors: Record<string, string> = {
  sandwich: 'bg-purple-500/10 text-purple-400',
  frontrun: 'bg-cyan-500/10 text-cyan-400',
  backrun: 'bg-emerald-500/10 text-emerald-400'
};

function formatTimeAgo(dateString: string) {
  const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ThreatsTable({ expanded = false }: ThreatsTableProps) {
  const { data: threatsData, loading } = useApiData<ThreatsData>(api.getThreats);
  const displayThreats = expanded ? threatsData?.threats : threatsData?.threats.slice(0, 5);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white">Recent Threats</h3>
        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {threatsData?.threats.length} Active
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-[#2a2a2a] hover:bg-[#0f0f0f]">
              <TableHead className="text-gray-400">Type</TableHead>
              <TableHead className="text-gray-400">Target</TableHead>
              <TableHead className="text-gray-400">Network</TableHead>
              <TableHead className="text-gray-400">Severity</TableHead>
              <TableHead className="text-gray-400">Loss</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayThreats?.map((threat) => (
              <TableRow key={threat.threat_id} className="border-[#2a2a2a] hover:bg-[#0f0f0f]">
                <TableCell>
                  <Badge className={threatTypeColors[threat.threat_type]}>
                    {threat.threat_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <code className="text-xs text-gray-400 bg-[#0f0f0f] px-2 py-1 rounded">
                    {truncateAddress(threat.target_transaction)}
                  </code>
                </TableCell>
                <TableCell>
                  <span className="text-gray-300 text-sm capitalize">{threat.network}</span>
                </TableCell>
                <TableCell>
                  <Badge className={severityColors[threat.severity]}>
                    {threat.severity}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-red-400">${threat.estimated_loss.toFixed(2)}</span>
                </TableCell>
                <TableCell>
                  {threat.protection_applied ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      <Shield className="w-3 h-3 mr-1" />
                      Protected
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-[#0f0f0f] text-gray-400">
                      Detected
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-gray-500 text-sm">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(threat.detected_at)}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}