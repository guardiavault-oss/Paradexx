/**
 * LimitOrdersModal Component
 *
 * Allows users to create and manage limit orders:
 * - Buy/Sell limit orders
 * - Stop-loss orders
 * - Take-profit orders
 * - Order history and management
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  TrendingUp,
  TrendingDown,
  Clock,
  Trash2,
  Plus,
  RefreshCw,
  ArrowUpDown,
  Target,
  Shield,
} from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';

interface LimitOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'degen' | 'regen';
}

type OrderType = 'limit_buy' | 'limit_sell' | 'stop_loss' | 'take_profit';
type TabType = 'create' | 'active' | 'history';

const ORDER_TYPES: { value: OrderType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'limit_buy',
    label: 'Limit Buy',
    icon: <TrendingUp className="w-4 h-4" />,
    description: 'Buy when price drops to target',
  },
  {
    value: 'limit_sell',
    label: 'Limit Sell',
    icon: <TrendingDown className="w-4 h-4" />,
    description: 'Sell when price rises to target',
  },
  {
    value: 'stop_loss',
    label: 'Stop Loss',
    icon: <Shield className="w-4 h-4" />,
    description: 'Protect against losses',
  },
  {
    value: 'take_profit',
    label: 'Take Profit',
    icon: <Target className="w-4 h-4" />,
    description: 'Lock in profits at target',
  },
];

export default function LimitOrdersModal({ isOpen, onClose, type }: LimitOrdersModalProps) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';

  const { orders, loading, createOrder, cancelOrder } = useOrders();

  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [orderType, setOrderType] = useState<OrderType>('limit_buy');
  const [tokenIn, setTokenIn] = useState('ETH');
  const [tokenOut, setTokenOut] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [triggerPrice, setTriggerPrice] = useState('');
  const [expirationDays, setExpirationDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeOrders = orders.filter(o => o.status === 'active');
  const historyOrders = orders.filter(o => o.status !== 'active');

  const handleSubmit = async () => {
    if (!amount || !triggerPrice) return;

    setIsSubmitting(true);
    try {
      await createOrder({
        type: orderType,
        tokenIn: orderType.includes('buy') ? tokenOut : tokenIn,
        tokenOut: orderType.includes('buy') ? tokenIn : tokenOut,
        amountIn: amount,
        triggerPrice,
        expiresAt: Date.now() + expirationDays * 24 * 60 * 60 * 1000,
      });

      // Reset form
      setAmount('');
      setTriggerPrice('');
      setActiveTab('active');
    } catch (error) {
      console.error('Failed to create order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (orderId: string) => {
    try {
      await cancelOrder(orderId);
    } catch (error) {
      console.error('Failed to cancel order:', error);
    }
  };

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return num < 1 ? num.toFixed(6) : num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-400 bg-blue-500/20';
      case 'filled': return 'text-green-400 bg-green-500/20';
      case 'cancelled': return 'text-gray-400 bg-gray-500/20';
      case 'expired': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-white/60 bg-white/10';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-lg bg-[#0a0a0a] rounded-3xl overflow-hidden border border-white/10"
        >
          {/* Header */}
          <div
            className="p-6 border-b border-white/10"
            style={{
              background: `linear-gradient(135deg, ${accentColor}20 0%, transparent 100%)`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  <ArrowUpDown className="w-6 h-6" style={{ color: accentColor }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Limit Orders</h2>
                  <p className="text-sm text-white/60">Set price triggers for trades</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10">
            {(['create', 'active', 'history'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab ? 'text-white' : 'text-white/50 hover:text-white/80'
                }`}
              >
                {tab === 'create' && 'Create Order'}
                {tab === 'active' && `Active (${activeOrders.length})`}
                {tab === 'history' && 'History'}
                {activeTab === tab && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: accentColor }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-4 max-h-[450px] overflow-y-auto">
            {activeTab === 'create' && (
              <div className="space-y-4">
                {/* Order Type Selection */}
                <div>
                  <label className="block text-sm text-white/60 mb-2">Order Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ORDER_TYPES.map((ot) => (
                      <button
                        key={ot.value}
                        onClick={() => setOrderType(ot.value)}
                        className={`p-3 rounded-xl border transition-all text-left ${
                          orderType === ot.value
                            ? 'border-white/30 bg-white/10'
                            : 'border-white/5 bg-black/40 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={orderType === ot.value ? 'text-white' : 'text-white/60'}>
                            {ot.icon}
                          </span>
                          <span className={`text-sm font-medium ${
                            orderType === ot.value ? 'text-white' : 'text-white/70'
                          }`}>
                            {ot.label}
                          </span>
                        </div>
                        <p className="text-xs text-white/40">{ot.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Token Pair */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">
                      {orderType.includes('buy') ? 'You Pay' : 'You Sell'}
                    </label>
                    <select
                      value={orderType.includes('buy') ? tokenOut : tokenIn}
                      onChange={(e) => orderType.includes('buy') ? setTokenOut(e.target.value) : setTokenIn(e.target.value)}
                      className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white"
                    >
                      <option value="ETH">ETH</option>
                      <option value="USDC">USDC</option>
                      <option value="USDT">USDT</option>
                      <option value="WBTC">WBTC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">
                      {orderType.includes('buy') ? 'You Get' : 'You Receive'}
                    </label>
                    <select
                      value={orderType.includes('buy') ? tokenIn : tokenOut}
                      onChange={(e) => orderType.includes('buy') ? setTokenIn(e.target.value) : setTokenOut(e.target.value)}
                      className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white"
                    >
                      <option value="ETH">ETH</option>
                      <option value="USDC">USDC</option>
                      <option value="USDT">USDT</option>
                      <option value="WBTC">WBTC</option>
                    </select>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm text-white/60 mb-2">Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.0"
                      className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white text-lg pr-16"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                      {orderType.includes('buy') ? tokenOut : tokenIn}
                    </span>
                  </div>
                </div>

                {/* Trigger Price */}
                <div>
                  <label className="block text-sm text-white/60 mb-2">Trigger Price</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={triggerPrice}
                      onChange={(e) => setTriggerPrice(e.target.value)}
                      placeholder="0.0"
                      className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white text-lg pr-20"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                      USD
                    </span>
                  </div>
                  <p className="text-xs text-white/40 mt-1">
                    Order executes when {orderType.includes('buy') ? tokenIn : tokenOut} reaches this price
                  </p>
                </div>

                {/* Expiration */}
                <div>
                  <label className="block text-sm text-white/60 mb-2">Expires In</label>
                  <div className="flex gap-2">
                    {[1, 7, 30, 90].map((days) => (
                      <button
                        key={days}
                        onClick={() => setExpirationDays(days)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                          expirationDays === days
                            ? 'bg-white/20 text-white'
                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        {days}d
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!amount || !triggerPrice || isSubmitting}
                  className="w-full py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor} 0%, ${isDegen ? '#8B0000' : '#0056b3'} 100%)`,
                  }}
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    `Create ${ORDER_TYPES.find(ot => ot.value === orderType)?.label}`
                  )}
                </button>
              </div>
            )}

            {activeTab === 'active' && (
              <div className="space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-6 h-6 animate-spin text-white/40" />
                  </div>
                ) : activeOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/40">No active orders</p>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="mt-4 px-4 py-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors flex items-center gap-2 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      Create Order
                    </button>
                  </div>
                ) : (
                  activeOrders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {order.type.includes('buy') ? (
                            <TrendingUp className="w-4 h-4 text-green-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                          )}
                          <span className="font-medium text-white">
                            {ORDER_TYPES.find(ot => ot.value === order.type)?.label}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/50">Amount</span>
                          <span className="text-white">{order.amountIn} {order.tokenIn}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50">Trigger</span>
                          <span className="text-white">${formatPrice(order.triggerPrice)}</span>
                        </div>
                        {order.currentPrice && (
                          <div className="flex justify-between">
                            <span className="text-white/50">Current</span>
                            <span className="text-white/70">${formatPrice(order.currentPrice)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleCancel(order.id)}
                          className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors flex items-center justify-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-3">
                {historyOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/40">No order history</p>
                  </div>
                ) : (
                  historyOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 rounded-xl bg-black/40 border border-white/5"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {order.type.includes('buy') ? (
                            <TrendingUp className="w-4 h-4 text-green-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                          )}
                          <span className="font-medium text-white/70">
                            {ORDER_TYPES.find(ot => ot.value === order.type)?.label}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/40">Amount</span>
                          <span className="text-white/60">{order.amountIn} {order.tokenIn}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/40">Trigger</span>
                          <span className="text-white/60">${formatPrice(order.triggerPrice)}</span>
                        </div>
                        {order.filledAt && (
                          <div className="flex justify-between">
                            <span className="text-white/40">Filled</span>
                            <span className="text-white/60">
                              {new Date(order.filledAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
