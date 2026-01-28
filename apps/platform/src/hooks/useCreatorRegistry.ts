import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, formatUnits, isAddress } from "viem";
import { useQuery } from "@tanstack/react-query";
import { useContractConfig } from "./useContracts";
import { useAccount } from "wagmi";

export function useEthPrice() {
  const { creatorRegistry } = useContractConfig();

  const { data: contractPrice } = useReadContract({
    ...creatorRegistry,
    functionName: "getEthPriceUsd",
  });

  const { data: apiPrice } = useQuery({
    queryKey: ["eth-price"],
    queryFn: async () => {
      const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
      const data = await res.json();
      return data.ethereum.usd as number;
    },
    staleTime: 60_000,
    enabled: !contractPrice,
  });

  const priceUsd = contractPrice 
    ? Number(formatUnits(contractPrice, 6)) 
    : apiPrice ?? null;

  return {
    priceUsd,
    priceRaw: contractPrice ?? 0n,
    isLoading: !contractPrice && !apiPrice,
  };
}

export function useCreatorInfo(address: `0x${string}` | undefined) {
  const { creatorRegistry } = useContractConfig();

  const { data, isLoading, refetch } = useReadContract({
    ...creatorRegistry,
    functionName: "getCreatorInfo",
    args: address ? [address] : undefined,
    query: { enabled: !!address, staleTime: 30_000 },
  });

  return {
    isLoading,
    refetch,
    isRegistered: data?.registered ?? false,
    paidUsd: data?.paidUsd ?? 0n,
    paidUsdFormatted: `$${Number(formatUnits(data?.paidUsd ?? 0n, 6)).toFixed(2)}`,
    paidAt: data?.paidAt ?? 0n,
  };
}

export function useRegistrationFee() {
  const { creatorRegistry } = useContractConfig();

  const { data } = useReadContracts({
    contracts: [
      { ...creatorRegistry, functionName: "registrationFeeUsd" },
      { ...creatorRegistry, functionName: "getRequiredETH" },
    ],
    query: { staleTime: 60_000 },
  });

  const feeUsd = data?.[0]?.result as bigint | undefined;
  const feeEth = data?.[1]?.result as bigint | undefined;

  return {
    feeUsd: Number(formatUnits(feeUsd ?? 20_000_000n, 6)),
    feeUsdc: feeUsd ?? 20_000_000n,
    feeEth: feeEth ?? 0n,
    feeEthFormatted: feeEth ? `${Number(formatEther(feeEth)).toFixed(4)} ETH` : "—",
  };
}

export function useRegisterWithETH() {
  const { creatorRegistry } = useContractConfig();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const register = (value: bigint) => {
    writeContract({
      ...creatorRegistry,
      functionName: "registerWithETH",
      value,
    });
  };

  return { register, hash, isPending, isConfirming, isSuccess, error };
}

export function useRegisterWithUSDC() {
  const { creatorRegistry } = useContractConfig();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const register = () => {
    writeContract({
      ...creatorRegistry,
      functionName: "registerWithUSDC",
    });
  };

  return { register, hash, isPending, isConfirming, isSuccess, error };
}

// ============ Admin Functions ============

export function useIsContractAdmin() {
  const { address } = useAccount();
  const { creatorRegistry } = useContractConfig();

  const { data: isAdmin, isLoading, refetch } = useReadContract({
    ...creatorRegistry,
    functionName: "isAdmin",
    args: address ? [address] : undefined,
    query: { enabled: !!address, staleTime: 60_000 },
  });

  return { isAdmin: isAdmin ?? false, isLoading, refetch };
}

export function useContractOwner() {
  const { creatorRegistry } = useContractConfig();

  const { data: owner, isLoading } = useReadContract({
    ...creatorRegistry,
    functionName: "owner",
    query: { staleTime: 300_000 },
  });

  return { owner, isLoading };
}

export function useIsRegisteredOnchain(address: `0x${string}` | undefined) {
  const { creatorRegistry } = useContractConfig();

  const { data: isRegistered, isLoading, refetch } = useReadContract({
    ...creatorRegistry,
    functionName: "isRegistered",
    args: address ? [address] : undefined,
    query: { enabled: !!address, staleTime: 30_000 },
  });

  return { isRegistered: isRegistered ?? false, isLoading, refetch };
}

export function useWhitelistCreator() {
  const { creatorRegistry } = useContractConfig();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const whitelist = (address: `0x${string}`) => {
    if (!isAddress(address)) return;
    writeContract({
      ...creatorRegistry,
      functionName: "whitelistCreator",
      args: [address],
    });
  };

  return { whitelist, hash, isPending, isConfirming, isSuccess, error, reset };
}

export function useWhitelistCreators() {
  const { creatorRegistry } = useContractConfig();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const whitelistBatch = (addresses: `0x${string}`[]) => {
    const valid = addresses.filter(a => isAddress(a));
    if (valid.length === 0) return;
    writeContract({
      ...creatorRegistry,
      functionName: "whitelistCreators",
      args: [valid],
    });
  };

  return { whitelistBatch, hash, isPending, isConfirming, isSuccess, error, reset };
}

export function useRemoveCreatorOnchain() {
  const { creatorRegistry } = useContractConfig();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const remove = (address: `0x${string}`) => {
    if (!isAddress(address)) return;
    writeContract({
      ...creatorRegistry,
      functionName: "removeCreator",
      args: [address],
    });
  };

  return { remove, hash, isPending, isConfirming, isSuccess, error, reset };
}
