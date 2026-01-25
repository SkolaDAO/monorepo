import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits } from "viem";
import { useContractConfig } from "./useContracts";

export function useUSDCBalance(address: `0x${string}` | undefined) {
  const { usdc } = useContractConfig();

  const { data, isLoading, refetch } = useReadContract({
    ...usdc,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, staleTime: 15_000 },
  });

  return {
    balance: data ? formatUnits(data, 6) : "0",
    balanceRaw: data ?? 0n,
    isLoading,
    refetch,
  };
}

export function useUSDCAllowance(owner: `0x${string}` | undefined, spender: `0x${string}`) {
  const { usdc } = useContractConfig();

  const { data, isLoading, refetch } = useReadContract({
    ...usdc,
    functionName: "allowance",
    args: owner ? [owner, spender] : undefined,
    query: { enabled: !!owner, staleTime: 15_000 },
  });

  return {
    allowance: data ?? 0n,
    isLoading,
    refetch,
  };
}

export function useApproveUSDC() {
  const { usdc } = useContractConfig();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = (spender: `0x${string}`, amount: bigint) => {
    writeContract({
      ...usdc,
      functionName: "approve",
      args: [spender, amount],
    });
  };

  return { approve, hash, isPending, isConfirming, isSuccess, error };
}
