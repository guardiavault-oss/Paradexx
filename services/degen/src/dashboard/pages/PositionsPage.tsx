import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, TrendingUp, TrendingDown, Clock, DollarSign,
  Target, ChevronRight, ArrowUpRight, ArrowDownRight,
  MoreVertical, X, Trash2, Edit, ExternalLink, RefreshCw
} from 'lucide-react';
import {
  MobileContainer, PageHeader, Section, Card, Button,
  Badge, Tabs, cn, Divider, EmptyState, Skeleton, TokenCard
} from '../components/ui';
import { useAppStore } from '../store/appStore';

// Position Detail Modal
const PositionDetail: React.FC<{
  position: any;
  onClose: () => void;
  onSell: () => void;
}> = ({ position, onClose, onSell }) => {
  const formatDate = (ts: number) => new Date(ts).toLocaleDateString();
  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString();
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-dark-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 bg-dark-900 rounded-t-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-dark-700" />
        </div>
        
        {/* Header */}
        <div className="px-6 pb-4 border-b border-dark-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent-cyan/10 flex items-center justify-center text-accent-cyan font-bold text-lg">
                {position.tokenInfo?.symbol?.charAt(0) || '?'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{position.tokenInfo?.symbol || 'Unknown'}</h2>
                <p className="text-dark-400 text-sm">{position.tokenInfo?.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-dark-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
        </div>
        
        {/* P&L Summary */}
        <div className="px-6 py-4">
          <Card className="p-4 bg-gradient-to-br from-accent-cyan/10 to-accent-purple/10">
            <div className="text-center">
              <p className="text-dark-400 text-sm">Unrealized P&L</p>
              <p className={cn(
                'text-3xl font-bold mt-1',
                position.unrealizedPnLPercentage >= 0 ? 'text-accent-green' : 'text-accent-red'
              )}>
                {position.unrealizedPnLPercentage >= 0 ? '+' : ''}{position.unrealizedPnLPercentage.toFixed(2)}%
              </p>
              <p className={cn(
                'text-lg font-medium mt-1',
                position.unrealizedPnL >= 0 ? 'text-accent-green' : 'text-accent-red'
              )}>
                {position.unrealizedPnL >= 0 ? '+' : ''}${position.unrealizedPnL?.toFixed(2) || '0.00'}
              </p>
            </div>
          </Card>
        </div>
        
        {/* Details */}
        <div className="px-6 space-y-4">
          <Card className="p-4">
            <h3 className="text-white font-semibold mb-3">Position Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-dark-400">Entry Date</span>
                <span className="text-white">{formatDate(position.entryTimestamp)}</span>
              </div>
              <Divider />
              <div className="flex justify-between">
                <span className="text-dark-400">Entry Price</span>
                <span className="text-white">${position.entryPrice?.toFixed(8) || 'N/A'}</span>
              </div>
              <Divider />
              <div className="flex justify-between">
                <span className="text-dark-400">Current Price</span>
                <span className="text-white">${position.currentPrice?.toFixed(8) || 'N/A'}</span>
              </div>
              <Divider />
              <div className="flex justify-between">
                <span className="text-dark-400">Current Value</span>
                <span className="text-accent-cyan font-semibold">
                  ${position.currentValueUSD?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </Card>
          
          {/* Take Profit Targets */}
          {position.takeProfitTargets && position.takeProfitTargets.length > 0 && (
            <Card className="p-4">
              <h3 className="text-white font-semibold mb-3">Take Profit Targets</h3>
              <div className="space-y-2">
                {position.takeProfitTargets.map((tp: any, idx: number) => (
                  <div 
                    key={idx}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-lg',
                      tp.triggered ? 'bg-accent-green/10' : 'bg-dark-800/50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {tp.triggered ? (
                        <div className="w-5 h-5 rounded-full bg-accent-green flex items-center justify-center">
                          <TrendingUp size={12} className="text-dark-900" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-dark-600" />
                      )}
                      <span className={tp.triggered ? 'text-accent-green' : 'text-white'}>
                        TP{idx + 1}: +{tp.percentage}%
                      </span>
                    </div>
                    <span className="text-dark-400 text-sm">
                      Sell {tp.sellPercentage}%
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
          
          {/* Stop Loss */}
          {position.stopLoss && (
            <Card className="p-4">
              <h3 className="text-white font-semibold mb-3">Stop Loss</h3>
              <div className={cn(
                'flex items-center justify-between p-2 rounded-lg',
                position.stopLoss.triggered ? 'bg-accent-red/10' : 'bg-dark-800/50'
              )}>
                <div className="flex items-center gap-2">
                  <TrendingDown size={16} className={position.stopLoss.triggered ? 'text-accent-red' : 'text-dark-400'} />
                  <span className={position.stopLoss.triggered ? 'text-accent-red' : 'text-white'}>
                    -{position.stopLoss.percentage}%
                  </span>
                </div>
                <Badge variant={position.stopLoss.triggered ? 'error' : 'info'}>
                  {position.stopLoss.triggered ? 'Triggered' : 'Active'}
                </Badge>
              </div>
            </Card>
          )}
        </div>
        
        {/* Actions */}
        <div className="px-6 py-6 mt-4 border-t border-dark-800">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="danger"
              size="lg"
              fullWidth
              onClick={onSell}
            >
              <TrendingDown size={20} />
              Sell Position
            </Button>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => window.open(`https://etherscan.io/token/${position.token}`, '_blank')}
            >
              <ExternalLink size={20} />
              Etherscan
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const PositionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { positionId } = useParams();
  const { positions, fetchInitialData, isLoading } = useAppStore();
  
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchInitialData();
    
    // Check if we have a position ID from URL
    if (positionId) {
      const pos = positions.find(p => p.id === positionId);
      if (pos) setSelectedPosition(pos);
    }
  }, [positionId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
  };

  // Calculate totals
  const totalValue = positions.reduce((acc, pos) => acc + (pos.currentValueUSD || 0), 0);
  const totalPnL = positions.reduce((acc, pos) => acc + (pos.unrealizedPnL || 0), 0);
  const avgPnLPercent = positions.length > 0
    ? positions.reduce((acc, pos) => acc + (pos.unrealizedPnLPercentage || 0), 0) / positions.length
    : 0;

  const openPositions = positions.filter(p => p.status === 'OPEN' || !p.status);
  const closedPositions = positions.filter(p => p.status === 'CLOSED');

  return (
    <MobileContainer>
      <PageHeader 
        title="Positions" 
        subtitle={`${openPositions.length} open positions`}
        action={
          <button 
            onClick={handleRefresh}
            className={cn(
              'p-2 text-dark-400 hover:text-white transition-colors',
              refreshing && 'animate-spin'
            )}
          >
            <RefreshCw size={20} />
          </button>
        }
      />

      {/* Portfolio Summary */}
      <Section>
        <Card className="p-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-dark-400 text-xs uppercase">Total Value</p>
              <p className="text-xl font-bold text-white mt-1">
                ${totalValue.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-dark-400 text-xs uppercase">Total P&L</p>
              <p className={cn(
                'text-xl font-bold mt-1',
                totalPnL >= 0 ? 'text-accent-green' : 'text-accent-red'
              )}>
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-dark-400 text-xs uppercase">Avg P&L %</p>
              <p className={cn(
                'text-xl font-bold mt-1',
                avgPnLPercent >= 0 ? 'text-accent-green' : 'text-accent-red'
              )}>
                {avgPnLPercent >= 0 ? '+' : ''}{avgPnLPercent.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
      </Section>

      {/* Tabs */}
      <Section>
        <Tabs
          tabs={[
            { id: 'open', label: `Open (${openPositions.length})` },
            { id: 'closed', label: `Closed (${closedPositions.length})` },
          ]}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as 'open' | 'closed')}
          variant="underline"
        />
      </Section>

      {/* Positions List */}
      <Section>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-16 mb-2" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (activeTab === 'open' ? openPositions : closedPositions).length === 0 ? (
          <EmptyState
            icon={<PieChart size={32} />}
            title={activeTab === 'open' ? 'No Open Positions' : 'No Closed Positions'}
            description={activeTab === 'open' 
              ? 'Start trading to see your positions here' 
              : 'Your closed positions will appear here'
            }
            action={activeTab === 'open' && (
              <Button 
                variant="primary" 
                onClick={() => navigate('/trade')}
              >
                Start Trading
              </Button>
            )}
          />
        ) : (
          <div className="space-y-3">
            {(activeTab === 'open' ? openPositions : closedPositions).map((position) => (
              <motion.div
                key={position.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card 
                  className="p-4" 
                  onClick={() => setSelectedPosition(position)}
                >
                  <div className="flex items-center gap-3">
                    {/* Token Icon */}
                    <div className="w-12 h-12 rounded-full bg-accent-cyan/10 flex items-center justify-center text-accent-cyan font-bold">
                      {position.tokenInfo?.symbol?.charAt(0) || '?'}
                    </div>
                    
                    {/* Token Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold">{position.tokenInfo?.symbol || 'Unknown'}</p>
                        {position.takeProfitTargets?.some((tp: any) => tp.triggered) && (
                          <Badge variant="success" size="sm">TP Hit</Badge>
                        )}
                      </div>
                      <p className="text-dark-400 text-sm">
                        ${position.currentValueUSD?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    
                    {/* P&L */}
                    <div className="text-right">
                      <p className={cn(
                        'text-lg font-bold',
                        position.unrealizedPnLPercentage >= 0 ? 'text-accent-green' : 'text-accent-red'
                      )}>
                        {position.unrealizedPnLPercentage >= 0 ? '+' : ''}{position.unrealizedPnLPercentage.toFixed(2)}%
                      </p>
                      <p className={cn(
                        'text-sm',
                        position.unrealizedPnL >= 0 ? 'text-accent-green' : 'text-accent-red'
                      )}>
                        {position.unrealizedPnL >= 0 ? '+' : ''}${position.unrealizedPnL?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    
                    <ChevronRight className="text-dark-500" size={20} />
                  </div>
                  
                  {/* Progress indicators */}
                  {position.takeProfitTargets && position.takeProfitTargets.length > 0 && (
                    <div className="flex gap-1 mt-3">
                      {position.takeProfitTargets.map((tp: any, idx: number) => (
                        <div 
                          key={idx}
                          className={cn(
                            'h-1 flex-1 rounded-full',
                            tp.triggered ? 'bg-accent-green' : 'bg-dark-700'
                          )}
                        />
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </Section>

      {/* Position Detail Modal */}
      <AnimatePresence>
        {selectedPosition && (
          <PositionDetail
            position={selectedPosition}
            onClose={() => setSelectedPosition(null)}
            onSell={() => {
              setSelectedPosition(null);
              navigate(`/trade?mode=sell&position=${selectedPosition.id}`);
            }}
          />
        )}
      </AnimatePresence>
    </MobileContainer>
  );
};

export default PositionsPage;
