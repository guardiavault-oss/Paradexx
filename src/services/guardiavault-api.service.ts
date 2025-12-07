/**
 * GuardiaVault API Service
 * Complete integration with GuardiaVault backend API
 */

import { apiClient } from './api-client';

// Base URL for GuardiaVault API
const GUARDIAVAULT_API_URL = import.meta.env.VITE_GUARDIAVAULT_API_URL || 'http://localhost:5000/api';

// ==================== Types ====================

export interface Vault {
  id: string;
  ownerId: string;
  name: string;
  checkInIntervalDays: number;
  gracePeriodDays: number;
  status: 'active' | 'warning' | 'triggered' | 'death_verified' | 'ready_for_claim' | 'claimed';
  lastCheckInAt: string | null;
  nextCheckInDue: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Guardian {
  id: string;
  vaultId: string;
  role: 'guardian';
  name: string;
  email: string;
  phone: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'active';
  inviteToken: string;
  inviteExpiresAt: string;
  hasAttested: boolean;
  attestedAt: string | null;
}

export interface Beneficiary {
  id: string;
  vaultId: string;
  role: 'beneficiary';
  name: string;
  email: string;
  phone: string | null;
  walletAddress: string | null;
  allocation: number;
  status: 'pending' | 'accepted' | 'rejected' | 'active';
}

export interface RecoveryRequest {
  id: string;
  userId: string;
  walletAddress: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'expired';
  encryptedData: string;
  createdAt: string;
  recoveryKeys: RecoveryKey[];
}

export interface RecoveryKey {
  id: string;
  recoveryId: string;
  email: string;
  name: string;
  walletAddress: string;
  inviteToken: string;
  inviteExpiresAt: string;
  hasAttested: boolean;
  attestedAt: string | null;
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  lastCheckIn: string;
  nextCheckInDue: string;
  vaultStatus: string;
}

export interface CreateVaultParams {
  name: string;
  checkInIntervalDays: number;
  gracePeriodDays: number;
  guardians: Array<{ name: string; email: string; phone?: string }>;
  beneficiaries: Array<{ name: string; email: string; phone?: string; walletAddress?: string; allocation: number }>;
}

export interface InviteGuardianParams {
  name: string;
  email: string;
  phone?: string;
}

export interface CreateRecoveryParams {
  walletAddress: string;
  recoveryKeys: Array<{ email: string; name: string }>;
  encryptedData: string;
}

// ==================== API Service ====================

class GuardiaVaultAPIService {
  private getAuthHeaders(): Record<string, string> {
    // GuardiaVault uses session-based auth (cookies), but we can also support token-based
    const token = localStorage.getItem('accessToken') || localStorage.getItem('guardiavault_token');
    const headers: Record<string, string> = {};
    
    // If token exists, use Bearer auth (for API-only access)
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${GUARDIAVAULT_API_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // CRITICAL: Include cookies for session-based auth
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ==================== Vault Management ====================

  async getVaults(): Promise<{ vaults: Vault[]; guardians: Guardian[] }> {
    return this.request<{ vaults: Vault[]; guardians: Guardian[] }>('/vaults');
  }

  async getVault(vaultId: string): Promise<Vault> {
    return this.request<Vault>(`/vaults/${vaultId}`);
  }

  async createVault(params: CreateVaultParams): Promise<Vault> {
    return this.request<Vault>('/vaults', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async updateVault(vaultId: string, updates: Partial<Vault>): Promise<Vault> {
    return this.request<Vault>(`/vaults/${vaultId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteVault(vaultId: string): Promise<void> {
    return this.request<void>(`/vaults/${vaultId}`, {
      method: 'DELETE',
    });
  }

  async activateVault(vaultId: string): Promise<Vault> {
    return this.request<Vault>(`/vaults/${vaultId}/activate`, {
      method: 'POST',
    });
  }

  async deactivateVault(vaultId: string): Promise<Vault> {
    return this.request<Vault>(`/vaults/${vaultId}/deactivate`, {
      method: 'POST',
    });
  }

  // ==================== Guardian Management ====================

  async getGuardians(vaultId: string): Promise<Guardian[]> {
    return this.request<Guardian[]>(`/vaults/${vaultId}/guardians`);
  }

  async inviteGuardian(vaultId: string, params: InviteGuardianParams): Promise<Guardian> {
    return this.request<Guardian>(`/vaults/${vaultId}/guardians/invite`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async removeGuardian(vaultId: string, guardianId: string): Promise<void> {
    return this.request<void>(`/vaults/${vaultId}/guardians/${guardianId}/remove`, {
      method: 'POST',
    });
  }

  async updateGuardian(vaultId: string, guardianId: string, updates: Partial<Guardian>): Promise<Guardian> {
    return this.request<Guardian>(`/vaults/${vaultId}/guardians/${guardianId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // ==================== Beneficiary Management ====================

  async getBeneficiaries(vaultId: string): Promise<Beneficiary[]> {
    return this.request<Beneficiary[]>(`/vaults/${vaultId}/beneficiaries`);
  }

  async addBeneficiary(vaultId: string, beneficiary: Omit<Beneficiary, 'id' | 'vaultId' | 'role' | 'status'>): Promise<Beneficiary> {
    return this.request<Beneficiary>(`/vaults/${vaultId}/beneficiaries`, {
      method: 'POST',
      body: JSON.stringify(beneficiary),
    });
  }

  async updateBeneficiary(vaultId: string, beneficiaryId: string, updates: Partial<Beneficiary>): Promise<Beneficiary> {
    return this.request<Beneficiary>(`/vaults/${vaultId}/beneficiaries/${beneficiaryId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteBeneficiary(vaultId: string, beneficiaryId: string): Promise<void> {
    return this.request<void>(`/vaults/${vaultId}/beneficiaries/${beneficiaryId}`, {
      method: 'DELETE',
    });
  }

  // ==================== Check-In System ====================

  async performCheckIn(vaultId: string, options?: {
    message?: string;
    signature?: string;
    biometricData?: any;
  }): Promise<CheckInResponse> {
    return this.request<CheckInResponse>(`/vaults/${vaultId}/checkin`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  }

  async getCheckInHistory(vaultId: string): Promise<any[]> {
    return this.request<any[]>(`/vaults/${vaultId}/checkin/history`);
  }

  async getCheckInStatus(vaultId: string): Promise<{
    lastCheckIn: string | null;
    nextCheckInDue: string | null;
    status: string;
    daysUntilNext: number;
  }> {
    return this.request(`/vaults/${vaultId}/checkin/status`);
  }

  // ==================== Recovery System ====================

  async createRecovery(params: CreateRecoveryParams): Promise<RecoveryRequest> {
    return this.request<RecoveryRequest>('/recovery/create', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async verifyRecoveryToken(token: string): Promise<{
    recoveryId: string;
    walletAddress: string;
    recoveryKeyInfo: { name: string; email: string };
  }> {
    return this.request(`/recovery/verify-token/${token}`);
  }

  async hasAttested(recoveryId: string, walletAddress: string): Promise<{ hasAttested: boolean }> {
    return this.request(`/recovery/has-attested/${recoveryId}?walletAddress=${walletAddress}`);
  }

  async markAttested(recoveryId: string, walletAddress: string): Promise<{ success: boolean; attestedCount: number }> {
    return this.request(`/recovery/mark-attested/${recoveryId}`, {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
    });
  }

  async getRecoveryMetrics(): Promise<{
    metrics: any;
    recoveryNeeds: number;
  }> {
    return this.request('/recovery/metrics');
  }

  // ==================== Guardian Portal ====================

  async getGuardianInviteInfo(token: string): Promise<{
    vault: Vault;
    guardian: Guardian;
    owner: { name: string; email: string };
  }> {
    return this.request(`/guardian-portal/invite/${token}`);
  }

  async acceptGuardianInvite(token: string, acceptTerms: boolean, otp?: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request('/guardian-portal/accept', {
      method: 'POST',
      body: JSON.stringify({ token, acceptTerms, otp }),
    });
  }

  async guardianAttest(token: string, claimId: string, decision: 'approve' | 'reject'): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request('/guardian-portal/attest', {
      method: 'POST',
      body: JSON.stringify({ token, claimId, decision }),
    });
  }

  async getGuardianStatus(token: string): Promise<{
    vault: Vault;
    guardian: Guardian;
    pendingClaims: any[];
  }> {
    return this.request(`/guardian-portal/status/${token}`);
  }

  // ==================== Fragment Management (Shamir Secret Sharing) ====================

  async createFragments(vaultId: string, secret: string): Promise<{
    success: boolean;
    fragments: string[];
  }> {
    return this.request(`/fragments/create`, {
      method: 'POST',
      body: JSON.stringify({ vaultId, secret }),
    });
  }

  async getFragments(vaultId: string): Promise<{
    fragments: Array<{ id: string; guardianId: string; encryptedFragment: string }>;
  }> {
    return this.request(`/fragments/${vaultId}`);
  }

  async verifyFragment(vaultId: string, fragmentId: string, fragment: string): Promise<{
    success: boolean;
    valid: boolean;
  }> {
    return this.request(`/fragments/${vaultId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ fragmentId, fragment }),
    });
  }

  async reconstructSecret(vaultId: string, fragments: string[]): Promise<{
    success: boolean;
    secret: string;
  }> {
    return this.request(`/fragments/${vaultId}/reconstruct`, {
      method: 'POST',
      body: JSON.stringify({ fragments }),
    });
  }

  // ==================== Web3 Integration ====================

  async verifyWeb3Signature(address: string, message: string, signature: string): Promise<{
    success: boolean;
    verified: boolean;
    address: string;
  }> {
    return this.request('/web3/signature/verify', {
      method: 'POST',
      body: JSON.stringify({ address, message, signature }),
    });
  }

  async linkWallet(walletAddress: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request('/wallet/link', {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
    });
  }

  async getWalletBalance(): Promise<{
    eth: string;
    tokens: Record<string, string>;
    totalValueUsd: string;
  }> {
    return this.request('/wallet/balance');
  }

  // ==================== Subscription ====================

  async getSubscriptionStatus(): Promise<{
    status: 'active' | 'expired' | 'none';
    plan?: string;
    currentPeriodEnd?: string;
  }> {
    return this.request('/subscriptions/status');
  }
}

export const guardiaVaultAPI = new GuardiaVaultAPIService();

