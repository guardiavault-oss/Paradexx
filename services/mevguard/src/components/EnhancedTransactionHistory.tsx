import { useState, useMemo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Search,
  Filter,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { Transaction, TransactionState } from './TransactionStateManager';

interface EnhancedTransactionHistoryProps {
  transactions?: Transaction[];
}

// Demo transaction data
const generateDemoTransactions = (): Transaction[] => {
  const states: TransactionState[] = ['confirmed', 'failed', 'pending', 'replaced', 'dropped'];
  const networks = ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'BSC'];
  const types = ['swap', 'transfer', 'approval', 'liquidity', 'nft'];
  
  return Array.from({ length: 150 }, (_, i) => ({
    hash: `0x${Math.random().toString(16).slice(2)}${i}`,
    state: states[Math.floor(Math.random() * states.length)],
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    network: networks[Math.floor(Math.random() * networks.length)],
    value: `${(Math.random() * 10).toFixed(4)} ETH`,
    gasPrice: `${Math.floor(Math.random() * 100 + 20)} gwei`,
    nonce: Math.floor(Math.random() * 1000),
    confirmations: Math.floor(Math.random() * 50),
    requiredConfirmations: 12,
    type: types[Math.floor(Math.random() * types.length)] as any,
    from: `0x${Math.random().toString(16).slice(2, 42)}`,
    to: `0x${Math.random().toString(16).slice(2, 42)}`,
    mevRisk: Math.floor(Math.random() * 100),
    gasCost: `$${(Math.random() * 50).toFixed(2)}`,
  }));
};

export function EnhancedTransactionHistory({ 
  transactions: propTransactions 
}: EnhancedTransactionHistoryProps) {
  const [transactions] = useState<Transaction[]>(propTransactions || generateDemoTransactions());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<TransactionState | 'all'>('all');
  const [filterNetwork, setFilterNetwork] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'value' | 'gas'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const itemsPerPage = 20;

  // Get unique networks
  const networks = useMemo(() => {
    return Array.from(new Set(transactions.map(tx => tx.network)));
  }, [transactions]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(tx => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesHash = tx.hash.toLowerCase().includes(query);
        const matchesFrom = (tx as any).from?.toLowerCase().includes(query);
        const matchesTo = (tx as any).to?.toLowerCase().includes(query);
        if (!matchesHash && !matchesFrom && !matchesTo) return false;
      }

      // State filter
      if (filterState !== 'all' && tx.state !== filterState) return false;

      // Network filter
      if (filterNetwork !== 'all' && tx.network !== filterNetwork) return false;

      // Date range filter
      if (dateRange !== 'all') {
        const now = Date.now();
        const txTime = new Date(tx.timestamp).getTime();
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        if (now - txTime > days * 24 * 60 * 60 * 1000) return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'date') {
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sortBy === 'value') {
        const aValue = parseFloat(a.value?.split(' ')[0] || '0');
        const bValue = parseFloat(b.value?.split(' ')[0] || '0');
        comparison = aValue - bValue;
      } else if (sortBy === 'gas') {
        const aGas = parseFloat(a.gasPrice?.split(' ')[0] || '0');
        const bGas = parseFloat(b.gasPrice?.split(' ')[0] || '0');
        comparison = aGas - bGas;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, searchQuery, filterState, filterNetwork, dateRange, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Export to CSV
  const handleExport = () => {
    const headers = ['Hash', 'State', 'Network', 'Value', 'Gas Price', 'Timestamp'];
    const rows = filteredTransactions.map(tx => [
      tx.hash,
      tx.state,
      tx.network,
      tx.value || '',
      tx.gasPrice || '',
      new Date(tx.timestamp).toISOString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Transactions exported to CSV');
  };

  const stateIcons = {
    confirmed: <CheckCircle className="w-4 h-4 text-emerald-400" />,
    failed: <XCircle className="w-4 h-4 text-red-500" />,
    pending: <Clock className="w-4 h-4 text-yellow-500" />,
    replaced: <ArrowUpDown className="w-4 h-4 text-orange-500" />,
    dropped: <AlertTriangle className="w-4 h-4 text-gray-500" />,
  };

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <Card className="p-4 bg-[#1a1a1a] border-[#2a2a2a]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search by hash or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#0f0f0f] border-[#2a2a2a] text-white"
              />
            </div>
          </div>

          {/* State Filter */}
          <Select value={filterState} onValueChange={(v) => setFilterState(v as any)}>
            <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] text-white">
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
              <SelectItem value="all">All States</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="replaced">Replaced</SelectItem>
              <SelectItem value="dropped">Dropped</SelectItem>
            </SelectContent>
          </Select>

          {/* Network Filter */}
          <Select value={filterNetwork} onValueChange={setFilterNetwork}>
            <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] text-white">
              <SelectValue placeholder="All Networks" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
              <SelectItem value="all">All Networks</SelectItem>
              {networks.map(network => (
                <SelectItem key={network} value={network}>{network}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range */}
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
            <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] text-white">
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort and Export */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (sortBy === 'date') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('date');
                  setSortOrder('desc');
                }
              }}
              className={`border-[#2a2a2a] ${sortBy === 'date' ? 'text-emerald-400' : 'text-gray-400'}`}
            >
              Date {sortBy === 'date' && <ArrowUpDown className="w-3 h-3 ml-1" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (sortBy === 'value') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('value');
                  setSortOrder('desc');
                }
              }}
              className={`border-[#2a2a2a] ${sortBy === 'value' ? 'text-emerald-400' : 'text-gray-400'}`}
            >
              Value {sortBy === 'value' && <ArrowUpDown className="w-3 h-3 ml-1" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (sortBy === 'gas') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('gas');
                  setSortOrder('desc');
                }
              }}
              className={`border-[#2a2a2a] ${sortBy === 'gas' ? 'text-emerald-400' : 'text-gray-400'}`}
            >
              Gas {sortBy === 'gas' && <ArrowUpDown className="w-3 h-3 ml-1" />}
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="border-[#2a2a2a] text-gray-400 hover:text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          Showing {paginatedTransactions.length} of {filteredTransactions.length} transactions
        </span>
        <span>
          Page {currentPage} of {totalPages}
        </span>
      </div>

      {/* Transaction List */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a] overflow-hidden">
        <ScrollArea className="h-[600px]">
          <div className="divide-y divide-[#2a2a2a]">
            {paginatedTransactions.map((tx) => (
              <button
                key={tx.hash}
                onClick={() => setSelectedTx(tx)}
                className="w-full p-4 hover:bg-[#1f1f1f] transition-colors text-left"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {stateIcons[tx.state]}
                  </div>

                  {/* Transaction Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-mono text-sm truncate">
                        {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                      </span>
                      <Badge variant="outline" className="text-xs bg-[#0f0f0f] border-[#2a2a2a]">
                        {tx.network}
                      </Badge>
                      {(tx as any).type && (
                        <Badge variant="outline" className="text-xs bg-[#0f0f0f] border-[#2a2a2a]">
                          {(tx as any).type}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(tx.timestamp).toLocaleString()}
                    </div>
                  </div>

                  {/* Value and Gas */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-white text-sm font-mono mb-1">
                      {tx.value}
                    </div>
                    <div className="text-xs text-gray-500">
                      Gas: {tx.gasPrice}
                    </div>
                  </div>

                  {/* External Link */}
                  <ExternalLink className="w-4 h-4 text-gray-500 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="border-[#2a2a2a]"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const page = i + 1;
          return (
            <Button
              key={page}
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(page)}
              className={`border-[#2a2a2a] ${
                currentPage === page ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''
              }`}
            >
              {page}
            </Button>
          );
        })}
        
        {totalPages > 5 && <span className="text-gray-500">...</span>}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="border-[#2a2a2a]"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Transaction Detail Modal */}
      <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a]">
          <DialogHeader>
            <DialogTitle className="text-white">Transaction Details</DialogTitle>
          </DialogHeader>
          
          {selectedTx && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <div className="flex items-center gap-2">
                    {stateIcons[selectedTx.state]}
                    <span className="text-white capitalize">{selectedTx.state}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Hash:</span>
                  <span className="text-white font-mono text-xs">
                    {selectedTx.hash.slice(0, 20)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Network:</span>
                  <span className="text-white">{selectedTx.network}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Value:</span>
                  <span className="text-white font-mono">{selectedTx.value}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Gas Price:</span>
                  <span className="text-white font-mono">{selectedTx.gasPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Timestamp:</span>
                  <span className="text-white">
                    {new Date(selectedTx.timestamp).toLocaleString()}
                  </span>
                </div>
                {(selectedTx as any).mevRisk !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">MEV Risk:</span>
                    <Badge 
                      variant="outline"
                      className={
                        (selectedTx as any).mevRisk > 70 
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : (selectedTx as any).mevRisk > 40
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }
                    >
                      {(selectedTx as any).mevRisk}%
                    </Badge>
                  </div>
                )}
              </div>

              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  window.open(`https://etherscan.io/tx/${selectedTx.hash}`, '_blank');
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Explorer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
