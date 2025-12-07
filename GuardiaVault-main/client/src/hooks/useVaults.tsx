import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Vault, Party } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface VaultsResponse {
  vaults: Vault[];
}

interface VaultResponse {
  vault: Vault | undefined;
}

interface PartiesResponse {
  parties: Party[];
}

interface CreateVaultData {
  name: string;
  checkInIntervalDays?: number;
  gracePeriodDays?: number;
  guardians?: Array<{
    name: string;
    email: string;
    phone?: string;
  }>;
  beneficiaries?: Array<{
    name: string;
    email: string;
    phone?: string;
  }>;
  recoveryPhrase?: string;
}

// Get all vaults for the current user
export function useVaults() {
  return useQuery<VaultsResponse>({
    queryKey: ["/api/vaults"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
      });

      // Handle 401 silently - user is not authenticated (expected)
      if (res.status === 401) {
        return { vaults: [] };
      }

      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
      
      return await res.json();
    },
    retry: false,
  });
}

// Get a specific vault
export function useVault(vaultId: string | undefined) {
  return useQuery<VaultResponse>({
    queryKey: ["/api/vaults", vaultId],
    enabled: !!vaultId,
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
      });

      // Handle 401 silently - user is not authenticated (expected)
      if (res.status === 401) {
        // Return empty vault - React Query will handle this gracefully
        // Components should check if vault exists before rendering
        return { vault: undefined } as VaultResponse;
      }

      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
      
      return await res.json();
    },
    retry: false,
  });
}

// Get parties (guardians/beneficiaries) for a vault
export function useParties(vaultId: string | undefined) {
  return useQuery<PartiesResponse>({
    queryKey: ["/api/vaults", vaultId, "parties"],
    enabled: !!vaultId,
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
      });

      // Handle 401 silently - user is not authenticated (expected)
      if (res.status === 401) {
        return { parties: [] };
      }

      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
      
      return await res.json();
    },
    retry: false,
  });
}

// Get parties by role
export function usePartiesByRole(vaultId: string | undefined, role: "guardian" | "beneficiary" | "attestor") {
  return useQuery<PartiesResponse>({
    queryKey: ["/api/vaults", vaultId, "parties", role],
    enabled: !!vaultId,
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
      });

      // Handle 401 silently - user is not authenticated (expected)
      if (res.status === 401) {
        return { parties: [] };
      }

      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
      
      return await res.json();
    },
    retry: false,
  });
}

// Create a new vault
export function useCreateVault() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateVaultData) => {
      const response = await apiRequest("POST", "/api/vaults", data);
      
      // Check content-type before parsing
      const contentType = response.headers.get("content-type");
      if (contentType && !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response (${contentType}). This usually means the endpoint doesn't exist or there's a server error.`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate vault queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/vaults"] });
      // Also invalidate any specific vault queries
      if (data?.vault?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/vaults", data.vault.id] });
        // Invalidate parties queries for this vault to refresh guardians/beneficiaries
        queryClient.invalidateQueries({ queryKey: ["/api/vaults", data.vault.id, "parties"] });
        queryClient.invalidateQueries({ queryKey: ["/api/vaults", data.vault.id, "parties", "guardian"] });
        queryClient.invalidateQueries({ queryKey: ["/api/vaults", data.vault.id, "parties", "beneficiary"] });
      }
      
      // Store passphrase data in sessionStorage for PassphraseDisplay component
      // This is a one-time display, so we store it temporarily
      if (data?.masterSecret && data?.guardianPassphrases) {
        sessionStorage.setItem(`vault_passphrases_${data.vault.id}`, JSON.stringify({
          masterSecret: data.masterSecret,
          guardianPassphrases: data.guardianPassphrases,
          vaultName: data.vault.name,
        }));
      }
      
      toast({
        title: "Vault Created",
        description: `Your vault "${data?.vault?.name || 'Vault'}" has been created successfully!`,
      });
    },
    onError: (error: Error) => {
      let errorMessage = error.message;
      if (error.message.includes("401") || error.message.includes("Unauthorized")) {
        errorMessage = "You are not logged in. Please log in and try again.";
      }
      toast({
        title: "Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}

// Perform check-in
export function useCheckIn(vaultId: string) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ message, signature }: { message: string; signature: string }) => {
      const response = await apiRequest("POST", `/api/vaults/${vaultId}/checkin`, {
        message,
        signature,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vaults", vaultId] });
      queryClient.invalidateQueries({ queryKey: ["/api/vaults"] });
      toast({
        title: "Check-in Successful",
        description: "Your vault status has been updated. Stay safe!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Check-in Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
