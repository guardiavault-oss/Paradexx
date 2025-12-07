import { useState, useEffect, useMemo } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Activity, Search, Download, AlertTriangle, ExternalLink } from 'lucide-react';
import { api, TransactionsData } from '../lib/api';
import { useApiData } from '../hooks/useApiData';

const NETWORKS = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'bsc'];

export function EnhancedTransactions() {
  // Filters
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all');
  const [minValue, setMinValue] = useState<string>('');
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  const [limit, setLimit] = useState(100);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch transactions with filters
  const { data: transactionsData, loading, error } = useApiData<TransactionsData>(
    () => api.getTransactions({
      limit,
      network: selectedNetwork !== 'all' ? selectedNetwork : undefined,
      min_value: minValue ? parseFloat(minValue) : undefined,
      suspicious_only: suspiciousOnly || undefined,
    }),
    {
      autoFetch: true,
      refetchInterval: 10000, // Refetch every 10 seconds
    }
  );

  const filteredTransactions = useMemo(() => {
    if (!transactionsData?.transactions) return [];
    
    return transactionsData.transactions.filter(tx => {
      if (!searchTerm) return true;
      return (
        tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.to?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [transactionsData, searchTerm]);

  const handleExport = () => {
    const csv = [
      ['Hash', 'From', 'To', 'Value', 'Network', 'Timestamp', 'Suspicious', 'Source'].join(','),
      ...filteredTransactions.map(tx => [
        tx.hash,
        tx.from,
        tx.to || 'N/A',
        tx.value,
        tx.network,
        tx.timestamp,
        tx.suspicious,
        tx.source
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSourceBadgeColor = (source: string) => {
    if (source.includes('core')) return 'bg-cyan-500/20 text-cyan-400';
    if (source.includes('hub')) return 'bg-purple-500/20 text-purple-400';
    if (source.includes('engine')) return 'bg-emerald-500/20 text-emerald-400';
    return 'bg-gray-500/20 text-gray-400';
  };

  if (loading) {
    return (
      <Card className="p-8 bg-[#1a1a1a] border-[#2a2a2a]">
        <div className="flex items-center justify-center">
          <Activity className="w-6 h-6 text-emerald-400 animate-spin mr-3" />
          <span className="text-gray-400">Loading transactions...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
        <h3 className="text-white mb-4">Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Network Filter */}
          <div>
            <Label className="text-gray-300 mb-2">Network</Label>
            <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
              <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] text-white mt-2">
                <SelectValue />
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

          {/* Min Value */}
          <div>
            <Label className="text-gray-300 mb-2">Min Value (ETH)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="0.0"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              className="bg-[#0f0f0f] border-[#2a2a2a] text-white mt-2"
            />
          </div>

          {/* Limit */}
          <div>
            <Label className="text-gray-300 mb-2">Results</Label>
            <Select value={limit.toString()} onValueChange={(v) => setLimit(parseInt(v))}>
              <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] text-white mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0f0f0f] border-[#2a2a2a]">
                <SelectItem value="50" className="text-white">50</SelectItem>
                <SelectItem value="100" className="text-white">100</SelectItem>
                <SelectItem value="200" className="text-white">200</SelectItem>
                <SelectItem value="500" className="text-white">500</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Suspicious Only */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-[#0f0f0f]">
            <Label className="text-gray-300">Suspicious Only</Label>
            <Switch
              checked={suspiciousOnly}
              onCheckedChange={setSuspiciousOnly}
            />
          </div>
        </div>

        {/* Search */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by hash or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0f0f0f] border-[#2a2a2a] text-white pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
          <div>
            <h3 className="text-white">Transactions</h3>
            <p className="text-gray-400 text-sm mt-1">
              Showing {filteredTransactions.length} of {transactionsData?.transactions?.length || 0} transactions
            </p>
          </div>
          <Button
            onClick={handleExport}
            variant="outline"
            className="border-[#2a2a2a] text-gray-300 hover:bg-[#0f0f0f]"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {error ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-2">Failed to load transactions</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0f0f0f] border-b border-[#2a2a2a]">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-400 text-sm">Hash</th>
                  <th className="px-6 py-3 text-left text-gray-400 text-sm">From</th>
                  <th className="px-6 py-3 text-left text-gray-400 text-sm">To</th>
                  <th className="px-6 py-3 text-left text-gray-400 text-sm">Value</th>
                  <th className="px-6 py-3 text-left text-gray-400 text-sm">Network</th>
                  <th className="px-6 py-3 text-left text-gray-400 text-sm">Source</th>
                  <th className="px-6 py-3 text-left text-gray-400 text-sm">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {filteredTransactions.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-[#0f0f0f] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-gray-300 text-sm">
                          {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                        </code>
                        <ExternalLink className="w-3 h-3 text-gray-500 hover:text-emerald-400 cursor-pointer" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-gray-400 text-xs">
                        {tx.from.slice(0, 8)}...{tx.from.slice(-6)}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-gray-400 text-xs">
                        {tx.to ? `${tx.to.slice(0, 8)}...${tx.to.slice(-6)}` : 'N/A'}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300 text-sm">{tx.value} ETH</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className="bg-[#0f0f0f] text-gray-400 capitalize">
                        {tx.network}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getSourceBadgeColor(tx.source)}>
                        {tx.source}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {tx.suspicious ? (
                        <Badge className="bg-red-500/20 text-red-400">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Suspicious
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500/20 text-emerald-400">
                          Normal
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}