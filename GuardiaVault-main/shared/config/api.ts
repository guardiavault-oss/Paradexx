/**
 * API Configuration
 * Shared between web and mobile
 */

export const API_BASE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

export const API_ENDPOINTS = {
  // Auth
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    logout: "/api/auth/logout",
    me: "/api/auth/me",
  },
  // Vaults
  vaults: {
    list: "/api/vaults",
    get: (id: string) => `/api/vaults/${id}`,
    create: "/api/vaults",
    checkIn: (id: string) => `/api/vaults/${id}/checkin`,
  },
  // Recovery
  recovery: {
    create: "/api/recovery/create",
    verifyToken: (token: string) => `/api/recovery/verify-token/${token}`,
  },
  // Yield Vaults
  yieldVaults: {
    list: "/api/yield-vaults",
    create: "/api/yield-vaults",
    get: (id: string) => `/api/yield-vaults/${id}`,
  },
  // DAO
  dao: {
    claims: "/api/dao/claims",
    claimCreate: "/api/dao/claims",
    vote: (id: string) => `/api/dao/claims/${id}/vote`,
    verifier: (address: string) => `/api/dao/verifier/${address}`,
    verifierRegister: "/api/dao/verifier/register",
  },
} as const;

