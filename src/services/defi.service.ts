import { apiClient, ApiResponse } from './api-client';
import {
    DeFiPosition,
    YieldOpportunity,
    PaginatedResponse,
} from '../types/api.types';

// DeFi service functions
export const defiService = {
    // Get all DeFi positions
    getPositions: async (): Promise<ApiResponse<DeFiPosition[]>> => {
        const response = await apiClient.get<ApiResponse<DeFiPosition[]>>('/api/defi/positions');
        return response.data;
    },

    // Get specific DeFi position
    getPosition: async (positionId: string): Promise<ApiResponse<DeFiPosition>> => {
        const response = await apiClient.get<ApiResponse<DeFiPosition>>(`/api/defi/positions/${positionId}`);
        return response.data;
    },

    // Get yield opportunities
    getYieldOpportunities: async (
        asset?: string,
        type?: 'staking' | 'lending' | 'liquidity',
        risk?: 'low' | 'medium' | 'high'
    ): Promise<ApiResponse<YieldOpportunity[]>> => {
        const params = new URLSearchParams();
        if (asset) params.append('asset', asset);
        if (type) params.append('type', type);
        if (risk) params.append('risk', risk);

        const response = await apiClient.get<ApiResponse<YieldOpportunity[]>>(
            `/api/defi/opportunities?${params}`
        );
        return response.data;
    },

    // Stake tokens
    stakeTokens: async (params: {
        protocol: string;
        asset: string;
        amount: string;
        duration?: number;
    }): Promise<ApiResponse<{ positionId: string; hash: string }>> => {
        const response = await apiClient.post<ApiResponse<{ positionId: string; hash: string }>>(
            '/api/defi/stake',
            params
        );
        return response.data;
    },

    // Unstake tokens
    unstakeTokens: async (positionId: string, amount?: string): Promise<ApiResponse<{ hash: string }>> => {
        const response = await apiClient.post<ApiResponse<{ hash: string }>>(
            `/api/defi/positions/${positionId}/unstake`,
            { amount }
        );
        return response.data;
    },

    // Provide liquidity
    provideLiquidity: async (params: {
        protocol: string;
        pool: string;
        tokenA: string;
        tokenB: string;
        amountA: string;
        amountB: string;
    }): Promise<ApiResponse<{ positionId: string; hash: string }>> => {
        const response = await apiClient.post<ApiResponse<{ positionId: string; hash: string }>>(
            '/api/defi/liquidity/add',
            params
        );
        return response.data;
    },

    // Remove liquidity
    removeLiquidity: async (
        positionId: string,
        percentage?: number
    ): Promise<ApiResponse<{ hash: string }>> => {
        const response = await apiClient.post<ApiResponse<{ hash: string }>>(
            `/api/defi/positions/${positionId}/remove-liquidity`,
            { percentage }
        );
        return response.data;
    },

    // Lend tokens
    lendTokens: async (params: {
        protocol: string;
        asset: string;
        amount: string;
    }): Promise<ApiResponse<{ positionId: string; hash: string }>> => {
        const response = await apiClient.post<ApiResponse<{ positionId: string; hash: string }>>(
            '/api/defi/lend',
            params
        );
        return response.data;
    },

    // Borrow tokens
    borrowTokens: async (params: {
        protocol: string;
        asset: string;
        amount: string;
        collateral?: string;
    }): Promise<ApiResponse<{ hash: string }>> => {
        const response = await apiClient.post<ApiResponse<{ hash: string }>>(
            '/api/defi/borrow',
            params
        );
        return response.data;
    },

    // Repay loan
    repayLoan: async (positionId: string, amount?: string): Promise<ApiResponse<{ hash: string }>> => {
        const response = await apiClient.post<ApiResponse<{ hash: string }>>(
            `/api/defi/positions/${positionId}/repay`,
            { amount }
        );
        return response.data;
    },

    // Claim rewards
    claimRewards: async (positionId: string): Promise<ApiResponse<{ hash: string; rewards: string }>> => {
        const response = await apiClient.post<ApiResponse<{ hash: string; rewards: string }>>(
            `/api/defi/positions/${positionId}/claim`
        );
        return response.data;
    },

    // Get DeFi portfolio overview
    getPortfolioOverview: async (): Promise<ApiResponse<{
        totalValueUSD: number;
        totalAPY: number;
        positionsCount: number;
        rewardsPending: number;
        riskDistribution: {
            low: number;
            medium: number;
            high: number;
        };
    }>> => {
        const response = await apiClient.get<ApiResponse<{
            totalValueUSD: number;
            totalAPY: number;
            positionsCount: number;
            rewardsPending: number;
            riskDistribution: {
                low: number;
                medium: number;
                high: number;
            };
        }>>('/api/defi/portfolio');
        return response.data;
    },

    // Get protocol information
    getProtocolInfo: async (protocol: string): Promise<ApiResponse<{
        name: string;
        tvl: number;
        apyRange: { min: number; max: number };
        supportedAssets: string[];
        riskLevel: 'low' | 'medium' | 'high';
        description: string;
    }>> => {
        const response = await apiClient.get<ApiResponse<{
            name: string;
            tvl: number;
            apyRange: { min: number; max: number };
            supportedAssets: string[];
            riskLevel: 'low' | 'medium' | 'high';
            description: string;
        }>>(`/api/defi/protocols/${protocol}`);
        return response.data;
    },

    // Get supported protocols
    getSupportedProtocols: async (): Promise<ApiResponse<Array<{
        id: string;
        name: string;
        category: 'staking' | 'lending' | 'liquidity' | 'yield';
        tvl: number;
        isActive: boolean;
    }>>> => {
        const response = await apiClient.get<ApiResponse<Array<{
            id: string;
            name: string;
            category: 'staking' | 'lending' | 'liquidity' | 'yield';
            tvl: number;
            isActive: boolean;
        }>>>('/api/defi/protocols');
        return response.data;
    },

    // Get transaction history for DeFi operations
    getDefiHistory: async (
        page: number = 1,
        limit: number = 20,
        type?: string
    ): Promise<PaginatedResponse<{
        id: string;
        type: string;
        protocol: string;
        amount: string;
        timestamp: string;
        hash: string;
        status: string;
    }>>> => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });

    if (type) params.append('type', type);

    const response = await apiClient.get<PaginatedResponse<{
        id: string;
        type: string;
        protocol: string;
        amount: string;
        timestamp: string;
        hash: string;
        status: string;
    }>>(`/api/defi/history?${params}`);
    return response.data;
},

// Get gas estimates for DeFi operations
getGasEstimate: async (operation: {
    protocol: string;
    type: 'stake' | 'unstake' | 'lend' | 'borrow' | 'provide-liquidity' | 'remove-liquidity';
    amount: string;
}): Promise<ApiResponse<{ gasLimit: string; gasPrice: string; estimatedCost: string }>> => {
    const response = await apiClient.post<ApiResponse<{ gasLimit: string; gasPrice: string; estimatedCost: string }>>(
        '/api/defi/gas-estimate',
        operation
    );
    return response.data;
},

    // Close position
    closePosition: async (positionId: string): Promise<ApiResponse<{ hash: string }>> => {
        const response = await apiClient.post<ApiResponse<{ hash: string }>>(
            `/api/defi/positions/${positionId}/close`
        );
        return response.data;
    },
};
