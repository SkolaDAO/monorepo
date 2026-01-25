import { useChainId } from "wagmi";
import { getContractAddresses } from "../contracts/addresses";
import { usdcAbi, creatorRegistryAbi, courseMarketplaceAbi } from "../contracts/abis";

export function useContractConfig() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  return {
    usdc: {
      address: addresses.usdc,
      abi: usdcAbi,
    },
    creatorRegistry: {
      address: addresses.creatorRegistry,
      abi: creatorRegistryAbi,
    },
    courseMarketplace: {
      address: addresses.courseMarketplace,
      abi: courseMarketplaceAbi,
    },
  };
}
