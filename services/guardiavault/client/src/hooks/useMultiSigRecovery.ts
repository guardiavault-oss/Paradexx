import { useState, useCallback } from "react";
// Optimized Ethers import - use optimized imports for better tree-shaking
import { BrowserProvider, ethers } from "@/lib/ethers-optimized";
import { useToast } from "@/hooks/use-toast";
import { logError } from "@/utils/logger";
import {
  getMultiSigRecoveryContract,
  createRecovery as contractCreateRecovery,
  attestRecovery as contractAttestRecovery,
  completeRecovery as contractCompleteRecovery,
  cancelRecovery as contractCancelRecovery,
  getRecoveryDetails,
  getRecoveryAttestationCount,
  hasRecoveryKeyAttested,
  getTimeUntilRecovery,
  canCompleteRecovery,
  isRecoveryKey,
  type RecoveryData,
  RecoveryStatus,
} from "@/lib/contracts/multiSigRecovery";

export function useMultiSigRecovery() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getContract = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error("No Ethereum wallet found");
    }

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return getMultiSigRecoveryContract(signer);
  }, []);

  const createRecovery = useCallback(
    async (
      walletAddress: string,
      recoveryKeys: [string, string, string],
      encryptedData: string
    ) => {
      setLoading(true);
      try {
        const contract = await getContract();
        const receipt = await contractCreateRecovery(
          contract,
          walletAddress,
          recoveryKeys,
          encryptedData
        );

        // Extract recovery ID from events
        const event = receipt.logs.find(
          (log: any) =>
            log.topics[0] ===
            ethers.id("RecoveryCreated(uint256,address,address,address[3],uint256)")
        );

        const recoveryId = event
          ? Number(event.topics[1])
          : receipt.logs.length > 0
          ? 0
          : 0;

        toast({
          title: "Recovery Setup Complete!",
          description: `Recovery ID: ${recoveryId}. Recovery keys will be notified.`,
        });

        return { recoveryId, receipt };
      } catch (error: any) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          context: "createRecovery",
        });
        toast({
          title: "Error",
          description: error.message || "Failed to create recovery setup",
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getContract, toast]
  );

  const attestRecovery = useCallback(
    async (recoveryId: number) => {
      setLoading(true);
      try {
        const contract = await getContract();
        const receipt = await contractAttestRecovery(contract, recoveryId);

        // Check if recovery was triggered (2-of-3 threshold met)
        const attestationCount = await getRecoveryAttestationCount(
          contract,
          recoveryId
        );
        const recoveryData = await getRecoveryDetails(contract, recoveryId);

        const triggered = recoveryData.status === RecoveryStatus.Triggered;

        toast({
          title: triggered ? "Recovery Triggered!" : "Attestation Recorded",
          description: triggered
            ? `${attestationCount} of 2 recovery keys attested. 7-day time lock started.`
            : `${attestationCount} of 2 recovery keys attested.`,
        });

        return { receipt, triggered, attestationCount };
      } catch (error: any) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          context: "attestRecovery",
        });
        toast({
          title: "Error",
          description: error.message || "Failed to attest recovery",
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getContract, toast]
  );

  const completeRecovery = useCallback(
    async (recoveryId: number) => {
      setLoading(true);
      try {
        const contract = await getContract();
        const receipt = await contractCompleteRecovery(contract, recoveryId);

        const recoveryData = await getRecoveryDetails(contract, recoveryId);

        toast({
          title: "Recovery Completed!",
          description: `Recovery for wallet ${recoveryData.walletAddress} has been completed.`,
        });

        return { receipt, recoveryData };
      } catch (error: any) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          context: "completeRecovery",
        });
        toast({
          title: "Error",
          description: error.message || "Failed to complete recovery",
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getContract, toast]
  );

  const cancelRecovery = useCallback(
    async (recoveryId: number) => {
      setLoading(true);
      try {
        const contract = await getContract();
        const receipt = await contractCancelRecovery(contract, recoveryId);

        toast({
          title: "Recovery Cancelled",
          description: "Recovery has been cancelled successfully.",
        });

        return { receipt };
      } catch (error: any) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          context: "cancelRecovery",
        });
        toast({
          title: "Error",
          description: error.message || "Failed to cancel recovery",
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getContract, toast]
  );

  const fetchRecovery = useCallback(
    async (recoveryId: number): Promise<RecoveryData> => {
      try {
        const contract = await getContract();
        return await getRecoveryDetails(contract, recoveryId);
      } catch (error: any) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          context: "fetchRecovery",
        });
        throw error;
      }
    },
    [getContract]
  );

  const fetchRecoveryStatus = useCallback(
    async (recoveryId: number) => {
      try {
        const contract = await getContract();
        const [recoveryData, attestationCount, canCompleteResult] =
          await Promise.all([
            getRecoveryDetails(contract, recoveryId),
            getRecoveryAttestationCount(contract, recoveryId),
            canCompleteRecovery(contract, recoveryId),
          ]);

        return {
          recovery: recoveryData,
          attestationCount,
          canComplete: canCompleteResult.canComplete,
          timeRemaining: canCompleteResult.timeRemaining,
        };
      } catch (error: any) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          context: "fetchRecoveryStatus",
        });
        throw error;
      }
    },
    [getContract]
  );

  return {
    loading,
    createRecovery,
    attestRecovery,
    completeRecovery,
    cancelRecovery,
    fetchRecovery,
    fetchRecoveryStatus,
  };
}

