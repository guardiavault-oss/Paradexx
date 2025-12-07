import { useWriteContract, useReadContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { parseEther, formatEther, type Address } from "viem";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const ESCROW_CONTRACT_ADDRESS = (import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000") as Address;

const SUBSCRIPTION_ESCROW_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "monthlyRate", "type": "uint256" },
      { "internalType": "uint256", "name": "prepaidMonths", "type": "uint256" }
    ],
    "name": "createSubscription",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "subscriber", "type": "address" }
    ],
    "name": "getSubscriptionStatus",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "subscriber", "type": "address" },
          { "internalType": "uint256", "name": "monthlyRate", "type": "uint256" },
          { "internalType": "uint256", "name": "prepaidMonths", "type": "uint256" },
          { "internalType": "uint256", "name": "monthsConsumed", "type": "uint256" },
          { "internalType": "uint256", "name": "lastPaymentTime", "type": "uint256" },
          { "internalType": "uint256", "name": "depositAmount", "type": "uint256" },
          { "internalType": "bool", "name": "active", "type": "bool" },
          { "internalType": "bool", "name": "vaultTriggered", "type": "bool" },
          { "internalType": "uint256", "name": "triggerTime", "type": "uint256" }
        ],
        "internalType": "struct SubscriptionEscrow.Subscription",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "subscriber", "type": "address" }
    ],
    "name": "getRemainingMonths",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "subscriber", "type": "address" }
    ],
    "name": "isSubscriptionActive",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MIN_PREPAID_MONTHS",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_PREPAID_MONTHS",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export interface Subscription {
  subscriber: Address;
  monthlyRate: bigint;
  prepaidMonths: bigint;
  monthsConsumed: bigint;
  lastPaymentTime: bigint;
  depositAmount: bigint;
  active: boolean;
  vaultTriggered: boolean;
  triggerTime: bigint;
}

export function useCreateSubscription() {
  const { toast } = useToast();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  useEffect(() => {
    if (isSuccess) {
      toast({
        title: "Subscription Created!",
        description: "Your subscription has been successfully created on-chain",
      });
    }
  }, [isSuccess, toast]);

  const createSubscription = (monthlyRateEth: string, prepaidMonths: number) => {
    const monthlyRateWei = parseEther(monthlyRateEth);
    const totalValue = monthlyRateWei * BigInt(prepaidMonths);

    writeContract({
      address: ESCROW_CONTRACT_ADDRESS,
      abi: SUBSCRIPTION_ESCROW_ABI,
      functionName: "createSubscription",
      args: [monthlyRateWei, BigInt(prepaidMonths)],
      value: totalValue,
    });
  };

  return {
    createSubscription,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useSubscriptionStatus(subscriberAddress?: Address) {
  const { address } = useAccount();
  const targetAddress = subscriberAddress || address;

  const { data, isLoading, isError, refetch } = useReadContract({
    address: ESCROW_CONTRACT_ADDRESS,
    abi: SUBSCRIPTION_ESCROW_ABI,
    functionName: "getSubscriptionStatus",
    args: targetAddress ? [targetAddress] : undefined,
    query: {
      enabled: !!targetAddress,
    },
  });

  const subscription = data ? {
    subscriber: (data as any)[0],
    monthlyRate: (data as any)[1],
    prepaidMonths: (data as any)[2],
    monthsConsumed: (data as any)[3],
    lastPaymentTime: (data as any)[4],
    depositAmount: (data as any)[5],
    active: (data as any)[6],
    vaultTriggered: (data as any)[7],
    triggerTime: (data as any)[8],
  } as Subscription : null;

  return {
    subscription,
    isLoading,
    isError,
    refetch,
  };
}

export function useRemainingMonths(subscriberAddress?: Address) {
  const { address } = useAccount();
  const targetAddress = subscriberAddress || address;

  const { data, isLoading, isError, refetch } = useReadContract({
    address: ESCROW_CONTRACT_ADDRESS,
    abi: SUBSCRIPTION_ESCROW_ABI,
    functionName: "getRemainingMonths",
    args: targetAddress ? [targetAddress] : undefined,
    query: {
      enabled: !!targetAddress,
    },
  });

  return {
    remainingMonths: data !== undefined ? Number(data) : null,
    isLoading,
    isError,
    refetch,
  };
}

export function useIsSubscriptionActive(subscriberAddress?: Address) {
  const { address } = useAccount();
  const targetAddress = subscriberAddress || address;

  const { data, isLoading, isError, refetch } = useReadContract({
    address: ESCROW_CONTRACT_ADDRESS,
    abi: SUBSCRIPTION_ESCROW_ABI,
    functionName: "isSubscriptionActive",
    args: targetAddress ? [targetAddress] : undefined,
    query: {
      enabled: !!targetAddress,
    },
  });

  return {
    isActive: data || false,
    isLoading,
    isError,
    refetch,
  };
}

export function useSubscriptionLimits() {
  const { data: minMonths } = useReadContract({
    address: ESCROW_CONTRACT_ADDRESS,
    abi: SUBSCRIPTION_ESCROW_ABI,
    functionName: "MIN_PREPAID_MONTHS",
  });

  const { data: maxMonths } = useReadContract({
    address: ESCROW_CONTRACT_ADDRESS,
    abi: SUBSCRIPTION_ESCROW_ABI,
    functionName: "MAX_PREPAID_MONTHS",
  });

  return {
    minPrepaidMonths: minMonths !== undefined ? Number(minMonths) : 1,
    maxPrepaidMonths: maxMonths !== undefined ? Number(maxMonths) : 24,
  };
}

export { ESCROW_CONTRACT_ADDRESS };
