import { apiClient, ApiResponse } from './api-client';
import {
    LoginCredentials,
    RegisterData,
    AuthResponse,
    User,
    AuthTokens,
} from '../types/api.types';

// Authentication service functions
export const authService = {
    // Login user
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>('/api/auth/login', credentials);
        return response.data;
    },

    // Register new user
    register: async (userData: RegisterData): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>('/api/auth/register', userData);
        return response.data;
    },

    // Refresh access token
    refreshToken: async (refreshToken: string): Promise<ApiResponse<AuthTokens>> => {
        const response = await apiClient.post<ApiResponse<AuthTokens>>('/api/auth/refresh', {
            refreshToken,
        });
        return response.data;
    },

    // Logout user
    logout: async (): Promise<ApiResponse> => {
        const response = await apiClient.post<ApiResponse>('/api/auth/logout');
        return response.data;
    },

    // Get current user profile
    getCurrentUser: async (): Promise<ApiResponse<User>> => {
        const response = await apiClient.get<ApiResponse<User>>('/api/auth/me');
        return response.data;
    },

    // Update user profile
    updateProfile: async (updates: Partial<User>): Promise<ApiResponse<User>> => {
        const response = await apiClient.put<ApiResponse<User>>('/api/auth/profile', updates);
        return response.data;
    },

    // Change password
    changePassword: async (oldPassword: string, newPassword: string): Promise<ApiResponse> => {
        const response = await apiClient.post<ApiResponse>('/api/auth/change-password', {
            oldPassword,
            newPassword,
        });
        return response.data;
    },

    // Request password reset
    requestPasswordReset: async (email: string): Promise<ApiResponse> => {
        const response = await apiClient.post<ApiResponse>('/api/auth/forgot-password', { email });
        return response.data;
    },

    // Reset password with token
    resetPassword: async (token: string, newPassword: string): Promise<ApiResponse> => {
        const response = await apiClient.post<ApiResponse>('/api/auth/reset-password', {
            token,
            newPassword,
        });
        return response.data;
    },

    // Verify email
    verifyEmail: async (token: string): Promise<ApiResponse> => {
        const response = await apiClient.post<ApiResponse>('/api/auth/verify-email', { token });
        return response.data;
    },

    // Enable 2FA
    enable2FA: async (): Promise<ApiResponse<{ qrCode: string; secret: string }>> => {
        const response = await apiClient.post<ApiResponse<{ qrCode: string; secret: string }>>(
            '/api/auth/2fa/enable'
        );
        return response.data;
    },

    // Verify and enable 2FA
    verify2FA: async (token: string): Promise<ApiResponse> => {
        const response = await apiClient.post<ApiResponse>('/api/auth/2fa/verify', { token });
        return response.data;
    },

    // Disable 2FA
    disable2FA: async (token: string): Promise<ApiResponse> => {
        const response = await apiClient.post<ApiResponse>('/api/auth/2fa/disable', { token });
        return response.data;
    },

    // Get user sessions
    getSessions: async (): Promise<ApiResponse<Array<{ id: string; device: string; ip: string; createdAt: string }>>> => {
        const response = await apiClient.get<ApiResponse<Array<{ id: string; device: string; ip: string; createdAt: string }>>>('/api/auth/sessions');
        return response.data;
    },

    // Revoke session
    revokeSession: async (sessionId: string): Promise<ApiResponse> => {
        const response = await apiClient.delete<ApiResponse>(`/api/auth/sessions/${sessionId}`);
        return response.data;
    },

    // Revoke all sessions except current
    revokeAllSessions: async (): Promise<ApiResponse> => {
        const response = await apiClient.delete<ApiResponse>('/api/auth/sessions');
        return response.data;
    },
};
