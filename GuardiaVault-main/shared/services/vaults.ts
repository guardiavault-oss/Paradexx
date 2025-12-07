/**
 * Vault Service
 * Platform-agnostic vault operations
 */

import { apiClient } from "./apiClient";
import { API_ENDPOINTS } from "../config/api";

export interface Vault {
  id: string;
  name: string;
  status: string;
  checkInIntervalDays: number;
  gracePeriodDays: number;
  lastCheckInAt: string;
  nextCheckInDue: string;
}

export interface CreateVaultData {
  name: string;
  checkInIntervalDays: number;
  gracePeriodDays: number;
  guardians: Array<{ email: string; name: string }>;
  beneficiaries: Array<{ email: string; name: string }>;
}

export class VaultService {
  async list(): Promise<Vault[]> {
    const response = await apiClient.get<{ vaults: Vault[] }>(API_ENDPOINTS.vaults.list);
    return response.vaults || [];
  }

  async get(id: string): Promise<Vault> {
    return apiClient.get(API_ENDPOINTS.vaults.get(id));
  }

  async create(data: CreateVaultData): Promise<Vault> {
    const response = await apiClient.post<{ vault: Vault }>(API_ENDPOINTS.vaults.create, data);
    return response.vault;
  }

  async checkIn(vaultId: string, message: string, signature: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.vaults.checkIn(vaultId), {
      message,
      signature,
    });
  }
}

export const vaultService = new VaultService();

