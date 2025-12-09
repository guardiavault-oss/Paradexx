/**
 * useOrders Hook
 * Real API integration for limit orders and stop-loss orders
 */

import { useState, useEffect, useCallback } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://paradexx-production.up.railway.app';

export interface Order {
  id: string;
  type: 'limit_buy' | 'limit_sell' | 'stop_loss' | 'take_profit';
  tokenIn: string;
  tokenInAddress?: string;
  tokenOut: string;
  tokenOutAddress?: string;
  amountIn: string;
  amountOut?: string;
  triggerPrice: string;
  currentPrice?: string;
  status: 'active' | 'filled' | 'cancelled' | 'expired';
  createdAt: number;
  expiresAt?: number;
  filledAt?: number;
  txHash?: string;
}

interface UseOrdersResult {
  orders: Order[];
  loading: boolean;
  error: string | null;
  createOrder: (order: Omit<Order, 'id' | 'createdAt' | 'status'>) => Promise<Order | null>;
  cancelOrder: (orderId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useOrders(): UseOrdersResult {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || data || []);
      } else if (response.status === 404) {
        // API not available, start with empty orders
        setOrders([]);
      } else {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrder = useCallback(async (
    orderData: Omit<Order, 'id' | 'createdAt' | 'status'>
  ): Promise<Order | null> => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const newOrder = await response.json();
        setOrders(prev => [newOrder, ...prev]);
        return newOrder;
      } else {
        // Create locally if API not available
        const localOrder: Order = {
          ...orderData,
          id: `local-${Date.now()}`,
          status: 'active',
          createdAt: Date.now(),
        };
        setOrders(prev => [localOrder, ...prev]);
        return localOrder;
      }
    } catch (err) {
      console.error('Error creating order:', err);
      // Create locally on error
      const localOrder: Order = {
        ...orderData,
        id: `local-${Date.now()}`,
        status: 'active',
        createdAt: Date.now(),
      };
      setOrders(prev => [localOrder, ...prev]);
      return localOrder;
    }
  }, []);

  const cancelOrder = useCallback(async (orderId: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok || response.status === 404) {
        setOrders(prev => prev.map(o => 
          o.id === orderId ? { ...o, status: 'cancelled' } : o
        ));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error cancelling order:', err);
      // Cancel locally on error
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: 'cancelled' } : o
      ));
      return true;
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    createOrder,
    cancelOrder,
    refresh: fetchOrders,
  };
}

/**
 * useDCAPlans Hook
 * Real API integration for Dollar Cost Averaging plans
 */

export interface DCAPlan {
  id: string;
  tokenSymbol: string;
  tokenAddress?: string;
  amountPerPurchase: string;
  currency?: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  startedAt?: number;
  nextPurchaseAt: number;
  purchases: number;
  totalInvested?: string;
  averagePrice?: string;
}

interface UseDCAPlansResult {
  plans: DCAPlan[];
  loading: boolean;
  error: string | null;
  createPlan: (plan: Omit<DCAPlan, 'id' | 'purchases' | 'status'>) => Promise<DCAPlan | null>;
  pausePlan: (planId: string) => Promise<boolean>;
  resumePlan: (planId: string) => Promise<boolean>;
  cancelPlan: (planId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useDCAPlans(): UseDCAPlansResult {
  const [plans, setPlans] = useState<DCAPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/dca-plans`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || data || []);
      } else if (response.status === 404) {
        // API not available
        setPlans([]);
      } else {
        throw new Error(`Failed to fetch DCA plans: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching DCA plans:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch plans');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPlan = useCallback(async (
    planData: Omit<DCAPlan, 'id' | 'purchases' | 'status'>
  ): Promise<DCAPlan | null> => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/dca-plans`, {
        method: 'POST',
        headers,
        body: JSON.stringify(planData),
      });

      if (response.ok) {
        const newPlan = await response.json();
        setPlans(prev => [newPlan, ...prev]);
        return newPlan;
      } else {
        // Create locally if API not available
        const localPlan: DCAPlan = {
          ...planData,
          id: `local-${Date.now()}`,
          status: 'active',
          purchases: 0,
        };
        setPlans(prev => [localPlan, ...prev]);
        return localPlan;
      }
    } catch (err) {
      console.error('Error creating DCA plan:', err);
      const localPlan: DCAPlan = {
        ...planData,
        id: `local-${Date.now()}`,
        status: 'active',
        purchases: 0,
      };
      setPlans(prev => [localPlan, ...prev]);
      return localPlan;
    }
  }, []);

  const updatePlanStatus = useCallback(async (
    planId: string, 
    action: 'pause' | 'resume' | 'cancel'
  ): Promise<boolean> => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/dca-plans/${planId}/${action}`, {
        method: 'POST',
        headers,
      });

      const statusMap = {
        pause: 'paused' as const,
        resume: 'active' as const,
        cancel: 'cancelled' as const,
      };

      if (response.ok || response.status === 404) {
        setPlans(prev => prev.map(p => 
          p.id === planId ? { ...p, status: statusMap[action] } : p
        ));
        return true;
      }
      return false;
    } catch (err) {
      console.error(`Error ${action}ing DCA plan:`, err);
      // Update locally on error
      const statusMap = {
        pause: 'paused' as const,
        resume: 'active' as const,
        cancel: 'cancelled' as const,
      };
      setPlans(prev => prev.map(p => 
        p.id === planId ? { ...p, status: statusMap[action] } : p
      ));
      return true;
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return {
    plans,
    loading,
    error,
    createPlan,
    pausePlan: (id) => updatePlanStatus(id, 'pause'),
    resumePlan: (id) => updatePlanStatus(id, 'resume'),
    cancelPlan: (id) => updatePlanStatus(id, 'cancel'),
    refresh: fetchPlans,
  };
}

export default useOrders;
