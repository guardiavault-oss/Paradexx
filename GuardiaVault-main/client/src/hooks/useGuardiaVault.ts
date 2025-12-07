import { useState, useCallback } from "react";
// Optimized Ethers import - use optimized imports for better tree-shaking
import { BrowserProvider } from "@/lib/ethers-optimized";
import { useToast } from "@/hooks/use-toast";
import { logError } from "@/utils/logger";
import {
  getGuardiaVaultContract,
  createVault as contractCreateVault,
  performCheckIn as contractPerformCheckIn,
  getVaultDetails,
  getVaultStatus,
  attestDeath as contractAttestDeath,
  claim as contractClaim,
  updateVaultStatus as contractUpdateVaultStatus,
  emergencyRevoke as contractEmergencyRevoke,
  updateMetadata as contractUpdateMetadata,
  getGuardians,
  getGuardianAttestationCount,
  hasGuardianAttested,
  isGuardian,
  canRevoke,
  type VaultData,
  type VaultStatus,
} from "@/lib/contracts/guardiaVault";

export function useGuardiaVault() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getContract = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error("No Ethereum wallet found");
    }

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return getGuardiaVaultContract(signer);
  }, []);

  const createVault = useCallback(
    async (
      checkInInterval: number,
      gracePeriod: number,
      beneficiaries: string[],
      guardians: [string, string, string], // Exactly 3 guardians
      metadataHash: string
    ) => {
      setLoading(true);
      try {
        const contract = await getContract();
        const receipt = await contractCreateVault(
          contract,
          checkInInterval,
          gracePeriod,
          beneficiaries,
          guardians,
          metadataHash
        );

        toast({
          title: "Vault Created!",
          description: `Transaction confirmed in block ${receipt.blockNumber}`,
        });

        return receipt;
      } catch (error: any) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          context: "createVault",
        });
        toast({
          title: "Error",
          description: error.message || "Failed to create vault",
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getContract, toast]
  );

  const checkIn = useCallback(
    async (vaultId: number) => {
      setLoading(true);
      try {
        const contract = await getContract();
        const receipt = await contractPerformCheckIn(contract, vaultId);

        toast({
          title: "Check-in Successful!",
          description: "Your vault activity has been updated",
        });

        return receipt;
      } catch (error: any) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          context: "checkIn",
        });
        toast({
          title: "Error",
          description: error.message || "Failed to perform check-in",
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getContract, toast]
  );

  const fetchVaultDetails = useCallback(
    async (vaultId: number): Promise<VaultData | null> => {
      setLoading(true);
      try {
        const contract = await getContract();
        const details = await getVaultDetails(contract, vaultId);
        return details;
      } catch (error: any) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          context: "fetchVaultDetails",
        });
        toast({
          title: "Error",
          description: error.message || "Failed to fetch vault details",
          variant: "destructive",
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getContract, toast]
  );

  const fetchVaultStatus = useCallback(
    async (vaultId: number): Promise<VaultStatus | null> => {
      try {
        const contract = await getContract();
        const status = await getVaultStatus(contract, vaultId);
        return status;
      } catch (error: any) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          context: "fetchVaultStatus",
        });
        return null;
      }
    },
    [getContract]
  );

  // Note: Beneficiaries and guardians are set at vault creation and cannot be modified

  const attestDeath = useCallback(
    async (vaultId: number) => {
      setLoading(true);
      try {
        const contract = await getContract();
        const receipt = await contractAttestDeath(contract, vaultId);

        toast({
          title: "Death Attested!",
          description: "Your attestation has been recorded",
        });

        return receipt;
      } catch (error: any) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          context: "attestDeath",
        });
        toast({
          title: "Error",
          description: error.message || "Failed to attest death",
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getContract, toast]
  );

  const claimVault = useCallback(
    async (vaultId: number) => {
      setLoading(true);
      try {
        const contract = await getContract();
        const receipt = await contractClaim(contract, vaultId);

        toast({
          title: "Vault Claimed!",
          description: "You have successfully claimed the vault",
        });

        return receipt;
      } catch (error: any) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          context: "claimVault",
        });
        toast({
          title: "Error",
          description: error.message || "Failed to claim vault",
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getContract, toast]
  );

  const updateVaultStatus = useCallback(
    async (vaultId: number) => {
      setLoading(true);
      try {
        const contract = await getContract();
        const receipt = await contractUpdateVaultStatus(contract, vaultId);

        toast({
          title: "Status Updated!",
          description: "Vault status has been updated",
        });

        return receipt;
      } catch (error: any) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          context: "updateVaultStatus",
        });
        toast({
          title: "Error",
          description: error.message || "Failed to update vault status",
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getContract, toast]
  );

  const revokeVault = useCallback(
    async (vaultId: number) => {
      setLoading(true);
      try {
        const contract = await getContract();
        const receipt = await contractEmergencyRevoke(contract, vaultId);

        toast({
          title: "Vault Revoked!",
          description: "False trigger has been revoked",
        });

        return receipt;
      } catch (error: any) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          context: "revokeVault",
        });
        toast({
          title: "Error",
          description: error.message || "Failed to revoke vault",
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getContract, toast]
  );

  const updateMetadata = useCallback(
    async (vaultId: number, newMetadataHash: string) => {
      setLoading(true);
      try {
        const contract = await getContract();
        const receipt = await contractUpdateMetadata(contract, vaultId, newMetadataHash);

        toast({
          title: "Metadata Updated!",
          description: "Vault metadata has been updated",
        });

        return receipt;
      } catch (error: any) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          context: "updateMetadata",
        });
        toast({
          title: "Error",
          description: error.message || "Failed to update metadata",
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getContract, toast]
  );

  const fetchGuardians = useCallback(
    async (vaultId: number): Promise<string[]> => {
      try {
        const contract = await getContract();
        return await getGuardians(contract, vaultId);
      } catch (error: any) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          context: "fetchGuardians",
        });
        return [];
      }
    },
    [getContract]
  );

  const fetchGuardianAttestationCount = useCallback(
    async (vaultId: number): Promise<number> => {
      try {
        const contract = await getContract();
        return await getGuardianAttestationCount(contract, vaultId);
      } catch (error: any) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          context: "fetchGuardianAttestationCount",
        });
        return 0;
      }
    },
    [getContract]
  );

  return {
    loading,
    createVault,
    checkIn,
    fetchVaultDetails,
    fetchVaultStatus,
    attestDeath,
    claimVault,
    updateVaultStatus,
    revokeVault,
    updateMetadata,
    fetchGuardians,
    fetchGuardianAttestationCount,
  };
}
