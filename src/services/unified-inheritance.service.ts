/**
 * Unified Inheritance Service - Complete inheritance vault functionality
 * Connects to backend APIs for real inheritance operations
 */

import { apiClient, ApiResponse } from './api-client';
import { API_ROUTES } from './config';

// ============================================================
// TYPES
// ============================================================

export interface InheritanceVault {
    id: string;
    userId: string;
    name: string;
    description?: string;
    tier: 'essential' | 'premium';
    inactivityDays: number;
    status: 'active' | 'triggered' | 'distributed' | 'cancelled';
    lastActivityAt: string;
    triggerWarningAt?: string;
    timelockStartAt?: string;
    canDistributeAt?: string;
    distributionMethod: 'automatic' | 'manual';
    requiresGuardianApproval: boolean;
    enableCheckInReminders: boolean;
    walletAddresses: string[];
    beneficiaries: VaultBeneficiary[];
    activities: VaultActivity[];
    daysUntilTrigger: number;
    tierLimits: {
        maxBeneficiaries: number;
        checkInReminders: boolean;
    };
    createdAt: string;
    updatedAt: string;
}

export interface VaultBeneficiary {
    id: string;
    vaultId: string;
    name: string;
    email: string;
    walletAddress?: string;
    relationship?: string;
    percentage: number;
    isVerified: boolean;
    verifiedAt?: string;
    status: 'pending' | 'verified' | 'claimed';
    createdAt: string;
}

export interface VaultActivity {
    id: string;
    vaultId: string;
    activityType: string;
    description?: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
}

export interface CreateVaultParams {
    name: string;
    description?: string;
    tier?: 'essential' | 'premium';
    inactivityDays?: number;
    walletAddresses?: string[];
    distributionMethod?: 'automatic' | 'manual';
    requiresGuardianApproval?: boolean;
}

export interface AddBeneficiaryParams {
    vaultId: string;
    name: string;
    email: string;
    walletAddress?: string;
    relationship?: string;
    percentage: number;
}

export interface UpdateVaultParams {
    name?: string;
    description?: string;
    inactivityDays?: number;
    distributionMethod?: 'automatic' | 'manual';
    requiresGuardianApproval?: boolean;
    walletAddresses?: string[];
    enableCheckInReminders?: boolean;
}

// ============================================================
// INHERITANCE SERVICE
// ============================================================

class UnifiedInheritanceService {
    // ========== VAULT OPERATIONS ==========

    /**
     * Get user's inheritance vault
     */
    async getVault(): Promise<InheritanceVault | null> {
        try {
            const response = await apiClient.get<ApiResponse<InheritanceVault>>(
                API_ROUTES.INHERITANCE.VAULT
            );
            return response.data.data || null;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null;
            }
            console.error('Error getting vault:', error);
            throw new Error(error.response?.data?.error || 'Failed to get vault');
        }
    }

    /**
     * Create inheritance vault
     */
    async createVault(params: CreateVaultParams): Promise<InheritanceVault> {
        try {
            const response = await apiClient.post<ApiResponse<InheritanceVault>>(
                API_ROUTES.INHERITANCE.VAULT,
                params
            );
            return response.data.data!;
        } catch (error: any) {
            console.error('Error creating vault:', error);
            throw new Error(error.response?.data?.error || 'Failed to create vault');
        }
    }

    /**
     * Update inheritance vault
     */
    async updateVault(vaultId: string, params: UpdateVaultParams): Promise<InheritanceVault> {
        try {
            const response = await apiClient.put<ApiResponse<InheritanceVault>>(
                `${API_ROUTES.INHERITANCE.VAULT}/${vaultId}`,
                params
            );
            return response.data.data!;
        } catch (error: any) {
            console.error('Error updating vault:', error);
            throw new Error(error.response?.data?.error || 'Failed to update vault');
        }
    }

    /**
     * Upgrade vault tier
     */
    async upgradeTier(vaultId: string, newTier: 'essential' | 'premium'): Promise<InheritanceVault> {
        try {
            const response = await apiClient.post<ApiResponse<InheritanceVault>>(
                `${API_ROUTES.INHERITANCE.VAULT}/${vaultId}/upgrade`,
                { tier: newTier }
            );
            return response.data.data!;
        } catch (error: any) {
            console.error('Error upgrading tier:', error);
            throw new Error(error.response?.data?.error || 'Failed to upgrade tier');
        }
    }

    /**
     * Cancel vault
     */
    async cancelVault(vaultId: string): Promise<boolean> {
        try {
            await apiClient.delete(`${API_ROUTES.INHERITANCE.VAULT}/${vaultId}`);
            return true;
        } catch (error: any) {
            console.error('Error cancelling vault:', error);
            throw new Error(error.response?.data?.error || 'Failed to cancel vault');
        }
    }

    // ========== CHECK-IN OPERATIONS ==========

    /**
     * Perform manual check-in
     */
    async checkIn(vaultId: string): Promise<{ success: boolean; lastActivityAt: string }> {
        try {
            const response = await apiClient.post<ApiResponse<{ success: boolean; lastActivityAt: string }>>(
                `${API_ROUTES.INHERITANCE.VAULT}/${vaultId}/check-in`
            );
            return response.data.data!;
        } catch (error: any) {
            console.error('Error performing check-in:', error);
            throw new Error(error.response?.data?.error || 'Failed to check in');
        }
    }

    /**
     * Cancel vault trigger
     */
    async cancelTrigger(vaultId: string): Promise<boolean> {
        try {
            await apiClient.post(`${API_ROUTES.INHERITANCE.VAULT}/${vaultId}/cancel-trigger`);
            return true;
        } catch (error: any) {
            console.error('Error cancelling trigger:', error);
            throw new Error(error.response?.data?.error || 'Failed to cancel trigger');
        }
    }

    // ========== BENEFICIARY OPERATIONS ==========

    /**
     * Add beneficiary
     */
    async addBeneficiary(params: AddBeneficiaryParams): Promise<VaultBeneficiary> {
        try {
            const response = await apiClient.post<ApiResponse<VaultBeneficiary>>(
                API_ROUTES.INHERITANCE.BENEFICIARIES,
                params
            );
            return response.data.data!;
        } catch (error: any) {
            console.error('Error adding beneficiary:', error);
            throw new Error(error.response?.data?.error || 'Failed to add beneficiary');
        }
    }

    /**
     * Update beneficiary
     */
    async updateBeneficiary(
        beneficiaryId: string,
        params: Partial<AddBeneficiaryParams>
    ): Promise<VaultBeneficiary> {
        try {
            const response = await apiClient.put<ApiResponse<VaultBeneficiary>>(
                `${API_ROUTES.INHERITANCE.BENEFICIARIES}/${beneficiaryId}`,
                params
            );
            return response.data.data!;
        } catch (error: any) {
            console.error('Error updating beneficiary:', error);
            throw new Error(error.response?.data?.error || 'Failed to update beneficiary');
        }
    }

    /**
     * Remove beneficiary
     */
    async removeBeneficiary(beneficiaryId: string): Promise<boolean> {
        try {
            await apiClient.delete(`${API_ROUTES.INHERITANCE.BENEFICIARIES}/${beneficiaryId}`);
            return true;
        } catch (error: any) {
            console.error('Error removing beneficiary:', error);
            throw new Error(error.response?.data?.error || 'Failed to remove beneficiary');
        }
    }

    /**
     * Verify beneficiary (for beneficiary to confirm their status)
     */
    async verifyBeneficiary(verificationToken: string): Promise<VaultBeneficiary> {
        try {
            const response = await apiClient.post<ApiResponse<VaultBeneficiary>>(
                `${API_ROUTES.INHERITANCE.VERIFY}/${verificationToken}`
            );
            return response.data.data!;
        } catch (error: any) {
            console.error('Error verifying beneficiary:', error);
            throw new Error(error.response?.data?.error || 'Failed to verify beneficiary');
        }
    }

    // ========== ACTIVITY OPERATIONS ==========

    /**
     * Get vault activity log
     */
    async getActivityLog(vaultId: string, limit: number = 50): Promise<VaultActivity[]> {
        try {
            const response = await apiClient.get<ApiResponse<{ activities: VaultActivity[] }>>(
                `${API_ROUTES.INHERITANCE.ACTIVITY}?vaultId=${vaultId}&limit=${limit}`
            );
            return response.data.data?.activities || [];
        } catch (error: any) {
            console.error('Error getting activity log:', error);
            return [];
        }
    }

    // ========== PRICING & TIER INFO ==========

    /**
     * Get tier pricing
     */
    async getTierPricing(): Promise<{ essential: number; premium: number }> {
        try {
            const response = await apiClient.get<ApiResponse<{ essential: number; premium: number }>>(
                `${API_ROUTES.INHERITANCE.VAULT}/pricing`
            );
            return response.data.data || { essential: 14900, premium: 29900 };
        } catch (error: any) {
            console.error('Error getting pricing:', error);
            return { essential: 14900, premium: 29900 };
        }
    }

    /**
     * Get tier limits
     */
    getTierLimits(): {
        essential: { maxBeneficiaries: number; checkInReminders: boolean };
        premium: { maxBeneficiaries: number; checkInReminders: boolean };
    } {
        return {
            essential: { maxBeneficiaries: 1, checkInReminders: false },
            premium: { maxBeneficiaries: Infinity, checkInReminders: true },
        };
    }

    /**
     * Get inactivity options
     */
    getInactivityOptions(): number[] {
        return [30, 90, 180, 365];
    }

    // ========== CHECKOUT ==========

    /**
     * Create checkout session for vault tier
     */
    async createCheckoutSession(tier: 'essential' | 'premium'): Promise<{ url: string; sessionId: string }> {
        try {
            const response = await apiClient.post<ApiResponse<{ url: string; sessionId: string }>>(
                API_ROUTES.PAYMENTS.CHECKOUT,
                {
                    productType: 'inheritance_vault',
                    tier,
                }
            );
            return response.data.data!;
        } catch (error: any) {
            console.error('Error creating checkout:', error);
            throw new Error(error.response?.data?.error || 'Failed to create checkout session');
        }
    }

    // ========== CLAIM OPERATIONS (for beneficiaries) ==========

    /**
     * Get claim info for beneficiary
     */
    async getClaimInfo(claimToken: string): Promise<{
        vault: InheritanceVault;
        beneficiary: VaultBeneficiary;
        canClaim: boolean;
        claimableAssets: any[];
    }> {
        try {
            const response = await apiClient.get<ApiResponse<any>>(
                `/api/inheritance/claim/${claimToken}`
            );
            return response.data.data;
        } catch (error: any) {
            console.error('Error getting claim info:', error);
            throw new Error(error.response?.data?.error || 'Failed to get claim info');
        }
    }

    /**
     * Execute claim (for beneficiary)
     */
    async executeClaim(claimToken: string, destinationWallet: string): Promise<{
        success: boolean;
        transactionHash: string;
        claimedAssets: any[];
    }> {
        try {
            const response = await apiClient.post<ApiResponse<any>>(
                `/api/inheritance/claim/${claimToken}/execute`,
                { destinationWallet }
            );
            return response.data.data;
        } catch (error: any) {
            console.error('Error executing claim:', error);
            throw new Error(error.response?.data?.error || 'Failed to execute claim');
        }
    }
}

// Export singleton instance
export const unifiedInheritanceService = new UnifiedInheritanceService();

export default unifiedInheritanceService;
