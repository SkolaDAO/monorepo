import { base, baseSepolia } from "wagmi/chains";

type ContractAddresses = {
  creatorRegistry: `0x${string}`;
  courseMarketplace: `0x${string}`;
  usdc: `0x${string}`;
};

export const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  [baseSepolia.id]: {
    creatorRegistry: "0xBe8A57E1cA02959c3af70ebc6a3eECb9cb94b279",
    courseMarketplace: "0x586a62aB930F79FD90dC242d6edA38f07535e844",
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  },
  [base.id]: {
    creatorRegistry: "0x0000000000000000000000000000000000000000",
    courseMarketplace: "0x0000000000000000000000000000000000000000",
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
};

export function getContractAddresses(chainId: number): ContractAddresses {
  return CONTRACT_ADDRESSES[chainId] || CONTRACT_ADDRESSES[baseSepolia.id];
}
