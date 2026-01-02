'use client';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBlockNumber } from 'wagmi';
import { parseUnits } from 'viem';
import { CONTRACT_ADDRESSES, TOKEN_ADDRESSES } from '@/lib/wagmi';
import { CoordinatorAgentABI, ExecutionAgentABI, MockPriceOracleABI } from '@/lib/contracts';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// Auto-refresh interval in ms
const REFRESH_INTERVAL = 5000; // 5 seconds

// Hook to get user's permission status with auto-refresh
export function usePermission() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  
  const { data: permission, isLoading, refetch, queryKey } = useReadContract({
    address: CONTRACT_ADDRESSES.coordinatorAgent as `0x${string}`,
    abi: CoordinatorAgentABI,
    functionName: 'getPermission',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: REFRESH_INTERVAL,
    },
  });

  const { data: dailySpent, refetch: refetchDailySpent } = useReadContract({
    address: CONTRACT_ADDRESSES.coordinatorAgent as `0x${string}`,
    abi: CoordinatorAgentABI,
    functionName: 'getDailySpent',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: REFRESH_INTERVAL,
    },
  });

  const { data: totalSpent, refetch: refetchTotalSpent } = useReadContract({
    address: CONTRACT_ADDRESSES.coordinatorAgent as `0x${string}`,
    abi: CoordinatorAgentABI,
    functionName: 'totalSpent',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: REFRESH_INTERVAL,
    },
  });

  // Refetch all on new block
  const { data: blockNumber } = useBlockNumber({ watch: true });
  
  useEffect(() => {
    if (blockNumber && address) {
      refetch();
      refetchDailySpent();
      refetchTotalSpent();
    }
  }, [blockNumber, address, refetch, refetchDailySpent, refetchTotalSpent]);

  return {
    permission: permission as {
      user: string;
      token: string;
      dailyLimit: bigint;
      totalLimit: bigint;
      startTime: bigint;
      duration: bigint;
      targetDipBps: bigint;
      active: boolean;
    } | undefined,
    dailySpent: dailySpent as bigint | undefined,
    totalSpent: totalSpent as bigint | undefined,
    isLoading,
    refetch,
  };
}

// Hook to get user's execution stats with auto-refresh
export function useUserStats() {
  const { address } = useAccount();
  const { data: blockNumber } = useBlockNumber({ watch: true });

  const { data: stats, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.executionAgent as `0x${string}`,
    abi: ExecutionAgentABI,
    functionName: 'getUserStats',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: REFRESH_INTERVAL,
    },
  });

  // Refetch on new block
  useEffect(() => {
    if (blockNumber && address) {
      refetch();
    }
  }, [blockNumber, address, refetch]);

  return {
    ethAccumulated: stats?.[0] as bigint | undefined,
    availableToday: stats?.[1] as bigint | undefined,
    isLoading,
    refetch,
  };
}

// Hook to get current ETH price with auto-refresh
export function useEthPrice() {
  const { data: blockNumber } = useBlockNumber({ watch: true });
  
  const { data: price, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.mockPriceOracle as `0x${string}`,
    abi: MockPriceOracleABI,
    functionName: 'getPrice',
    args: ['0x0000000000000000000000000000000000000000'], // ETH address
    query: {
      refetchInterval: REFRESH_INTERVAL,
    },
  });

  // Refetch on new block
  useEffect(() => {
    if (blockNumber) {
      refetch();
    }
  }, [blockNumber, refetch]);

  return {
    price: price as bigint | undefined,
    priceFormatted: price ? Number(price) / 1e8 : undefined, // Convert from 8 decimals
    isLoading,
    refetch,
  };
}

// Hook to grant permission
export function useGrantPermission() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const grantPermission = async ({
    dailyAmount,
    duration,
    dipThreshold,
  }: {
    dailyAmount: number;
    duration: number;
    dipThreshold: number;
  }) => {
    // Convert daily amount to USDC decimals (6)
    const dailyLimit = parseUnits(dailyAmount.toString(), 6);
    const totalLimit = parseUnits((dailyAmount * duration).toString(), 6);
    const targetDipBps = BigInt(dipThreshold * 100); // Convert percentage to basis points

    writeContract({
      address: CONTRACT_ADDRESSES.coordinatorAgent as `0x${string}`,
      abi: CoordinatorAgentABI,
      functionName: 'receivePermission',
      args: [
        TOKEN_ADDRESSES.usdc as `0x${string}`,
        dailyLimit,
        totalLimit,
        BigInt(duration),
        targetDipBps,
      ],
    });
  };

  return {
    grantPermission,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

// Hook to get global stats with auto-refresh
export function useGlobalStats() {
  const { data: blockNumber } = useBlockNumber({ watch: true });
  
  const { data: stats, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.executionAgent as `0x${string}`,
    abi: ExecutionAgentABI,
    functionName: 'getGlobalStats',
    query: {
      refetchInterval: REFRESH_INTERVAL,
    },
  });

  // Refetch on new block
  useEffect(() => {
    if (blockNumber) {
      refetch();
    }
  }, [blockNumber, refetch]);

  return {
    totalSwaps: stats?.[0] as bigint | undefined,
    totalUsdcSpent: stats?.[1] as bigint | undefined,
    totalEthBought: stats?.[2] as bigint | undefined,
    isLoading,
    refetch,
  };
}
