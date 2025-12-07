/**
 * Unified Dashboard Component
 * Merges GuardianX security features with GuardiaVault inheritance capabilities
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, TrendingUp, AlertTriangle, Bell, ChevronRight,
  Lock, Zap, Globe, CreditCard, Gift, MessageSquare, Settings,
  Activity, ArrowUpRight, ArrowDownRight, Info, Plus, Search
} from 'lucide-react';

// Import unified hooks
import { useUnifiedWallet } from '../hooks/useUnifiedWallet';
import { useInheritanceVaults } from '../hooks/useInheritanceVaults';
import { useSecurityMonitor } from '../hooks/useSecurityMonitor';
import { useAIAssistant } from '../hooks/useAIAssistant';
import { useCrossChain } from '../hooks/useCrossChain';

// Import components
import { PortfolioCard } from './cards/PortfolioCard';
import { SecurityScoreCard } from './cards/SecurityScoreCard';
import { VaultStatusCard } from './cards/VaultStatusCard';
import { QuickActionsBar } from './QuickActionsBar';
import { ThreatFeed } from './ThreatFeed';
import { NotificationPanel } from './NotificationPanel';
import { AIAssistantFloat } from './AIAssistantFloat';
import { BottomNavigation } from './mobile/BottomNavigation';
import { PullToRefresh } from './mobile/PullToRefresh';

// Types
interface DashboardProps {
  className?: string;
  onNavigate?: (screen: string) => void;
}

interface PortfolioData {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  chains: ChainBalance[];
  topAssets: Asset[];
}

interface ChainBalance {
  chain: string;
  balance: number;
  logo: string;
}

interface Asset {
  symbol: string;
  name: string;
  balance: number;
  value: number;
  change24h: number;
}

interface SecurityStatus {
  score: number;
  level: 'safe' | 'warning' | 'danger';
  threats: Threat[];
  savedFromMEV: number;
  blockedScams: number;
}

interface Threat {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  action?: string;
}

interface VaultSummary {
  activeVaults: number;
  nextCheckIn: string;
  guardianAlerts: number;
  beneficiaryStatus: string;
  totalValue: number;
  pendingActions: number;
}

const UnifiedDashboard: React.FC<DashboardProps> = ({
  className = '',
  onNavigate
}) => {
  // State
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChain, setSelectedChain] = useState<string>('all');
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Hooks
  const { wallet, portfolio, loading: walletLoading } = useUnifiedWallet();
  const { vaults, checkInStatus, guardianAlerts } = useInheritanceVaults();
  const { securityScore, threats, mevSavings, scamsBlocked } = useSecurityMonitor();
  const { messages, sendMessage } = useAIAssistant();
  const { chains, bridgeQuote } = useCrossChain();

  // Calculate portfolio data
  const portfolioData = useMemo<PortfolioData>(() => {
    if (!portfolio) {
      return {
        totalValue: 0,
        dayChange: 0,
        dayChangePercent: 0,
        chains: [],
        topAssets: []
      };
    }

    const totalValue = portfolio.chains.reduce((sum, chain) => sum + chain.totalValue, 0);
    const dayChange = portfolio.dayChange || 0;
    const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0;

    return {
      totalValue,
      dayChange,
      dayChangePercent,
      chains: portfolio.chains.map(c => ({
        chain: c.name,
        balance: c.totalValue,
        logo: c.logo
      })),
      topAssets: portfolio.topAssets || []
    };
  }, [portfolio]);

  // Calculate security status
  const securityStatus = useMemo<SecurityStatus>(() => ({
    score: securityScore || 100,
    level: securityScore >= 80 ? 'safe' : securityScore >= 60 ? 'warning' : 'danger',
    threats: threats || [],
    savedFromMEV: mevSavings || 0,
    blockedScams: scamsBlocked || 0
  }), [securityScore, threats, mevSavings, scamsBlocked]);

  // Calculate vault summary
  const vaultSummary = useMemo<VaultSummary>(() => ({
    activeVaults: vaults?.filter(v => v.status === 'active').length || 0,
    nextCheckIn: checkInStatus?.nextDue || 'Not set',
    guardianAlerts: guardianAlerts?.length || 0,
    beneficiaryStatus: vaults?.some(v => v.hasPendingClaims) ? 'Claims pending' : 'All secure',
    totalValue: vaults?.reduce((sum, v) => sum + v.totalValue, 0) || 0,
    pendingActions: guardianAlerts?.filter(a => !a.resolved).length || 0
  }), [vaults, checkInStatus, guardianAlerts]);

  // Handlers
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Refresh all data
      await Promise.all([
        wallet.refresh(),
        vaults.refresh(),
        securityMonitor.refresh()
      ]);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [wallet, vaults]);

  const handleQuickAction = useCallback((action: string) => {
    if (onNavigate) {
      onNavigate(action);
    }
  }, [onNavigate]);

  // Greeting based on time
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = wallet?.name || 'there';
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 18) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  }, [wallet]);

  return (
    <PullToRefresh onRefresh={handleRefresh} refreshing={refreshing}>
      <div className={`unified-dashboard ${className}`}>
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-content">
            <div className="greeting-section">
              <h1 className="greeting">{greeting}</h1>
              <p className="subtitle">Your unified wallet & inheritance hub</p>
            </div>
            
            <div className="header-actions">
              <button
                className="notification-btn"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} />
                {vaultSummary.pendingActions > 0 && (
                  <span className="notification-badge">{vaultSummary.pendingActions}</span>
                )}
              </button>
              
              <button className="settings-btn" onClick={() => handleQuickAction('settings')}>
                <Settings size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Security Score Banner */}
        <SecurityScoreCard
          score={securityStatus.score}
          level={securityStatus.level}
          savedFromMEV={securityStatus.savedFromMEV}
          blockedScams={securityStatus.blockedScams}
          onClick={() => handleQuickAction('security')}
        />

        {/* Portfolio Overview */}
        <PortfolioCard
          totalValue={portfolioData.totalValue}
          dayChange={portfolioData.dayChange}
          dayChangePercent={portfolioData.dayChangePercent}
          chains={portfolioData.chains}
          topAssets={portfolioData.topAssets}
          selectedChain={selectedChain}
          onChainSelect={setSelectedChain}
          onViewDetails={() => handleQuickAction('portfolio')}
        />

        {/* Quick Actions */}
        <QuickActionsBar
          actions={[
            {
              id: 'send',
              icon: <ArrowUpRight />,
              label: 'Send',
              color: 'blue',
              onClick: () => handleQuickAction('send')
            },
            {
              id: 'receive',
              icon: <ArrowDownRight />,
              label: 'Receive',
              color: 'green',
              onClick: () => handleQuickAction('receive')
            },
            {
              id: 'swap',
              icon: <Activity />,
              label: 'Swap',
              color: 'purple',
              onClick: () => handleQuickAction('swap')
            },
            {
              id: 'bridge',
              icon: <Globe />,
              label: 'Bridge',
              color: 'orange',
              onClick: () => handleQuickAction('bridge')
            }
          ]}
        />

        {/* Vault Status */}
        <VaultStatusCard
          activeVaults={vaultSummary.activeVaults}
          nextCheckIn={vaultSummary.nextCheckIn}
          guardianAlerts={vaultSummary.guardianAlerts}
          beneficiaryStatus={vaultSummary.beneficiaryStatus}
          totalValue={vaultSummary.totalValue}
          onManageVaults={() => handleQuickAction('vaults')}
          onCheckIn={() => handleQuickAction('checkin')}
        />

        {/* Feature Cards Grid */}
        <div className="feature-grid">
          {/* Guardian Management */}
          <motion.div
            className="feature-card"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleQuickAction('guardians')}
          >
            <div className="card-icon guardian">
              <Users size={24} />
            </div>
            <div className="card-content">
              <h3>Guardian Network</h3>
              <p>{vaults?.reduce((sum, v) => sum + v.guardians.length, 0) || 0} active guardians</p>
              {vaultSummary.guardianAlerts > 0 && (
                <span className="alert-badge">{vaultSummary.guardianAlerts} alerts</span>
              )}
            </div>
            <ChevronRight className="card-arrow" size={20} />
          </motion.div>

          {/* Yield & Staking */}
          <motion.div
            className="feature-card"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleQuickAction('yield')}
          >
            <div className="card-icon yield">
              <TrendingUp size={24} />
            </div>
            <div className="card-content">
              <h3>Yield Earnings</h3>
              <p className="yield-apy">12.4% APY average</p>
              <span className="yield-earned">+$234.50 this month</span>
            </div>
            <ChevronRight className="card-arrow" size={20} />
          </motion.div>

          {/* Legacy Messages */}
          <motion.div
            className="feature-card"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleQuickAction('messages')}
          >
            <div className="card-icon messages">
              <MessageSquare size={24} />
            </div>
            <div className="card-content">
              <h3>Legacy Messages</h3>
              <p>{vaults?.reduce((sum, v) => sum + v.messages.length, 0) || 0} messages stored</p>
              <span className="messages-status">Encrypted & secure</span>
            </div>
            <ChevronRight className="card-arrow" size={20} />
          </motion.div>

          {/* MEV Protection */}
          <motion.div
            className="feature-card"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleQuickAction('protection')}
          >
            <div className="card-icon protection">
              <Shield size={24} />
            </div>
            <div className="card-content">
              <h3>MEV Protection</h3>
              <p className="protection-status">Active on all chains</p>
              <span className="protection-saved">Saved ${securityStatus.savedFromMEV}</span>
            </div>
            <ChevronRight className="card-arrow" size={20} />
          </motion.div>
        </div>

        {/* Threat Feed */}
        {threats && threats.length > 0 && (
          <ThreatFeed
            threats={securityStatus.threats}
            onViewAll={() => handleQuickAction('threats')}
            onResolve={(threatId) => securityMonitor.resolveThreat(threatId)}
          />
        )}

        {/* AI Assistant Float */}
        <AIAssistantFloat
          messages={messages}
          onSendMessage={sendMessage}
          suggestions={[
            'Check vault security',
            'Optimize yield strategy',
            'Review guardian trust scores',
            'Analyze recent transactions'
          ]}
        />

        {/* Notifications Panel */}
        <AnimatePresence>
          {showNotifications && (
            <NotificationPanel
              notifications={[
                ...guardianAlerts.map(alert => ({
                  id: alert.id,
                  type: 'guardian' as const,
                  title: alert.title,
                  message: alert.message,
                  timestamp: alert.timestamp,
                  action: alert.action
                })),
                ...threats.map(threat => ({
                  id: threat.id,
                  type: 'threat' as const,
                  title: `${threat.severity} severity threat`,
                  message: threat.message,
                  timestamp: threat.timestamp,
                  action: threat.action
                }))
              ]}
              onClose={() => setShowNotifications(false)}
              onAction={(id, action) => {
                // Handle notification actions
                console.log('Notification action:', id, action);
              }}
            />
          )}
        </AnimatePresence>

        {/* Mobile Bottom Navigation */}
        <BottomNavigation
          activeTab="dashboard"
          onTabChange={handleQuickAction}
        />
      </div>

      <style jsx>{`
        .unified-dashboard {
          min-height: 100vh;
          background: var(--color-obsidian);
          color: var(--color-slate-50);
          padding-bottom: 80px; /* Space for bottom nav */
        }

        .dashboard-header {
          padding: 1.5rem;
          background: linear-gradient(135deg, 
            rgba(0, 191, 255, 0.1) 0%, 
            rgba(139, 92, 246, 0.05) 100%);
          border-bottom: 1px solid var(--glass-border);
          backdrop-filter: blur(20px);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1400px;
          margin: 0 auto;
        }

        .greeting {
          font-size: 1.75rem;
          font-weight: 600;
          margin: 0;
          background: linear-gradient(135deg, #00BFFF 0%, #8B5CF6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .subtitle {
          font-size: 0.875rem;
          color: var(--color-slate-400);
          margin: 0.25rem 0 0 0;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .notification-btn,
        .settings-btn {
          position: relative;
          padding: 0.625rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          color: var(--color-slate-300);
          cursor: pointer;
          transition: all 0.2s;
        }

        .notification-btn:hover,
        .settings-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .notification-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          background: var(--color-danger);
          color: white;
          font-size: 0.625rem;
          font-weight: 600;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
          padding: 1rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .feature-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .feature-card:hover {
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 8px 32px rgba(0, 191, 255, 0.1);
        }

        .card-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .card-icon.guardian {
          background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
        }

        .card-icon.yield {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
        }

        .card-icon.messages {
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
        }

        .card-icon.protection {
          background: linear-gradient(135deg, #00BFFF 0%, #0099FF 100%);
        }

        .card-content {
          flex: 1;
        }

        .card-content h3 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 0.25rem 0;
        }

        .card-content p {
          font-size: 0.875rem;
          color: var(--color-slate-400);
          margin: 0;
        }

        .alert-badge,
        .yield-earned,
        .messages-status,
        .protection-saved {
          display: inline-block;
          margin-top: 0.25rem;
          padding: 0.125rem 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .alert-badge {
          background: rgba(239, 68, 68, 0.2);
          color: #EF4444;
        }

        .yield-earned {
          background: rgba(16, 185, 129, 0.2);
          color: #10B981;
        }

        .protection-saved {
          background: rgba(0, 191, 255, 0.2);
          color: #00BFFF;
        }

        .card-arrow {
          color: var(--color-slate-500);
          transition: transform 0.2s;
        }

        .feature-card:hover .card-arrow {
          transform: translateX(4px);
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .dashboard-header {
            padding: 1rem;
          }

          .greeting {
            font-size: 1.5rem;
          }

          .feature-grid {
            grid-template-columns: 1fr;
            padding: 0.75rem;
          }

          .feature-card {
            padding: 1rem;
          }
        }
      `}</style>
    </PullToRefresh>
  );
};

export default UnifiedDashboard;

