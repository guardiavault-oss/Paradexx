import { apiClient, ApiResponse } from './api-client';
import {
    Wallet,
    Transaction,
    Portfolio,
    PortfolioAsset,
    CreateWalletRequest,
    SendTransactionRequest,
    ApproveTokenRequest,
    PaginatedResponse,
} from '../types/api.types';

// Wallet service functions
export const walletService = {
    // Get all user wallets
    getWallets: async (): Promise<ApiResponse<Wallet[]>> => {
        const response = await apiClient.get<ApiResponse<Wallet[]>>('/api/wallet');
        return response.data;
    },

    // Create new wallet
    createWallet: async (request: CreateWalletRequest): Promise<ApiResponse<Wallet>> => {
        const response = await apiClient.post<ApiResponse<Wallet>>('/api/wallet', request);
        return response.data;
    },

    // Get wallet details
    getWallet: async (walletId: string): Promise<ApiResponse<Wallet>> => {
        const response = await apiClient.get<ApiResponse<Wallet>>(`/api/wallet/${walletId}`);
        return response.data;
    },

    // Get wallet balance
    getBalance: async (walletId: string): Promise<ApiResponse<{ balance: string; usdBalance: number }>> => {
        const response = await apiClient.get<ApiResponse<{ balance: string; usdBalance: number }>>(
            `/api/wallet/${walletId}/balance`
        );
        return response.data;
    },

    // Send transaction
    sendTransaction: async (walletId: string, request: SendTransactionRequest): Promise<ApiResponse<{ hash: string }>> => {
        const response = await apiClient.post<ApiResponse<{ hash: string }>>(
            `/api/wallet/${walletId}/send`,
            request
        );
        return response.data;
    },

    // Approve token spending
    approveToken: async (walletId: string, request: ApproveTokenRequest): Promise<ApiResponse<{ hash: string }>> => {
        const response = await apiClient.post<ApiResponse<{ hash: string }>>(
            `/api/wallet/${walletId}/approve`,
            request
        );
        return response.data;
    },

    // Get transaction history
    getTransactions: async (
        walletId: string,
        page: number = 1,
        limit: number = 20,
        status?: string
    ): Promise<PaginatedResponse<Transaction>> => {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        if (status) {
            params.append('status', status);
        }

        const response = await apiClient.get<PaginatedResponse<Transaction>>(
            `/api/wallet/${walletId}/transactions?${params}`
        );
        return response.data;
    },

    // Get transaction details
    getTransaction: async (walletId: string, txHash: string): Promise<ApiResponse<Transaction>> => {
        const response = await apiClient.get<ApiResponse<Transaction>>(
            `/api/wallet/${walletId}/transactions/${txHash}`
        );
        return response.data;
    },

    // Get portfolio overview
    getPortfolio: async (walletId: string): Promise<ApiResponse<Portfolio>> => {
        const response = await apiClient.get<ApiResponse<Portfolio>>(`/api/wallet/${walletId}/portfolio`);
        return response.data;
    },

    // Get portfolio assets
    getPortfolioAssets: async (walletId: string): Promise<ApiResponse<PortfolioAsset[]>> => {
        const response = await apiClient.get<ApiResponse<PortfolioAsset[]>>(
            `/api/wallet/${walletId}/portfolio/assets`
        );
        return response.data;
    },

    // Get gas price estimates
    getGasPrices: async (): Promise<ApiResponse<{
        slow: { price: string; time: number };
        standard: { price: string; time: number };
        fast: { price: string; time: number };
    }>> => {
        const response = await apiClient.get<ApiResponse<{
            slow: { price: string; time: number };
            standard: { price: string; time: number };
            fast: { price: string; time: number };
        }>>('/api/wallet/gas-prices');
        return response.data;
    },

    // Estimate gas for transaction
    estimateGas: async (walletId: string, request: SendTransactionRequest): Promise<ApiResponse<{ gasLimit: string; gasPrice: string }>> => {
        const response = await apiClient.post<ApiResponse<{ gasLimit: string; gasPrice: string }>>(
            `/api/wallet/${walletId}/estimate-gas`,
            request
        );
        return response.data;
    },

    // Sign message
    signMessage: async (walletId: string, message: string): Promise<ApiResponse<{ signature: string }>> => {
        const response = await apiClient.post<ApiResponse<{ signature: string }>>(
            `/api/wallet/${walletId}/sign`,
            { message }
        );
        return response.data;
    },

    // Verify message signature
    verifySignature: async (
        walletId: string,
        message: string,
        signature: string
    ): Promise<ApiResponse<{ valid: boolean }>> => {
        const response = await apiClient.post<ApiResponse<{ valid: boolean }>>(
            `/api/wallet/${walletId}/verify-signature`,
            { message, signature }
        );
        return response.data;
    },

    // Import wallet
    importWallet: async (privateKey: string, name?: string): Promise<ApiResponse<Wallet>> => {
        const response = await apiClient.post<ApiResponse<Wallet>>('/api/wallet/import', {
            privateKey,
            name,
        });
        return response.data;
    },

    // Export wallet private key (encrypted)
    exportWallet: async (walletId: string): Promise<ApiResponse<{ encryptedKey: string }>> => {
        const response = await apiClient.get<ApiResponse<{ encryptedKey: string }>>(
            `/api/wallet/${walletId}/export`
        );
        return response.data;
    },

    // Delete wallet
    deleteWallet: async (walletId: string): Promise<ApiResponse> => {
        const response = await apiClient.delete<ApiResponse>(`/api/wallet/${walletId}`);
        return response.data;
    },

    // Set active wallet
    setActiveWallet: async (walletId: string): Promise<ApiResponse> => {
        const response = await apiClient.put<ApiResponse>(`/api/wallet/${walletId}/set-active`);
        return response.data;
    },

    // Get wallet permissions
    getWalletPermissions: async (walletId: string): Promise<ApiResponse<{
        canSend: boolean;
        canReceive: boolean;
        canSwap: boolean;
        canApprove: boolean;
    }>> => {
        const response = await apiClient.get<ApiResponse<{
            canSend: boolean;
            canReceive: boolean;
            canSwap: boolean;
            canApprove: boolean;
        }>>(`/api/wallet/${walletId}/permissions`);
        return response.data;
    },

    // Update wallet settings
    updateWalletSettings: async (
        walletId: string,
        settings: {
            name?: string;
            notifications?: boolean;
            autoApprove?: boolean;
        }
    ): Promise<ApiResponse<Wallet>> => {
        const response = await apiClient.put<ApiResponse<Wallet>>(
            `/api/wallet/${walletId}/settings`,
            settings
        );
        return response.data;
    },
};
