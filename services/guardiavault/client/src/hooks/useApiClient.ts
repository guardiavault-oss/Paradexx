import { useCallback } from "react";
import { apiClient, type ApiError } from "@/utils/api-client";
import { useToast } from "@/hooks/use-toast";
import { getUserFriendlyError } from "@/utils/errorMessages";

/**
 * Hook for making API calls with automatic error handling and toast notifications
 */
export function useApiClient() {
  const { toast } = useToast();

  const handleApiError = useCallback(
    (error: ApiError, customMessage?: string) => {
      const friendlyError = getUserFriendlyError({
        code: error.code,
        status: error.status,
        message: customMessage || error.message,
      });

      toast({
        title: friendlyError.title,
        description: friendlyError.message,
        variant: "destructive",
      });
    },
    [toast]
  );

  const get = useCallback(
    async <T,>(endpoint: string, showErrors = true) => {
      try {
        return await apiClient.get<T>(endpoint, {
          onError: showErrors ? handleApiError : undefined,
        });
      } catch (error) {
        if (showErrors) handleApiError(error as ApiError);
        throw error;
      }
    },
    [handleApiError]
  );

  const post = useCallback(
    async <T,>(endpoint: string, data?: any, showErrors = true) => {
      try {
        return await apiClient.post<T>(endpoint, data, {
          onError: showErrors ? handleApiError : undefined,
        });
      } catch (error) {
        if (showErrors) handleApiError(error as ApiError);
        throw error;
      }
    },
    [handleApiError]
  );

  const put = useCallback(
    async <T,>(endpoint: string, data?: any, showErrors = true) => {
      try {
        return await apiClient.put<T>(endpoint, data, {
          onError: showErrors ? handleApiError : undefined,
        });
      } catch (error) {
        if (showErrors) handleApiError(error as ApiError);
        throw error;
      }
    },
    [handleApiError]
  );

  const del = useCallback(
    async <T,>(endpoint: string, showErrors = true) => {
      try {
        return await apiClient.delete<T>(endpoint, {
          onError: showErrors ? handleApiError : undefined,
        });
      } catch (error) {
        if (showErrors) handleApiError(error as ApiError);
        throw error;
      }
    },
    [handleApiError]
  );

  return {
    get,
    post,
    put,
    delete: del,
    handleApiError,
  };
}

