export const usdcAbi = [
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ type: "uint8" }],
    stateMutability: "view",
  },
] as const;

export const creatorRegistryAbi = [
  {
    type: "function",
    name: "registerWithETH",
    inputs: [],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "registerWithUSDC",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "isRegistered",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCreatorInfo",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "registered", type: "bool" },
          { name: "paidUsd", type: "uint256" },
          { name: "paidAt", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRequiredETH",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "registrationFeeUsd",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getEthPriceUsd",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export const courseMarketplaceAbi = [
  {
    type: "function",
    name: "createCourse",
    inputs: [
      { name: "priceUsd", type: "uint256" },
      { name: "metadataURI", type: "string" },
    ],
    outputs: [{ type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updateCourse",
    inputs: [
      { name: "courseId", type: "uint256" },
      { name: "priceUsd", type: "uint256" },
      { name: "metadataURI", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deactivateCourse",
    inputs: [{ name: "courseId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "reactivateCourse",
    inputs: [{ name: "courseId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "purchaseWithETH",
    inputs: [
      { name: "courseId", type: "uint256" },
      { name: "referrer", type: "address" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "purchaseWithUSDC",
    inputs: [
      { name: "courseId", type: "uint256" },
      { name: "referrer", type: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getCourse",
    inputs: [{ name: "courseId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "creator", type: "address" },
          { name: "priceUsd", type: "uint256" },
          { name: "metadataURI", type: "string" },
          { name: "active", type: "bool" },
          { name: "totalSales", type: "uint256" },
          { name: "totalRevenue", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasAccess",
    inputs: [
      { name: "courseId", type: "uint256" },
      { name: "user", type: "address" },
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPriceInETH",
    inputs: [{ name: "courseId", type: "uint256" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nextCourseId",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "protocolFeeBps",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "courses",
    inputs: [{ name: "courseId", type: "uint256" }],
    outputs: [
      { name: "creator", type: "address" },
      { name: "priceUsd", type: "uint256" },
      { name: "metadataURI", type: "string" },
      { name: "active", type: "bool" },
      { name: "totalSales", type: "uint256" },
      { name: "totalRevenue", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getEthPriceUsd",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
] as const;
