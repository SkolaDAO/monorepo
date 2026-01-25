import { createPublicClient, http, getAddress, type Address } from "viem";
import { base, baseSepolia } from "viem/chains";
import { env } from "../lib/env";

const chain = env.CHAIN_ID === 8453 ? base : baseSepolia;

const client = createPublicClient({
  chain,
  transport: http(env.RPC_URL),
});

const COURSE_MARKETPLACE_ABI = [
  {
    name: "hasAccess",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "courseId", type: "uint256" },
      { name: "user", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "getCourse",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "courseId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "creator", type: "address" },
          { name: "priceUsd", type: "uint256" },
          { name: "metadataURI", type: "string" },
          { name: "isActive", type: "bool" },
        ],
      },
    ],
  },
] as const;

const CREATOR_REGISTRY_ABI = [
  {
    name: "isRegistered",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "getCreatorInfo",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "registered", type: "bool" },
          { name: "paidUsd", type: "uint256" },
          { name: "paidAt", type: "uint256" },
        ],
      },
    ],
  },
] as const;

const CONTRACT_ADDRESSES: Record<number, { marketplace: Address; registry: Address }> = {
  84532: {
    marketplace: "0x586a62aB930F79FD90dC242d6edA38f07535e844" as Address,
    registry: "0xBe8A57E1cA02959c3af70ebc6a3eECb9cb94b279" as Address,
  },
  8453: {
    marketplace: "0x0000000000000000000000000000000000000000" as Address,
    registry: "0x0000000000000000000000000000000000000000" as Address,
  },
};

function getContracts() {
  const addresses = CONTRACT_ADDRESSES[env.CHAIN_ID];
  if (!addresses) {
    throw new Error(`Unsupported chain ID: ${env.CHAIN_ID}`);
  }
  return addresses;
}

export async function checkCourseAccess(courseId: number, userAddress: string): Promise<boolean> {
  try {
    const contracts = getContracts();
    if (contracts.marketplace === "0x0000000000000000000000000000000000000000") {
      return false;
    }

    const hasAccess = await client.readContract({
      address: contracts.marketplace,
      abi: COURSE_MARKETPLACE_ABI,
      functionName: "hasAccess",
      args: [BigInt(courseId), getAddress(userAddress)],
    });

    return hasAccess;
  } catch {
    return false;
  }
}

export async function checkIsCreator(userAddress: string): Promise<boolean> {
  try {
    const contracts = getContracts();
    if (contracts.registry === "0x0000000000000000000000000000000000000000") {
      return false;
    }

    const isRegistered = await client.readContract({
      address: contracts.registry,
      abi: CREATOR_REGISTRY_ABI,
      functionName: "isRegistered",
      args: [getAddress(userAddress)],
    });

    return isRegistered;
  } catch (error) {
    console.error("[checkIsCreator] Error:", error);
    return false;
  }
}

export async function getCreatorInfo(
  userAddress: string
): Promise<{ registered: boolean; paidUsd: bigint; paidAt: bigint } | null> {
  try {
    const contracts = getContracts();
    if (contracts.registry === "0x0000000000000000000000000000000000000000") {
      return null;
    }

    const info = await client.readContract({
      address: contracts.registry,
      abi: CREATOR_REGISTRY_ABI,
      functionName: "getCreatorInfo",
      args: [getAddress(userAddress)],
    });

    return info;
  } catch (error) {
    console.error("[getCreatorInfo] Error:", error);
    return null;
  }
}

export { client };
