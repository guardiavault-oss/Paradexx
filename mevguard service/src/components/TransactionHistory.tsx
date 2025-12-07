import { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Shield, ExternalLink, Filter, Download, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface Transaction {
  transaction_hash: string;
  network: string;
  protection_level: string;
  status: string;
  strategies: string[];
  created_at: string;
  gas_saved: number;
  value_protected: number;
  execution_time: number;
  threat_detected?: string;
}

const mockTransactions: Transaction[] = [
  {
    transaction_hash: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
    network: 'ethereum',
    protection_level: 'high',
    status: 'protected',
    strategies: ['private_mempool', 'gas_adjustment'],
    created_at: new Date(Date.now() - 300000).toISOString(),
    gas_saved: 15000,
    value_protected: 1234.56,
    execution_time: 1.2,
    threat_detected: 'sandwich'
  },
  {
    transaction_hash: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    network: 'polygon',
    protection_level: 'maximum',
    status: 'protected',
    strategies: ['private_mempool', 'slippage_protection', 'gas_adjustment'],
    created_at: new Date(Date.now() - 600000).toISOString(),
    gas_saved: 8500,
    value_protected: 567.89,
    execution_time: 0.8,
    threat_detected: 'frontrun'
  },
  {
    transaction_hash: '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe',
    network: 'arbitrum',
    protection_level: 'high',
    status: 'protected',
    strategies: ['gas_adjustment'],
    created_at: new Date(Date.now() - 900000).toISOString(),
    gas_saved: 3200,
    value_protected: 234.12,
    execution_time: 0.5
  },
  {
    transaction_hash: '0x5F4eC3Df9cbd43714FE2740f5E3616155c5b8419',
    network: 'bsc',
    protection_level: 'standard',
    status: 'protected',
    strategies: ['slippage_protection'],
    created_at: new Date(Date.now() - 1200000).toISOString(),
    gas_saved: 5600,
    value_protected: 890.45,
    execution_time: 1.8
  },
  {
    transaction_hash: '0x56178a0d5F301bAf6CF3e1Cd53d9863437345Bf9',
    network: 'ethereum',
    protection_level: 'maximum',
    status: 'protected',
    strategies: ['private_mempool', 'gas_adjustment', 'slippage_protection'],
    created_at: new Date(Date.now() - 1800000).toISOString(),
    gas_saved: 22000,
    value_protected: 3456.78,
    execution_time: 2.1,
    threat_detected: 'sandwich'
  }
];

const statusColors: Record<string, string> = {
  protected: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  failed: 'bg-red-500/10 text-red-500 border-red-500/20'
};

const protectionLevelColors: Record<string, string> = {
  basic: 'bg-gray-500/10 text-gray-400',
  standard: 'bg-cyan-500/10 text-cyan-400',
  high: 'bg-purple-500/10 text-purple-400',
  maximum: 'bg-orange-500/10 text-orange-400',
  enterprise: 'bg-red-500/10 text-red-400'
};

function truncateHash(hash: string) {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function formatTimeAgo(dateString: string) {
  const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function TransactionHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [networkFilter, setNetworkFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredTransactions = mockTransactions.filter(tx => {
    const matchesSearch = tx.transaction_hash.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNetwork = networkFilter === 'all' || tx.network === networkFilter;
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    return matchesSearch && matchesNetwork && matchesStatus;
  });

  const handleExport = () => {
    console.log('Exporting transaction history...');
    // API call to export data
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <p className="text-gray-400 text-sm mb-2">Total Protected</p>
          <p className="text-white tracking-tight">{mockTransactions.length}</p>
        </Card>
        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <p className="text-gray-400 text-sm mb-2">Gas Saved</p>
          <p className="text-emerald-400 tracking-tight">
            {mockTransactions.reduce((acc, tx) => acc + tx.gas_saved, 0).toLocaleString()}
          </p>
        </Card>
        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <p className="text-gray-400 text-sm mb-2">Value Protected</p>
          <p className="text-white tracking-tight">
            ${mockTransactions.reduce((acc, tx) => acc + tx.value_protected, 0).toFixed(2)}
          </p>
        </Card>
        <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <p className="text-gray-400 text-sm mb-2">Threats Blocked</p>
          <p className="text-orange-400 tracking-tight">
            {mockTransactions.filter(tx => tx.threat_detected).length}
          </p>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by transaction hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#0f0f0f] border-[#2a2a2a] text-white"
            />
          </div>

          <Select value={networkFilter} onValueChange={setNetworkFilter}>
            <SelectTrigger className="w-full md:w-48 bg-[#0f0f0f] border-[#2a2a2a] text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Network" />
            </SelectTrigger>
            <SelectContent className="bg-[#0f0f0f] border-[#2a2a2a]">
              <SelectItem value="all" className="text-white">All Networks</SelectItem>
              <SelectItem value="ethereum" className="text-white">Ethereum</SelectItem>
              <SelectItem value="polygon" className="text-white">Polygon</SelectItem>
              <SelectItem value="bsc" className="text-white">BSC</SelectItem>
              <SelectItem value="arbitrum" className="text-white">Arbitrum</SelectItem>
              <SelectItem value="optimism" className="text-white">Optimism</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48 bg-[#0f0f0f] border-[#2a2a2a] text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#0f0f0f] border-[#2a2a2a]">
              <SelectItem value="all" className="text-white">All Status</SelectItem>
              <SelectItem value="protected" className="text-white">Protected</SelectItem>
              <SelectItem value="pending" className="text-white">Pending</SelectItem>
              <SelectItem value="failed" className="text-white">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleExport} variant="outline" className="border-[#2a2a2a] text-gray-300 hover:bg-[#0f0f0f]">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </Card>

      {/* Transaction Table */}
      <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#2a2a2a] hover:bg-[#0f0f0f]">
                <TableHead className="text-gray-400">Transaction</TableHead>
                <TableHead className="text-gray-400">Network</TableHead>
                <TableHead className="text-gray-400">Protection</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Strategies</TableHead>
                <TableHead className="text-gray-400">Gas Saved</TableHead>
                <TableHead className="text-gray-400">Value</TableHead>
                <TableHead className="text-gray-400">Time</TableHead>
                <TableHead className="text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((tx) => (
                <TableRow key={tx.transaction_hash} className="border-[#2a2a2a] hover:bg-[#0f0f0f]">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {tx.threat_detected && (
                        <Shield className="w-4 h-4 text-orange-400" />
                      )}
                      <code className="text-xs text-gray-300 bg-[#0f0f0f] px-2 py-1 rounded">
                        {truncateHash(tx.transaction_hash)}
                      </code>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-300 text-sm capitalize">{tx.network}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={protectionLevelColors[tx.protection_level]}>
                      {tx.protection_level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[tx.status]}>
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {tx.strategies.slice(0, 2).map((strategy, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-[#0f0f0f] text-gray-400 text-xs">
                          {strategy.replace('_', ' ')}
                        </Badge>
                      ))}
                      {tx.strategies.length > 2 && (
                        <Badge variant="secondary" className="bg-[#0f0f0f] text-gray-400 text-xs">
                          +{tx.strategies.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-emerald-400 text-sm">{tx.gas_saved.toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-white text-sm">${tx.value_protected.toFixed(2)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-500 text-sm">{formatTimeAgo(tx.created_at)}</span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-[#0f0f0f]">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No transactions found</p>
          </div>
        )}
      </Card>
    </div>
  );
}