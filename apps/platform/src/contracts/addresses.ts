import { base } from "wagmi/chains";

type ContractAddresses = {
  creatorRegistry: `0x${string}`;
  courseMarketplace: `0x${string}`;
  usdc: `0x${string}`;
};

export const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  [base.id]: {
    creatorRegistry: "0xdC930f9CCc43487F1188d6EDA71BF7684259Bdc3",
    courseMarketplace: "0x6b7ad46fBbe7Afac9d5FBdB822DE3cb26a953149",
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
};

export function getContractAddresses(chainId: number): ContractAddresses {
  return CONTRACT_ADDRESSES[chainId] || CONTRACT_ADDRESSES[base.id];
}
