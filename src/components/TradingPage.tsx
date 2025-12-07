import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getThemeStyles } from '../design-system';
import {
  TrendingUp, TrendingDown, Clock, Target, Shield,
  Repeat, AlertTriangle, Plus, X, ChevronDown,
  Zap, DollarSign, Percent, Calendar, Play, Pause,
  Trash2, ArrowRightLeft, Settings
} from 'lucide-react';

interface LimitOrder {
  id: string;
  type: 'limit_buy' | 'limit_sell' | 'stop_loss' | 'take_profit' | 'trailing_stop';
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  triggerPrice: string;
  status: 'active' | 'executed' | 'cancelled' | 'expired';
  createdAt: string;
}

interface DCAPlan {
  id: string;
  tokenSymbol: string;
  amountPerPurchase: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  status: 'active' | 'paused' | 'completed';
  nextPurchaseAt: string;
  purchases: number;
  totalSpent: number;
}

interface OrderFormData {
  type: 'limit_buy' | 'limit_sell' | 'stop_loss' | 'take_profit';
  tokenIn: string;
  tokenOut: string;
  amount: string;
  triggerPrice: string;
  slippage: number;
}

interface DCAFormData {
  tokenSymbol: string;
  amount: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  totalBudget: string;
}

interface TradingPageProps {
  type?: 'degen' | 'regen';
}

const TradingPage: React.FC<TradingPageProps> = ({ type = 'degen' }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'dca'>('orders');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showDCAModal, setShowDCAModal] = useState(false);

  // Mode colors
  const accentColor = type === 'degen' ? '#ff3366' : '#00d4ff';
  const accentSecondary = type === 'degen' ? '#ff9500' : '#00ff88';
  const accentGlow = type === 'degen'
    ? '0 0 40px rgba(255, 51, 102, 0.4)'
    : '0 0 40px rgba(0, 212, 255, 0.4)';

  // Mock data
  const orders: LimitOrder[] = [
    {
      id: '1',
      type: 'limit_buy',
      tokenIn: 'USDC',
      tokenOut: 'ETH',
      amountIn: '1000',
      triggerPrice: '2000',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'stop_loss',
      tokenIn: 'ETH',
      tokenOut: 'USDC',
      amountIn: '0.5',
      triggerPrice: '1800',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      type: 'limit_sell',
      tokenIn: 'BTC',
      tokenOut: 'USDC',
      amountIn: '0.02',
      triggerPrice: '50000',
      status: 'executed',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const dcaPlans: DCAPlan[] = [
    {
      id: '1',
      tokenSymbol: 'ETH',
      amountPerPurchase: '100',
      frequency: 'weekly',
      status: 'active',
      nextPurchaseAt: new Date(Date.now() + 172800000).toISOString(),
      purchases: 8,
      totalSpent: 800,
    },
    {
      id: '2',
      tokenSymbol: 'BTC',
      amountPerPurchase: '50',
      frequency: 'biweekly',
      status: 'paused',
      nextPurchaseAt: new Date(Date.now() + 604800000).toISOString(),
      purchases: 4,
      totalSpent: 200,
    },
  ];

  const [orderForm, setOrderForm] = useState<OrderFormData>({
    type: 'limit_buy',
    tokenIn: 'USDC',
    tokenOut: 'ETH',
    amount: '',
    triggerPrice: '',
    slippage: 1,
  });

  const [dcaForm, setDcaForm] = useState<DCAFormData>({
    tokenSymbol: 'ETH',
    amount: '100',
    frequency: 'weekly',
    totalBudget: '',
  });

  // Stats
  const stats = useMemo(() => {
    const activeOrders = orders.filter(o => o.status === 'active').length;
    const executedOrders = orders.filter(o => o.status === 'executed').length;
    const totalOrders = orders.length;
    const successRate = totalOrders > 0 ? (executedOrders / totalOrders) * 100 : 0;

    const activeDCA = dcaPlans.filter(p => p.status === 'active').length;
    const totalDCASpent = dcaPlans.reduce((sum, p) => sum + p.totalSpent, 0);

    return {
      activeOrders,
      executedOrders,
      successRate,
      totalVolume: '$12,450',
      activeDCA,
      totalDCASpent,
    };
  }, [orders, dcaPlans]);

  const getOrderTypeIcon = (orderType: string) => {
    switch (orderType) {
      case 'limit_buy': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'limit_sell': return <TrendingDown className="w-4 h-4 text-red-400" />;
      case 'stop_loss': return <Shield className="w-4 h-4 text-orange-400" />;
      case 'take_profit': return <Target className="w-4 h-4 text-emerald-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
      case 'executed': return { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' };
      case 'cancelled': return { bg: 'rgba(156, 163, 175, 0.1)', text: '#9ca3af', border: 'rgba(156, 163, 175, 0.3)' };
      case 'paused': return { bg: 'rgba(251, 146, 60, 0.1)', text: '#fb923c', border: 'rgba(251, 146, 60, 0.3)' };
      default: return { bg: 'rgba(156, 163, 175, 0.1)', text: '#9ca3af', border: 'rgba(156, 163, 175, 0.3)' };
    }
  };

  return (
    <main className="min-h-screen bg-[var(--bg-base)] px-4 pb-24 md:px-6 md:pb-20 lg:px-8" data-mode={type}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div
                className="p-2 md:p-3 rounded-xl md:rounded-2xl"
                style={{
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: `1px solid ${accentColor}40`,
                  boxShadow: `0 0 20px ${accentColor}20`,
                }}
              >
                <ArrowRightLeft className="w-5 h-5 md:w-6 md:h-6" style={{ color: accentColor }} />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl lg:text-4xl font-black text-[var(--text-primary)] tracking-tight">
                  Advanced Trading
                </h1>
                <p className="text-xs md:text-sm text-[var(--text-primary)]/50 mt-0.5 md:mt-1">
                  Automated orders and smart strategies
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 md:p-3 rounded-lg md:rounded-xl"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Settings className="w-4 h-4 md:w-5 md:h-5 text-[var(--text-primary)]/70" />
            </motion.button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="p-3 md:p-4 rounded-lg md:rounded-xl overflow-hidden"
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <p className="text-xs text-[var(--text-primary)]/40 mb-1 uppercase tracking-wider truncate">Active Orders</p>
              <p className="text-xl md:text-2xl font-black truncate" style={{ color: accentColor }}>
                {stats.activeOrders}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="p-3 md:p-4 rounded-lg md:rounded-xl overflow-hidden"
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <p className="text-xs text-[var(--text-primary)]/40 mb-1 uppercase tracking-wider truncate">Executed</p>
              <p className="text-xl md:text-2xl font-black text-green-400 truncate">
                {stats.executedOrders}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="p-3 md:p-4 rounded-lg md:rounded-xl overflow-hidden"
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <p className="text-xs text-[var(--text-primary)]/40 mb-1 uppercase tracking-wider truncate">Success Rate</p>
              <p className="text-xl md:text-2xl font-black text-emerald-400 truncate">
                {stats.successRate.toFixed(0)}%
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="p-3 md:p-4 rounded-lg md:rounded-xl overflow-hidden"
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <p className="text-xs text-[var(--text-primary)]/40 mb-1 uppercase tracking-wider truncate">Total Volume</p>
              <p className="text-xl md:text-2xl font-black truncate" style={{ color: accentSecondary }}>
                {stats.totalVolume}
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-2 md:gap-3 mb-4 md:mb-6"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('orders')}
            className="flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl text-sm md:text-base font-bold transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              background: activeTab === 'orders' ? accentColor : 'rgba(0, 0, 0, 0.4)',
              border: `1px solid ${activeTab === 'orders' ? accentColor : 'rgba(255, 255, 255, 0.1)'}`,
              color: 'white',
              boxShadow: activeTab === 'orders' ? accentGlow : 'none',
            }}
          >
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Limit Orders</span>
            <span className="sm:hidden">Orders</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('dca')}
            className="flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl text-sm md:text-base font-bold transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              background: activeTab === 'dca' ? accentColor : 'rgba(0, 0, 0, 0.4)',
              border: `1px solid ${activeTab === 'dca' ? accentColor : 'rgba(255, 255, 255, 0.1)'}`,
              color: 'white',
              boxShadow: activeTab === 'dca' ? accentGlow : 'none',
            }}
          >
            <Repeat className="w-4 h-4" />
            <span className="hidden sm:inline">DCA Bot</span>
            <span className="sm:hidden">DCA</span>
          </motion.button>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'orders' ? (
            <motion.div
              key="orders"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Create Order Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowOrderModal(true)}
                className="mb-6 px-6 py-3 rounded-xl font-bold flex items-center gap-2"
                style={{
                  background: accentColor,
                  color: 'white',
                  boxShadow: accentGlow,
                }}
              >
                <Plus className="w-5 h-5" />
                Create Limit Order
              </motion.button>

              {/* Orders List */}
              <div className="space-y-3">
                {orders.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-2xl"
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div
                      className="w-20 h-20 mb-6 rounded-3xl flex items-center justify-center"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Target className="w-10 h-10 text-[var(--text-primary)]/30" />
                    </div>
                    <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">
                      No Orders Yet
                    </h3>
                    <p className="text-sm text-[var(--text-primary)]/50 max-w-sm">
                      Create your first limit order to automate your trading
                    </p>
                  </motion.div>
                ) : (
                  orders.map((order, index) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      index={index}
                      accentColor={accentColor}
                      getOrderTypeIcon={getOrderTypeIcon}
                      getStatusColor={getStatusColor}
                    />
                  ))
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="dca"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Create DCA Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowDCAModal(true)}
                className="mb-6 px-6 py-3 rounded-xl font-bold flex items-center gap-2"
                style={{
                  background: accentColor,
                  color: 'white',
                  boxShadow: accentGlow,
                }}
              >
                <Plus className="w-5 h-5" />
                Create DCA Plan
              </motion.button>

              {/* DCA Plans List */}
              <div className="space-y-3">
                {dcaPlans.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-2xl"
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div
                      className="w-20 h-20 mb-6 rounded-3xl flex items-center justify-center"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Repeat className="w-10 h-10 text-[var(--text-primary)]/30" />
                    </div>
                    <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">
                      No DCA Plans Yet
                    </h3>
                    <p className="text-sm text-[var(--text-primary)]/50 max-w-sm">
                      Set up recurring purchases to dollar cost average
                    </p>
                  </motion.div>
                ) : (
                  dcaPlans.map((plan, index) => (
                    <DCACard
                      key={plan.id}
                      plan={plan}
                      index={index}
                      accentColor={accentColor}
                      accentSecondary={accentSecondary}
                      getStatusColor={getStatusColor}
                    />
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Order Modal */}
        <OrderModal
          show={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          orderForm={orderForm}
          setOrderForm={setOrderForm}
          accentColor={accentColor}
          accentGlow={accentGlow}
        />

        {/* DCA Modal */}
        <DCAModal
          show={showDCAModal}
          onClose={() => setShowDCAModal(false)}
          dcaForm={dcaForm}
          setDcaForm={setDcaForm}
          accentColor={accentColor}
          accentSecondary={accentSecondary}
          accentGlow={accentGlow}
        />
      </div>
    </main>
  );
};

// Order Card Component
interface OrderCardProps {
  order: LimitOrder;
  index: number;
  accentColor: string;
  getOrderTypeIcon: (type: string) => React.ReactNode;
  getStatusColor: (status: string) => { bg: string; text: string; border: string };
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  index,
  accentColor,
  getOrderTypeIcon,
  getStatusColor
}) => {
  const statusStyle = getStatusColor(order.status);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ x: 4, scale: 1.01 }}
      className="p-5 rounded-xl group relative overflow-hidden"
      style={{
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = accentColor + '40';
        e.currentTarget.style.boxShadow = `0 0 30px ${accentColor}20`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Order Info */}
        <div className="flex items-center gap-4 flex-1">
          <div
            className="p-3 rounded-xl"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {getOrderTypeIcon(order.type)}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base font-black text-[var(--text-primary)]">
                {order.type.replace('_', ' ').toUpperCase()}
              </span>
              <span
                className="px-2 py-0.5 rounded text-xs font-bold"
                style={{
                  background: statusStyle.bg,
                  color: statusStyle.text,
                  border: `1px solid ${statusStyle.border}`,
                }}
              >
                {order.status}
              </span>
            </div>
            <p className="text-sm text-[var(--text-primary)]/60">
              {order.amountIn} {order.tokenIn} → {order.tokenOut}
            </p>
          </div>
        </div>

        {/* Trigger Price */}
        <div className="text-right">
          <p className="text-xs text-[var(--text-primary)]/40 mb-1">Trigger Price</p>
          <p className="text-lg font-bold text-[var(--text-primary)]">
            ${parseFloat(order.triggerPrice).toLocaleString()}
          </p>
        </div>

        {/* Actions */}
        {order.status === 'active' && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-lg"
            style={{
              background: 'rgba(255, 77, 77, 0.2)',
              border: '1px solid rgba(255, 77, 77, 0.4)',
            }}
          >
            <X className="w-5 h-5 text-red-400" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

// DCA Card Component
interface DCACardProps {
  plan: DCAPlan;
  index: number;
  accentColor: string;
  accentSecondary: string;
  getStatusColor: (status: string) => { bg: string; text: string; border: string };
}

const DCACard: React.FC<DCACardProps> = ({
  plan,
  index,
  accentColor,
  accentSecondary,
  getStatusColor
}) => {
  const statusStyle = getStatusColor(plan.status);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ x: 4, scale: 1.01 }}
      className="p-5 rounded-xl group relative overflow-hidden"
      style={{
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = accentColor + '40';
        e.currentTarget.style.boxShadow = `0 0 30px ${accentColor}20`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        {/* Plan Info */}
        <div className="flex items-center gap-4 flex-1">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, ${accentSecondary})`,
              boxShadow: `0 0 20px ${accentColor}40`,
            }}
          >
            <Repeat className="w-7 h-7 text-[var(--text-primary)]" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-black text-[var(--text-primary)]">
                {plan.tokenSymbol}
              </span>
              <span
                className="px-2 py-0.5 rounded text-xs font-bold"
                style={{
                  background: statusStyle.bg,
                  color: statusStyle.text,
                  border: `1px solid ${statusStyle.border}`,
                }}
              >
                {plan.status}
              </span>
            </div>
            <p className="text-sm text-[var(--text-primary)]/60 mb-2">
              ${plan.amountPerPurchase} • {plan.frequency}
            </p>
            <div className="flex items-center gap-4 text-xs text-[var(--text-primary)]/40">
              <span>{plan.purchases} purchases</span>
              <span>•</span>
              <span>${plan.totalSpent.toLocaleString()} spent</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {plan.status === 'active' ? (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg"
              style={{
                background: 'rgba(251, 146, 60, 0.2)',
                border: '1px solid rgba(251, 146, 60, 0.4)',
              }}
            >
              <Pause className="w-5 h-5 text-orange-400" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg"
              style={{
                background: 'rgba(34, 197, 94, 0.2)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
              }}
            >
              <Play className="w-5 h-5 text-green-400" />
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-lg"
            style={{
              background: 'rgba(255, 77, 77, 0.2)',
              border: '1px solid rgba(255, 77, 77, 0.4)',
            }}
          >
            <Trash2 className="w-5 h-5 text-red-400" />
          </motion.button>
        </div>
      </div>

      {/* Next Purchase */}
      {plan.status === 'active' && (
        <div
          className="p-3 rounded-lg flex items-center gap-2"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Clock className="w-4 h-4 text-[var(--text-primary)]/40" />
          <span className="text-xs text-[var(--text-primary)]/60">
            Next purchase: {new Date(plan.nextPurchaseAt).toLocaleString()}
          </span>
        </div>
      )}
    </motion.div>
  );
};

// Order Modal Component
interface OrderModalProps {
  show: boolean;
  onClose: () => void;
  orderForm: OrderFormData;
  setOrderForm: React.Dispatch<React.SetStateAction<OrderFormData>>;
  accentColor: string;
  accentGlow: string;
}

const OrderModal: React.FC<OrderModalProps> = ({
  show,
  onClose,
  orderForm,
  setOrderForm,
  accentColor,
  accentGlow,
}) => {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[var(--bg-base)]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="max-w-md w-full p-6 rounded-2xl"
          style={{
            background: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black text-[var(--text-primary)]">Create Limit Order</h3>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 rounded-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
              }}
            >
              <X className="w-5 h-5 text-[var(--text-primary)]/70" />
            </motion.button>
          </div>

          {/* Order Type */}
          <div className="mb-6">
            <label className="text-sm font-bold text-[var(--text-primary)]/70 mb-3 block uppercase tracking-wider">
              Order Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['limit_buy', 'limit_sell', 'stop_loss', 'take_profit'] as const).map((type) => (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setOrderForm({ ...orderForm, type })}
                  className="p-3 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: orderForm.type === type ? accentColor : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${orderForm.type === type ? accentColor : 'rgba(255, 255, 255, 0.1)'}`,
                    color: 'white',
                    boxShadow: orderForm.type === type ? accentGlow : 'none',
                  }}
                >
                  {type.replace('_', ' ').toUpperCase()}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Token Pair */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-bold text-[var(--text-primary)]/70 mb-2 block">From</label>
              <input
                type="text"
                value={orderForm.tokenIn}
                onChange={(e) => setOrderForm({ ...orderForm, tokenIn: e.target.value })}
                className="w-full p-3 rounded-xl text-[var(--text-primary)] font-bold"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                placeholder="USDC"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-[var(--text-primary)]/70 mb-2 block">To</label>
              <input
                type="text"
                value={orderForm.tokenOut}
                onChange={(e) => setOrderForm({ ...orderForm, tokenOut: e.target.value })}
                className="w-full p-3 rounded-xl text-[var(--text-primary)] font-bold"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                placeholder="ETH"
              />
            </div>
          </div>

          {/* Amount & Price */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-bold text-[var(--text-primary)]/70 mb-2 block">Amount</label>
              <input
                type="text"
                value={orderForm.amount}
                onChange={(e) => setOrderForm({ ...orderForm, amount: e.target.value })}
                className="w-full p-3 rounded-xl text-[var(--text-primary)] font-bold"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                placeholder="1000"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-[var(--text-primary)]/70 mb-2 block">Trigger Price</label>
              <input
                type="text"
                value={orderForm.triggerPrice}
                onChange={(e) => setOrderForm({ ...orderForm, triggerPrice: e.target.value })}
                className="w-full p-3 rounded-xl text-[var(--text-primary)] font-bold"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                placeholder="2000"
              />
            </div>
          </div>

          {/* Slippage */}
          <div className="mb-6">
            <label className="text-sm font-bold text-[var(--text-primary)]/70 mb-3 block">Slippage Tolerance</label>
            <div className="flex gap-2">
              {[0.5, 1, 2, 5].map((val) => (
                <motion.button
                  key={val}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setOrderForm({ ...orderForm, slippage: val })}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-bold"
                  style={{
                    background: orderForm.slippage === val ? accentColor : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${orderForm.slippage === val ? accentColor : 'rgba(255, 255, 255, 0.1)'}`,
                    color: 'white',
                  }}
                >
                  {val}%
                </motion.button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl font-bold"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
              }}
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-6 py-3 rounded-xl font-bold"
              style={{
                background: accentColor,
                color: 'white',
                boxShadow: accentGlow,
              }}
            >
              Create Order
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// DCA Modal Component
interface DCAModalProps {
  show: boolean;
  onClose: () => void;
  dcaForm: DCAFormData;
  setDcaForm: React.Dispatch<React.SetStateAction<DCAFormData>>;
  accentColor: string;
  accentSecondary: string;
  accentGlow: string;
}

const DCAModal: React.FC<DCAModalProps> = ({
  show,
  onClose,
  dcaForm,
  setDcaForm,
  accentColor,
  accentSecondary,
  accentGlow,
}) => {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[var(--bg-base)]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="max-w-md w-full p-6 rounded-2xl"
          style={{
            background: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black text-[var(--text-primary)]">Create DCA Plan</h3>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 rounded-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
              }}
            >
              <X className="w-5 h-5 text-[var(--text-primary)]/70" />
            </motion.button>
          </div>

          {/* Token */}
          <div className="mb-6">
            <label className="text-sm font-bold text-[var(--text-primary)]/70 mb-3 block uppercase tracking-wider">
              Token to Buy
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['ETH', 'BTC', 'SOL', 'ARB'].map((token) => (
                <motion.button
                  key={token}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDcaForm({ ...dcaForm, tokenSymbol: token })}
                  className="p-3 rounded-lg text-sm font-bold"
                  style={{
                    background: dcaForm.tokenSymbol === token ? accentColor : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${dcaForm.tokenSymbol === token ? accentColor : 'rgba(255, 255, 255, 0.1)'}`,
                    color: 'white',
                  }}
                >
                  {token}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="mb-6">
            <label className="text-sm font-bold text-[var(--text-primary)]/70 mb-3 block">Amount per Purchase (USD)</label>
            <div className="grid grid-cols-5 gap-2">
              {['25', '50', '100', '250', '500'].map((amt) => (
                <motion.button
                  key={amt}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDcaForm({ ...dcaForm, amount: amt })}
                  className="p-2 rounded-lg text-sm font-bold"
                  style={{
                    background: dcaForm.amount === amt ? accentSecondary : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${dcaForm.amount === amt ? accentSecondary : 'rgba(255, 255, 255, 0.1)'}`,
                    color: 'white',
                  }}
                >
                  ${amt}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div className="mb-6">
            <label className="text-sm font-bold text-[var(--text-primary)]/70 mb-3 block">Frequency</label>
            <div className="grid grid-cols-2 gap-2">
              {(['daily', 'weekly', 'biweekly', 'monthly'] as const).map((freq) => (
                <motion.button
                  key={freq}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDcaForm({ ...dcaForm, frequency: freq })}
                  className="p-3 rounded-lg text-sm font-bold capitalize"
                  style={{
                    background: dcaForm.frequency === freq ? accentColor : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${dcaForm.frequency === freq ? accentColor : 'rgba(255, 255, 255, 0.1)'}`,
                    color: 'white',
                  }}
                >
                  {freq}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Total Budget */}
          <div className="mb-6">
            <label className="text-sm font-bold text-[var(--text-primary)]/70 mb-2 block">Total Budget (Optional)</label>
            <input
              type="text"
              value={dcaForm.totalBudget}
              onChange={(e) => setDcaForm({ ...dcaForm, totalBudget: e.target.value })}
              className="w-full p-3 rounded-xl text-[var(--text-primary)] font-bold"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              placeholder="Leave empty for unlimited"
            />
          </div>

          {/* Summary */}
          <div
            className="p-4 rounded-xl mb-6"
            style={{
              background: accentColor + '20',
              border: `1px solid ${accentColor}40`,
            }}
          >
            <p className="text-sm font-bold mb-1" style={{ color: accentColor }}>
              Plan Summary
            </p>
            <p className="text-sm text-[var(--text-primary)]/80">
              Buy ${dcaForm.amount} of {dcaForm.tokenSymbol} every {dcaForm.frequency}
              {dcaForm.totalBudget && ` until $${dcaForm.totalBudget} spent`}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl font-bold"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
              }}
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-6 py-3 rounded-xl font-bold"
              style={{
                background: accentColor,
                color: 'white',
                boxShadow: accentGlow,
              }}
            >
              Start DCA
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TradingPage;