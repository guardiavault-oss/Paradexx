import { useQuery } from "@tanstack/react-query";
import { useWallet } from "./useWallet";

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  plan?: string;
  status?: string;
  currentPeriodEnd?: string;
  isLoading: boolean;
  isError: boolean;
}

export function useSubscription(): SubscriptionStatus {
  const { isAuthenticated } = useWallet();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: async () => {
      const response = await fetch("/api/subscriptions/status", {
        credentials: "include",
      });

      if (!response.ok) {
        // If not authenticated or no subscription, return null
        if (response.status === 401 || response.status === 404) {
          return null;
        }
        throw new Error("Failed to fetch subscription status");
      }

      return response.json();
    },
    enabled: isAuthenticated,
    retry: false,
  });

  const subscription = data?.subscription || null;
  const hasActiveSubscription = !!subscription && subscription.status === "active";

  return {
    hasActiveSubscription,
    plan: subscription?.plan,
    status: subscription?.status,
    currentPeriodEnd: subscription?.currentPeriodEnd,
    isLoading,
    isError,
  };
}

