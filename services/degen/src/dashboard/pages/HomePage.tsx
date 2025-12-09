import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, DollarSign, Activity, Clock,
  BarChart3, Percent, Zap, Target, ChevronRight, AlertCircle,
  Play, Pause, Wallet, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  MobileContainer, PageHeader, Section, Card, StatCard,
  Badge, Button, cn, ProgressBar, ListItem, Divider
} from '../components/ui';
import { useAppStore } from '../store/appStore';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    status, 
    stats, 
    positions, 
    alerts,
    isLoading,
    fetchInitialData,
    toggleSystem,
    connect
  } = useAppStore();

  useEffect(() => {
    connect();
    fetchInitialData();
  }, []);

  // Calculate total portfolio value
  const totalPortfolioValue = positions.reduce((acc, pos) => acc + (pos.currentValueUSD || 0), 0);

  return (
    <MobileContainer>
      {/* Header */}
      <PageHeader 
        title="APEX Sniper" 
        subtitle={status.running ? 'System Active' : 'System Inactive'}
        action={
          <Button 
            variant={status.running ? 'danger' : 'success'}
            size="sm"
            onClick={toggleSystem}
          >
            {status.running ? <Pause size={16} /> : <Play size={16} />}
            {status.running ? 'Stop' : 'Start'}
          </Button>
        }
      />

      {/* Portfolio Overview */}
      <Section>
        <Card className="p-5 bg-gradient-to-br from-accent-cyan/10 to-accent-purple/10" glow>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-dark-400 text-sm">Total Portfolio Value</p>
              <p className="text-3xl font-bold text-white mt-1">
                ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium',
              stats.totalPnL >= 0 
                ? 'bg-accent-green/10 text-accent-green' 
                : 'bg-accent-red/10 text-accent-red'
            )}>
              {stats.totalPnL >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {stats.totalPnL >= 0 ? '+' : ''}{stats.totalPnL.toFixed(2)}%
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-dark-500 text-xs uppercase">Realized P&L</p>
              <p className={cn(
                'text-lg font-semibold',
                stats.realizedPnL >= 0 ? 'text-accent-green' : 'text-accent-red'
              )}>
                ${stats.realizedPnL.toFixed(2)}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-dark-500 text-xs uppercase">Unrealized P&L</p>
              <p className={cn(
                'text-lg font-semibold',
                stats.unrealizedPnL >= 0 ? 'text-accent-green' : 'text-accent-red'
              )}>
                ${stats.unrealizedPnL.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
      </Section>

      {/* Quick Stats */}
      <Section>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Win Rate"
            value={`${stats.winRate.toFixed(1)}%`}
            icon={<Percent size={18} />}
            color="green"
            compact
          />
          <StatCard
            label="Total Trades"
            value={stats.totalTrades}
            icon={<BarChart3 size={18} />}
            color="cyan"
            compact
          />
          <StatCard
            label="Avg Latency"
            value={`${stats.avgLatencyMs.toFixed(0)}ms`}
            icon={<Clock size={18} />}
            color="purple"
            compact
          />
          <StatCard
            label="Open Positions"
            value={status.openPositions}
            icon={<Target size={18} />}
            color="orange"
            compact
          />
        </div>
      </Section>

      {/* System Status */}
      <Section title="System Status">
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  status.mempoolConnected ? 'bg-accent-green animate-pulse' : 'bg-accent-red'
                )} />
                <span className="text-dark-300">Mempool Connection</span>
              </div>
              <Badge variant={status.mempoolConnected ? 'success' : 'error'}>
                {status.mempoolConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            <Divider />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-accent-cyan" />
                <span className="text-dark-300">Auto-Snipe</span>
              </div>
              <Badge variant={status.autoSnipe ? 'success' : 'warning'}>
                {status.autoSnipe ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <Divider />
            <div className="flex items-center justify-between">
              <span className="text-dark-300">Pending Snipes</span>
              <span className="text-accent-cyan font-semibold">{status.pendingSnipes}</span>
            </div>
            <Divider />
            <div className="flex items-center justify-between">
              <span className="text-dark-300">Tracked Wallets</span>
              <span className="text-accent-purple font-semibold">{status.trackedWallets}</span>
            </div>
          </div>
        </Card>
      </Section>

      {/* Open Positions Quick View */}
      <Section 
        title="Open Positions"
        action={
          positions.length > 0 && (
            <button 
              onClick={() => navigate('/positions')}
              className="text-accent-cyan text-sm flex items-center gap-1"
            >
              View All <ChevronRight size={16} />
            </button>
          )
        }
      >
        <Card>
          {positions.length === 0 ? (
            <div className="p-8 text-center">
              <Target className="mx-auto mb-3 text-dark-600" size={32} />
              <p className="text-dark-400">No open positions</p>
              <Button 
                variant="secondary" 
                size="sm" 
                className="mt-4"
                onClick={() => navigate('/trade')}
              >
                Start Trading
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-dark-800">
              {positions.slice(0, 3).map((pos) => (
                <div 
                  key={pos.id}
                  className="p-4 flex items-center justify-between cursor-pointer active:bg-dark-800/50"
                  onClick={() => navigate(`/positions/${pos.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-cyan/10 flex items-center justify-center text-accent-cyan font-bold">
                      {pos.tokenInfo?.symbol?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-white font-medium">{pos.tokenInfo?.symbol || 'Unknown'}</p>
                      <p className="text-dark-400 text-sm">
                        {new Date(pos.entryTimestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      'font-bold',
                      pos.unrealizedPnLPercentage >= 0 ? 'text-accent-green' : 'text-accent-red'
                    )}>
                      {pos.unrealizedPnLPercentage >= 0 ? '+' : ''}{pos.unrealizedPnLPercentage.toFixed(2)}%
                    </p>
                    <p className="text-dark-400 text-sm">
                      ${pos.currentValueUSD?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </Section>

      {/* Recent Alerts */}
      <Section 
        title="Recent Activity"
        action={
          alerts.length > 0 && (
            <button 
              onClick={() => navigate('/alerts')}
              className="text-accent-cyan text-sm flex items-center gap-1"
            >
              View All <ChevronRight size={16} />
            </button>
          )
        }
      >
        <Card>
          {alerts.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="mx-auto mb-3 text-dark-600" size={32} />
              <p className="text-dark-400">No recent activity</p>
            </div>
          ) : (
            <div className="divide-y divide-dark-800 max-h-64 overflow-y-auto">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                      alert.severity === 'CRITICAL' || alert.severity === 'ERROR' 
                        ? 'bg-accent-red/10 text-accent-red'
                        : alert.severity === 'WARNING'
                        ? 'bg-accent-orange/10 text-accent-orange'
                        : 'bg-accent-cyan/10 text-accent-cyan'
                    )}>
                      <AlertCircle size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm">{alert.title}</p>
                      <p className="text-dark-400 text-xs truncate">{alert.message}</p>
                    </div>
                    <span className="text-dark-500 text-xs flex-shrink-0">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </Section>

      {/* Quick Actions */}
      <Section>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="primary" 
            size="lg" 
            fullWidth
            onClick={() => navigate('/trade')}
          >
            <TrendingUp size={20} />
            Quick Buy
          </Button>
          <Button 
            variant="secondary" 
            size="lg" 
            fullWidth
            onClick={() => navigate('/analyze')}
          >
            <Target size={20} />
            Analyze Token
          </Button>
        </div>
      </Section>
    </MobileContainer>
  );
};

export default HomePage;
