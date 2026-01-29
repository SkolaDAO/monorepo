import "dotenv/config";
import { db } from "../db";
import { users, courses, chapters, lessons, categories, courseCategories } from "../db/schema";
import { eq } from "drizzle-orm";

const SKOLA_ADDRESS = "0x94a42DB1E578eFf403B1644FA163e523803241Fd";

interface Lesson {
  title: string;
  content: string;
}

interface Chapter {
  title: string;
  description: string;
  lessons: Lesson[];
}

interface Course {
  title: string;
  description: string;
  thumbnail: string;
  categorySlug: string;
  chapters: Chapter[];
}

// ============================================================================
// COURSE DEFINITIONS
// ============================================================================

const COURSES: Course[] = [
  // -------------------------------------------------------------------------
  // LAYER 2s & SCALING
  // -------------------------------------------------------------------------
  {
    title: "Arbitrum Development",
    description: "Build on Arbitrum One and Arbitrum Nova. Learn Stylus for Rust/C++ smart contracts, cross-chain messaging with the Arbitrum bridge, and optimizing for the Arbitrum VM.",
    thumbnail: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800",
    categorySlug: "layer-2",
    chapters: [
      {
        title: "Arbitrum Architecture",
        description: "Understanding Arbitrum's optimistic rollup design",
        lessons: [
          {
            title: "How Arbitrum Works",
            content: `# How Arbitrum Works

Arbitrum is an **optimistic rollup** that inherits Ethereum's security while offering 10-100x lower fees.

## The Optimistic Approach

Unlike ZK rollups that prove every transaction, Arbitrum **assumes transactions are valid** unless challenged:

1. Sequencer orders and executes transactions
2. State roots posted to Ethereum L1
3. 7-day challenge period for disputes
4. Fraud proofs punish invalid states

## Key Components

### Sequencer
- Orders incoming transactions
- Provides instant "soft confirmations"
- Currently centralized (decentralizing soon)

### Validators
- Monitor state assertions
- Submit fraud proofs if invalid state detected
- Economic incentives for honest behavior

### Bridge
- Locks assets on L1
- Mints equivalent on L2
- Withdrawals require 7-day wait (or use fast bridges)

## Arbitrum One vs Nova

| Feature | Arbitrum One | Arbitrum Nova |
|---------|--------------|---------------|
| Data Availability | Ethereum L1 | DAC (off-chain) |
| Security | Maximum | Slightly lower |
| Cost | Low | Ultra-low |
| Use Case | DeFi, high-value | Gaming, social |

## Why Build on Arbitrum?

- **EVM equivalent**: Deploy Solidity unchanged
- **Largest L2 TVL**: ~$10B+ locked
- **Ecosystem**: 500+ protocols
- **Stylus**: Write contracts in Rust, C++`
          },
          {
            title: "Deploying to Arbitrum",
            content: `# Deploying to Arbitrum

Deploying to Arbitrum is nearly identical to Ethereum mainnet.

## Network Configuration

\`\`\`javascript
// hardhat.config.js
module.exports = {
  networks: {
    arbitrumOne: {
      url: "https://arb1.arbitrum.io/rpc",
      chainId: 42161,
      accounts: [process.env.PRIVATE_KEY]
    },
    arbitrumSepolia: {
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      chainId: 421614,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
\`\`\`

## Key Differences from Ethereum

### Block Numbers
\`\`\`solidity
// L2 block number (Arbitrum)
block.number

// L1 block number
ArbSys(0x64).arbBlockNumber()
\`\`\`

### Gas Pricing
Arbitrum has two gas components:
- **L2 gas**: Computation on Arbitrum (~0.1 gwei)
- **L1 gas**: Calldata posted to Ethereum

\`\`\`solidity
// Get current gas prices
import {ArbGasInfo} from "@arbitrum/nitro-contracts/src/precompiles/ArbGasInfo.sol";

(uint256 l1BaseFee, uint256 l2BaseFee, , , , ) = 
    ArbGasInfo(0x6c).getPricesInWei();
\`\`\`

## Deployment Script

\`\`\`javascript
const hre = require("hardhat");

async function main() {
  const Contract = await hre.ethers.getContractFactory("MyContract");
  const contract = await Contract.deploy();
  await contract.waitForDeployment();
  
  console.log("Deployed to:", await contract.getAddress());
  
  // Verify on Arbiscan
  await hre.run("verify:verify", {
    address: await contract.getAddress(),
    constructorArguments: []
  });
}

main().catch(console.error);
\`\`\`

## Testing Locally

\`\`\`bash
# Use Arbitrum's local dev node
npx @arbitrum/nitro-testnode
\`\`\``
          }
        ]
      },
      {
        title: "Stylus: Rust on Arbitrum",
        description: "Write smart contracts in Rust with Stylus",
        lessons: [
          {
            title: "Introduction to Stylus",
            content: `# Introduction to Stylus

Stylus lets you write smart contracts in **Rust, C, and C++** on Arbitrum.

## Why Stylus?

- **10-100x cheaper** than Solidity for compute
- **Memory efficient**: Better for complex operations
- **Familiar tooling**: Use Cargo, existing Rust crates
- **Interoperable**: Call Solidity contracts and vice versa

## How It Works

\`\`\`
Rust Code → WASM → Arbitrum WASM VM
                        ↓
              Runs alongside EVM
\`\`\`

## Your First Stylus Contract

\`\`\`rust
#![cfg_attr(not(feature = "std"), no_std)]
extern crate alloc;

use stylus_sdk::{
    alloy_primitives::U256,
    prelude::*,
    storage::StorageU256,
};

#[storage]
#[entrypoint]
pub struct Counter {
    count: StorageU256,
}

#[public]
impl Counter {
    pub fn get(&self) -> U256 {
        self.count.get()
    }
    
    pub fn increment(&mut self) {
        let current = self.count.get();
        self.count.set(current + U256::from(1));
    }
    
    pub fn set(&mut self, value: U256) {
        self.count.set(value);
    }
}
\`\`\`

## Setup

\`\`\`bash
# Install Stylus CLI
cargo install cargo-stylus

# Create new project
cargo stylus new my_contract
cd my_contract

# Build
cargo stylus build

# Deploy
cargo stylus deploy --private-key $KEY
\`\`\`

## When to Use Stylus

✅ Complex math (cryptography, ML)
✅ Heavy computation
✅ Existing Rust libraries

❌ Simple token contracts
❌ When Solidity ecosystem matters`
          },
          {
            title: "Stylus Advanced Patterns",
            content: `# Stylus Advanced Patterns

Advanced techniques for production Stylus contracts.

## Storage Patterns

\`\`\`rust
use stylus_sdk::storage::{
    StorageU256, StorageAddress, StorageMap, StorageVec
};

#[storage]
pub struct Vault {
    owner: StorageAddress,
    total_deposits: StorageU256,
    balances: StorageMap<Address, U256>,
    depositors: StorageVec<Address>,
}

#[public]
impl Vault {
    pub fn deposit(&mut self) {
        let sender = msg::sender();
        let amount = msg::value();
        
        // Update balance
        let current = self.balances.get(sender);
        self.balances.insert(sender, current + amount);
        
        // Track depositor
        self.depositors.push(sender);
        
        // Update total
        let total = self.total_deposits.get();
        self.total_deposits.set(total + amount);
    }
}
\`\`\`

## Calling Solidity from Rust

\`\`\`rust
use stylus_sdk::call::Call;
use alloy_sol_types::sol;

// Define the Solidity interface
sol! {
    interface IERC20 {
        function balanceOf(address) external view returns (uint256);
        function transfer(address to, uint256 amount) external returns (bool);
    }
}

pub fn get_balance(token: Address, account: Address) -> U256 {
    let erc20 = IERC20::new(token);
    erc20.balance_of(&mut Call::new(), account).unwrap()
}
\`\`\`

## Gas Optimization

\`\`\`rust
// Use fixed-size arrays when possible
let mut data: [u8; 32] = [0u8; 32];

// Batch storage operations
#[public]
impl BatchOperations {
    pub fn batch_transfer(&mut self, recipients: Vec<Address>, amounts: Vec<U256>) {
        // Single storage read
        let mut sender_balance = self.balances.get(msg::sender());
        
        for (recipient, amount) in recipients.iter().zip(amounts.iter()) {
            sender_balance -= amount;
            let recipient_balance = self.balances.get(*recipient);
            self.balances.insert(*recipient, recipient_balance + amount);
        }
        
        // Single storage write
        self.balances.insert(msg::sender(), sender_balance);
    }
}
\`\`\`

## Error Handling

\`\`\`rust
use stylus_sdk::prelude::*;

#[derive(SolidityError)]
pub enum VaultError {
    InsufficientBalance(U256, U256),
    Unauthorized(Address),
}

#[public]
impl Vault {
    pub fn withdraw(&mut self, amount: U256) -> Result<(), VaultError> {
        let sender = msg::sender();
        let balance = self.balances.get(sender);
        
        if balance < amount {
            return Err(VaultError::InsufficientBalance(balance, amount));
        }
        
        self.balances.insert(sender, balance - amount);
        Ok(())
    }
}
\`\`\``
          }
        ]
      }
    ]
  },

  {
    title: "Optimism & The OP Stack",
    description: "Master Optimism development and learn to deploy your own L2 using the OP Stack. Covers cross-chain messaging, custom gas tokens, and rollup deployment.",
    thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800",
    categorySlug: "layer-2",
    chapters: [
      {
        title: "Optimism Fundamentals",
        description: "Building on Optimism mainnet",
        lessons: [
          {
            title: "Optimism Architecture",
            content: `# Optimism Architecture

Optimism pioneered the optimistic rollup design that powers Base, Zora, and many other L2s.

## Core Components

### op-node
The consensus layer:
- Derives L2 blocks from L1 data
- Handles deposits from L1
- Syncs with other nodes

### op-geth
The execution layer:
- Modified go-ethereum
- Executes transactions
- Maintains state

### op-batcher
Transaction batching:
- Collects L2 transactions
- Compresses into batches
- Posts to L1 as calldata

### op-proposer
State commitments:
- Submits L2 state roots to L1
- Enables withdrawals
- Subject to challenge period

## Transaction Flow

\`\`\`
User → Sequencer → op-geth (execute)
                      ↓
              op-batcher (batch)
                      ↓
              L1 calldata (permanent)
\`\`\`

## Deposits (L1 → L2)

\`\`\`solidity
// On L1: Send ETH to OptimismPortal
OptimismPortal.depositTransaction{value: 1 ether}(
    to,           // L2 recipient
    value,        // ETH amount
    gasLimit,     // L2 gas
    isCreation,   // Contract creation?
    data          // Calldata
);
\`\`\`

## Withdrawals (L2 → L1)

1. Initiate on L2 (call L2ToL1MessagePasser)
2. Wait for state root on L1 (~1 hour)
3. Prove withdrawal
4. Wait 7 days (challenge period)
5. Finalize on L1`
          },
          {
            title: "Cross-Chain Messaging",
            content: `# Cross-Chain Messaging

Send messages between Optimism and Ethereum.

## L1 → L2 Messages

\`\`\`solidity
// L1 Contract
import {ICrossDomainMessenger} from "@eth-optimism/contracts/L1/messaging/IL1CrossDomainMessenger.sol";

contract L1Sender {
    address constant L1_MESSENGER = 0x25ace71c97B33Cc4729CF772ae268934F7ab5fA1;
    
    function sendToL2(address l2Target, bytes calldata message) external {
        ICrossDomainMessenger(L1_MESSENGER).sendMessage(
            l2Target,
            message,
            1000000 // gas limit on L2
        );
    }
}
\`\`\`

## L2 → L1 Messages

\`\`\`solidity
// L2 Contract
import {ICrossDomainMessenger} from "@eth-optimism/contracts/L2/messaging/IL2CrossDomainMessenger.sol";

contract L2Sender {
    address constant L2_MESSENGER = 0x4200000000000000000000000000000000000007;
    
    function sendToL1(address l1Target, bytes calldata message) external {
        ICrossDomainMessenger(L2_MESSENGER).sendMessage(
            l1Target,
            message,
            0 // L1 gas (estimated automatically)
        );
    }
}
\`\`\`

## Verifying Message Sender

\`\`\`solidity
// On receiving chain
import {ICrossDomainMessenger} from "...";

contract Receiver {
    address public messenger;
    address public trustedSender; // Contract on other chain
    
    modifier onlyFromTrustedSender() {
        require(
            msg.sender == messenger &&
            ICrossDomainMessenger(messenger).xDomainMessageSender() == trustedSender,
            "Invalid sender"
        );
        _;
    }
    
    function receiveMessage(uint256 data) external onlyFromTrustedSender {
        // Process message safely
    }
}
\`\`\`

## Message Timing

| Direction | Confirmation Time |
|-----------|------------------|
| L1 → L2 | ~1-2 minutes |
| L2 → L1 | 7 days (challenge period) |

Use third-party bridges for faster L2→L1 if needed.`
          }
        ]
      },
      {
        title: "Deploying Your Own L2",
        description: "Launch a chain with the OP Stack",
        lessons: [
          {
            title: "OP Stack Overview",
            content: `# OP Stack Overview

The OP Stack is the standardized, modular blueprint for building L2s.

## What is the OP Stack?

A set of open-source components:
- **Shared codebase** with Optimism mainnet
- **Modular architecture** for customization
- **Superchain compatible** for interoperability

## Chains Built on OP Stack

- **Base** (Coinbase)
- **Zora** (NFT-focused)
- **Mode** (DeFi-focused)
- **Worldcoin** (identity)
- Many more...

## Stack Layers

### Consensus Layer
How the chain agrees on state:
- Currently: Centralized sequencer
- Future: Decentralized sequencing

### Execution Layer
How transactions are processed:
- op-geth (EVM)
- Alternative VMs possible

### Settlement Layer
Where state is verified:
- Ethereum L1
- Fraud proofs

### Data Availability Layer
Where data is stored:
- Ethereum calldata
- EIP-4844 blobs
- Alt-DA (Celestia, etc.)

## Customization Options

\`\`\`
Standard OP Stack
├── Custom gas token (not just ETH)
├── Custom block time
├── Custom gas limits
├── Alternative DA layer
└── Governance configuration
\`\`\`

## The Superchain Vision

All OP Stack chains will:
- Share security
- Have native messaging
- Share liquidity
- Upgrade together`
          },
          {
            title: "Launching an OP Stack Chain",
            content: `# Launching an OP Stack Chain

Step-by-step guide to deploying your own L2.

## Prerequisites

\`\`\`bash
# Install dependencies
brew install go jq direnv

# Clone optimism monorepo
git clone https://github.com/ethereum-optimism/optimism.git
cd optimism

# Install
pnpm install
make op-node op-batcher op-proposer
\`\`\`

## Configuration

\`\`\`bash
# Generate addresses
./packages/contracts-bedrock/scripts/getting-started/wallets.sh

# Configure network
cat > deploy-config/getting-started.json << EOF
{
  "l1ChainID": 11155111,
  "l2ChainID": 42069,
  "l1BlockTime": 12,
  "l2BlockTime": 2,
  "maxSequencerDrift": 600,
  "sequencerWindowSize": 3600,
  "channelTimeout": 300,
  "batcherAddress": "0x...",
  "proposerAddress": "0x...",
  "sequencerAddress": "0x...",
  "l1StartingBlockTag": "latest"
}
EOF
\`\`\`

## Deploy L1 Contracts

\`\`\`bash
cd packages/contracts-bedrock

# Deploy
forge script scripts/Deploy.s.sol:Deploy \\
  --rpc-url $L1_RPC_URL \\
  --private-key $DEPLOYER_KEY \\
  --broadcast
\`\`\`

## Generate Genesis

\`\`\`bash
# Create L2 genesis file
go run cmd/genesis/main.go genesis \\
  --deploy-config ./deploy-config/getting-started.json \\
  --l1-deployments ./deployments/11155111.json \\
  --outfile ./genesis.json
\`\`\`

## Run the Stack

\`\`\`bash
# Terminal 1: op-geth
./op-geth --datadir ./datadir --http --http.api eth,net,web3

# Terminal 2: op-node
./op-node --l1 $L1_RPC --l2 http://localhost:8551 --rpc.addr 0.0.0.0

# Terminal 3: op-batcher
./op-batcher --l1-eth-rpc $L1_RPC --l2-eth-rpc http://localhost:8545

# Terminal 4: op-proposer
./op-proposer --l1-eth-rpc $L1_RPC --l2-eth-rpc http://localhost:8545
\`\`\`

## Verify It Works

\`\`\`bash
# Check L2 is producing blocks
cast block-number --rpc-url http://localhost:8545

# Send test transaction
cast send --rpc-url http://localhost:8545 \\
  --private-key $TEST_KEY \\
  0x0000...dead --value 0.001ether
\`\`\``
          }
        ]
      }
    ]
  },

  {
    title: "zkSync Era Development",
    description: "Build on zkSync Era with native account abstraction and zkEVM. Learn Solidity differences, paymaster implementation, and leveraging ZK proofs.",
    thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800",
    categorySlug: "layer-2",
    chapters: [
      {
        title: "zkSync Fundamentals",
        description: "Understanding zkSync's unique features",
        lessons: [
          {
            title: "zkSync Architecture",
            content: `# zkSync Architecture

zkSync Era is a **ZK rollup** with native account abstraction and EVM compatibility.

## ZK vs Optimistic Rollups

| Aspect | ZK Rollups | Optimistic Rollups |
|--------|-----------|-------------------|
| Proof | Mathematical validity | Fraud proofs |
| Finality | Minutes | 7 days |
| Cost | Higher compute | Lower compute |
| Complexity | Very high | Moderate |

## How zkSync Works

1. **Execute**: Transactions run on zkSync
2. **Prove**: ZK circuit generates validity proof
3. **Verify**: L1 contract verifies proof
4. **Finalize**: State is confirmed

## Native Account Abstraction

Every account on zkSync is a smart contract:

\`\`\`solidity
interface IAccount {
    function validateTransaction(
        bytes32 txHash,
        bytes32 suggestedSignedHash,
        Transaction calldata transaction
    ) external returns (bytes4 magic);
    
    function executeTransaction(
        bytes32 txHash,
        bytes32 suggestedSignedHash,
        Transaction calldata transaction
    ) external;
    
    function payForTransaction(
        bytes32 txHash,
        bytes32 suggestedSignedHash,
        Transaction calldata transaction
    ) external;
}
\`\`\`

## Key Differences from Ethereum

### Different Opcodes
\`\`\`solidity
// These work differently or don't exist:
// - SELFDESTRUCT (deprecated)
// - EXTCODECOPY (limited)
// - CODECOPY (different behavior)
// - CREATE/CREATE2 (use deployer system)
\`\`\`

### System Contracts
\`\`\`solidity
// Predefined system addresses
address constant DEPLOYER = 0x0...8006;
address constant MSG_VALUE = 0x0...8009;
address constant NONCE_HOLDER = 0x0...8003;
\`\`\``
          },
          {
            title: "Deploying to zkSync",
            content: `# Deploying to zkSync

Deployment requires zkSync-specific tooling.

## Setup with Hardhat

\`\`\`bash
npm install -D @matterlabs/hardhat-zksync-solc
npm install -D @matterlabs/hardhat-zksync-deploy
npm install zksync-ethers ethers
\`\`\`

## Configuration

\`\`\`javascript
// hardhat.config.js
require("@matterlabs/hardhat-zksync-solc");
require("@matterlabs/hardhat-zksync-deploy");

module.exports = {
  zksolc: {
    version: "1.4.0",
    settings: {}
  },
  solidity: {
    version: "0.8.20"
  },
  networks: {
    zkSyncMainnet: {
      url: "https://mainnet.era.zksync.io",
      ethNetwork: "mainnet",
      zksync: true
    },
    zkSyncSepolia: {
      url: "https://sepolia.era.zksync.io",
      ethNetwork: "sepolia",
      zksync: true
    }
  }
};
\`\`\`

## Deploy Script

\`\`\`javascript
// deploy/deploy.js
const { Deployer } = require("@matterlabs/hardhat-zksync-deploy");
const { Wallet } = require("zksync-ethers");

module.exports = async function (hre) {
  const wallet = new Wallet(process.env.PRIVATE_KEY);
  const deployer = new Deployer(hre, wallet);
  
  const artifact = await deployer.loadArtifact("MyContract");
  const contract = await deployer.deploy(artifact, []);
  
  console.log("Deployed to:", await contract.getAddress());
};
\`\`\`

## Compilation

\`\`\`bash
# Compile with zksolc
npx hardhat compile

# Deploy
npx hardhat deploy-zksync --script deploy.js --network zkSyncSepolia
\`\`\`

## Using zksync-ethers

\`\`\`javascript
import { Provider, Wallet, Contract } from "zksync-ethers";

const provider = new Provider("https://mainnet.era.zksync.io");
const wallet = new Wallet(privateKey, provider);

// Interact with contracts
const contract = new Contract(address, abi, wallet);
await contract.myFunction();
\`\`\``
          }
        ]
      },
      {
        title: "Paymasters",
        description: "Gasless transactions with paymasters",
        lessons: [
          {
            title: "Building a Paymaster",
            content: `# Building a Paymaster

Paymasters pay gas fees on behalf of users.

## Use Cases

- **Gasless onboarding**: Users don't need ETH
- **Pay with ERC20**: Accept USDC for gas
- **Sponsored transactions**: Free for your users
- **Subscription models**: Pay monthly for unlimited tx

## Paymaster Interface

\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IPaymaster.sol";
import "@matterlabs/zksync-contracts/l2/system-contracts/libraries/TransactionHelper.sol";

contract MyPaymaster is IPaymaster {
    modifier onlyBootloader() {
        require(msg.sender == BOOTLOADER_FORMAL_ADDRESS, "Only bootloader");
        _;
    }
    
    function validateAndPayForPaymasterTransaction(
        bytes32,
        bytes32,
        Transaction calldata _transaction
    ) external payable onlyBootloader returns (bytes4 magic, bytes memory context) {
        // Validation logic
        magic = PAYMASTER_VALIDATION_SUCCESS_MAGIC;
        
        // Pay for gas
        uint256 requiredETH = _transaction.gasLimit * _transaction.maxFeePerGas;
        (bool success, ) = payable(BOOTLOADER_FORMAL_ADDRESS).call{value: requiredETH}("");
        require(success, "Payment failed");
        
        return (magic, "");
    }
    
    function postTransaction(
        bytes calldata _context,
        Transaction calldata _transaction,
        bytes32,
        bytes32,
        ExecutionResult _txResult,
        uint256 _maxRefundedGas
    ) external payable onlyBootloader {
        // Post-transaction logic (refunds, etc.)
    }
}
\`\`\`

## ERC20 Paymaster Example

\`\`\`solidity
contract ERC20Paymaster is IPaymaster {
    IERC20 public allowedToken;
    uint256 public pricePerGas;
    
    function validateAndPayForPaymasterTransaction(
        bytes32,
        bytes32,
        Transaction calldata _transaction
    ) external payable onlyBootloader returns (bytes4 magic, bytes memory context) {
        // Get token payment from user
        address user = address(uint160(_transaction.from));
        uint256 tokenAmount = _transaction.gasLimit * pricePerGas;
        
        // Transfer tokens from user to paymaster
        allowedToken.transferFrom(user, address(this), tokenAmount);
        
        // Pay ETH to bootloader
        uint256 requiredETH = _transaction.gasLimit * _transaction.maxFeePerGas;
        (bool success, ) = payable(BOOTLOADER_FORMAL_ADDRESS).call{value: requiredETH}("");
        require(success);
        
        return (PAYMASTER_VALIDATION_SUCCESS_MAGIC, abi.encode(user, tokenAmount));
    }
}
\`\`\``
          }
        ]
      }
    ]
  },

  {
    title: "StarkNet & Cairo",
    description: "Build on StarkNet with Cairo, a Rust-inspired language for provable computation. Master STARK proofs, account abstraction, and StarkNet's unique architecture.",
    thumbnail: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800",
    categorySlug: "layer-2",
    chapters: [
      {
        title: "Cairo Programming",
        description: "Learning the Cairo language",
        lessons: [
          {
            title: "Cairo Basics",
            content: `# Cairo Basics

Cairo is StarkNet's native language, designed for provable computation.

## Why Cairo?

- **Provable by design**: Every computation generates a STARK proof
- **Rust-inspired**: Familiar syntax
- **Safe**: Strong type system, no undefined behavior
- **Efficient**: Optimized for ZK circuits

## Your First Cairo Contract

\`\`\`cairo
#[starknet::contract]
mod Counter {
    #[storage]
    struct Storage {
        count: u128,
    }
    
    #[constructor]
    fn constructor(ref self: ContractState, initial: u128) {
        self.count.write(initial);
    }
    
    #[external(v0)]
    fn increment(ref self: ContractState) {
        let current = self.count.read();
        self.count.write(current + 1);
    }
    
    #[external(v0)]
    fn get_count(self: @ContractState) -> u128 {
        self.count.read()
    }
}
\`\`\`

## Key Concepts

### Felts
The native data type in Cairo (field elements):
\`\`\`cairo
let x: felt252 = 100;  // 252-bit field element
\`\`\`

### Storage
\`\`\`cairo
#[storage]
struct Storage {
    owner: ContractAddress,
    balances: LegacyMap<ContractAddress, u256>,
}
\`\`\`

### Events
\`\`\`cairo
#[event]
#[derive(Drop, starknet::Event)]
enum Event {
    Transfer: TransferEvent,
}

#[derive(Drop, starknet::Event)]
struct TransferEvent {
    from: ContractAddress,
    to: ContractAddress,
    amount: u256,
}
\`\`\`

## Development Setup

\`\`\`bash
# Install Scarb (Cairo's package manager)
curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh

# Create project
scarb new my_project
cd my_project

# Build
scarb build
\`\`\``
          },
          {
            title: "Advanced Cairo Patterns",
            content: `# Advanced Cairo Patterns

Sophisticated patterns for production Cairo contracts.

## Component Pattern

Reusable contract modules:

\`\`\`cairo
#[starknet::component]
mod OwnableComponent {
    use starknet::ContractAddress;
    use starknet::get_caller_address;
    
    #[storage]
    struct Storage {
        owner: ContractAddress,
    }
    
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        OwnershipTransferred: OwnershipTransferred,
    }
    
    #[derive(Drop, starknet::Event)]
    struct OwnershipTransferred {
        previous: ContractAddress,
        new: ContractAddress,
    }
    
    #[embeddable_as(OwnableImpl)]
    impl Ownable<
        TContractState, +HasComponent<TContractState>
    > of super::IOwnable<ComponentState<TContractState>> {
        fn owner(self: @ComponentState<TContractState>) -> ContractAddress {
            self.owner.read()
        }
        
        fn transfer_ownership(
            ref self: ComponentState<TContractState>,
            new_owner: ContractAddress
        ) {
            self.assert_only_owner();
            let previous = self.owner.read();
            self.owner.write(new_owner);
            self.emit(OwnershipTransferred { previous, new: new_owner });
        }
    }
    
    #[generate_trait]
    impl InternalImpl<
        TContractState, +HasComponent<TContractState>
    > of InternalTrait<TContractState> {
        fn assert_only_owner(self: @ComponentState<TContractState>) {
            let caller = get_caller_address();
            assert(caller == self.owner.read(), 'Not owner');
        }
    }
}
\`\`\`

## Using Components

\`\`\`cairo
#[starknet::contract]
mod MyContract {
    use super::OwnableComponent;
    
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    
    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    
    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }
    
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
    }
}
\`\`\`

## Mappings and Storage

\`\`\`cairo
#[storage]
struct Storage {
    // Simple mapping
    balances: LegacyMap<ContractAddress, u256>,
    
    // Nested mapping
    allowances: LegacyMap<(ContractAddress, ContractAddress), u256>,
    
    // With struct key
    user_data: LegacyMap<ContractAddress, UserData>,
}

// Usage
self.balances.write(user, amount);
let balance = self.balances.read(user);

self.allowances.write((owner, spender), amount);
\`\`\``
          }
        ]
      }
    ]
  },

  {
    title: "Polygon zkEVM",
    description: "Deploy to Polygon's zkEVM with full EVM equivalence. Understand the Type 2 zkEVM approach and migrate existing Ethereum contracts.",
    thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
    categorySlug: "layer-2",
    chapters: [
      {
        title: "zkEVM Development",
        description: "Building on Polygon zkEVM",
        lessons: [
          {
            title: "Polygon zkEVM Overview",
            content: `# Polygon zkEVM Overview

Polygon zkEVM aims for **full EVM equivalence** - deploy existing contracts unchanged.

## EVM Equivalence Types

| Type | Description | Example |
|------|-------------|---------|
| Type 1 | Fully Ethereum-equivalent | (theoretical) |
| Type 2 | Fully EVM-equivalent | Polygon zkEVM |
| Type 3 | Almost EVM-equivalent | Scroll |
| Type 4 | High-level compatible | zkSync Era |

## Architecture

\`\`\`
Transactions → Sequencer → Executor → Prover
                              ↓
                        L1 Verification
\`\`\`

### Components
- **Trusted Sequencer**: Orders transactions
- **zkProver**: Generates validity proofs
- **Aggregator**: Batches proofs for L1
- **Bridge**: L1 ↔ L2 asset transfers

## Why Polygon zkEVM?

- **Deploy existing code**: No changes needed
- **Same tooling**: Hardhat, Foundry, etc.
- **Same addresses**: CREATE2 works identically
- **Fast finality**: ~30 minutes vs 7 days

## Differences from Ethereum

Most things work, but:

\`\`\`solidity
// Gas costs may differ slightly
// Some precompiles have different gas

// Block properties
block.timestamp  // Works
block.difficulty // Returns 0
block.basefee    // Supported

// Opcodes
SELFDESTRUCT    // Deprecated
PUSH0           // Supported
\`\`\`

## Network Details

\`\`\`javascript
// Mainnet
{
  chainId: 1101,
  rpc: "https://zkevm-rpc.com"
}

// Cardona Testnet
{
  chainId: 2442,
  rpc: "https://rpc.cardona.zkevm-rpc.com"
}
\`\`\``
          },
          {
            title: "Deploying to Polygon zkEVM",
            content: `# Deploying to Polygon zkEVM

Standard Ethereum tooling works seamlessly.

## Hardhat Configuration

\`\`\`javascript
// hardhat.config.js
module.exports = {
  solidity: "0.8.20",
  networks: {
    polygonZkEVM: {
      url: "https://zkevm-rpc.com",
      chainId: 1101,
      accounts: [process.env.PRIVATE_KEY]
    },
    polygonZkEVMTestnet: {
      url: "https://rpc.cardona.zkevm-rpc.com",
      chainId: 2442,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: {
      polygonZkEVM: process.env.POLYGONSCAN_API_KEY
    },
    customChains: [
      {
        network: "polygonZkEVM",
        chainId: 1101,
        urls: {
          apiURL: "https://api-zkevm.polygonscan.com/api",
          browserURL: "https://zkevm.polygonscan.com"
        }
      }
    ]
  }
};
\`\`\`

## Foundry Configuration

\`\`\`toml
# foundry.toml
[rpc_endpoints]
polygon_zkevm = "https://zkevm-rpc.com"
polygon_zkevm_testnet = "https://rpc.cardona.zkevm-rpc.com"

[etherscan]
polygon_zkevm = { key = "\${POLYGONSCAN_API_KEY}", url = "https://api-zkevm.polygonscan.com/api" }
\`\`\`

## Deploy Script

\`\`\`bash
# With Foundry
forge create src/MyContract.sol:MyContract \\
  --rpc-url polygon_zkevm \\
  --private-key $PRIVATE_KEY \\
  --verify
\`\`\`

## Bridging Assets

\`\`\`javascript
import { ethers } from "ethers";

const bridgeAbi = [...]; // Polygon zkEVM Bridge ABI
const bridgeAddress = "0x2a3DD3EB832aF982ec71669E178424b10Dca2EDe";

async function bridge(amount) {
  const bridge = new ethers.Contract(bridgeAddress, bridgeAbi, signer);
  
  // L1 → L2
  await bridge.bridgeAsset(
    1,              // destination network (1 = zkEVM)
    recipient,      // destination address
    amount,
    tokenAddress,   // 0x0 for ETH
    true,           // force update global exit root
    "0x"            // permit data
  );
}
\`\`\``
          }
        ]
      }
    ]
  },

  {
    title: "Rollup Economics & Design",
    description: "Deep dive into rollup economics, sequencer revenue, MEV, and the business of running an L2. Essential for anyone considering launching a rollup.",
    thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800",
    categorySlug: "layer-2",
    chapters: [
      {
        title: "Rollup Economics",
        description: "Understanding L2 revenue and costs",
        lessons: [
          {
            title: "L2 Revenue Model",
            content: `# L2 Revenue Model

How do rollups make money? Let's break it down.

## Revenue Sources

### 1. Transaction Fees (Primary)
\`\`\`
User pays: L2 execution + L1 data posting
Rollup keeps: L2 execution margin

Example:
User fee: $0.10
L1 cost: $0.03
Rollup profit: $0.07
\`\`\`

### 2. MEV (Maximal Extractable Value)
- Sequencer can order transactions
- Arbitrage, liquidations captured
- Some rollups share with users/protocols

### 3. Priority Fees
- Users pay extra for faster inclusion
- 100% goes to sequencer currently

## Cost Structure

### L1 Costs (Variable)
- **Calldata**: ~16 gas per byte
- **State roots**: Periodic submissions
- **Proofs**: For ZK rollups

### L1 Costs (Fixed)
- **Operator costs**: Running nodes
- **Development**: Engineering team
- **Security**: Audits, bug bounties

## Economics Example

\`\`\`
Monthly L2 transactions: 10 million
Average fee: $0.05
Gross revenue: $500,000

L1 data costs: $100,000
Operator costs: $50,000
---------------------------
Net profit: $350,000
\`\`\`

## The Squeeze

As L1 gets cheaper (EIP-4844 blobs):
- L1 costs drop 90%+
- L2 fees can drop
- But profit margins increase

This is why everyone is launching L2s.`
          },
          {
            title: "Sequencer Design",
            content: `# Sequencer Design

The sequencer is the heart of a rollup. Understand its design choices.

## Current Reality: Centralized Sequencers

Most rollups today:
- Single sequencer (the rollup team)
- Trusted to order fairly
- Single point of failure

## Why Centralized (for now)?

**Advantages:**
- Simple to build
- Fast confirmations
- Predictable ordering
- No consensus overhead

**Disadvantages:**
- Censorship risk
- MEV extraction
- Liveness dependency
- Trust assumption

## Decentralization Paths

### Shared Sequencing
Multiple rollups share sequencers:
- Cross-rollup atomicity
- Shared security
- Examples: Espresso, Astria

### Based Rollups
L1 validators sequence L2:
- Inherit L1 decentralization
- No separate token needed
- Slower confirmations

### Leader Rotation
Sequencers take turns:
- PoS selection
- Slashing for misbehavior
- Fallback mechanisms

## MEV Strategies

\`\`\`
Option 1: Extract it (keep profits)
Option 2: Burn it (reduce fees)
Option 3: Redistribute (to users/LPs)
Option 4: MEV-Share (partial return)
\`\`\`

## Sequencer Revenue

\`\`\`javascript
// Simplified sequencer economics
const transactions = 1000000;  // per day
const avgFee = 0.05;           // USD
const l1Costs = 10000;         // USD per day

const grossRevenue = transactions * avgFee;  // $50,000
const netRevenue = grossRevenue - l1Costs;   // $40,000
const annualized = netRevenue * 365;         // $14.6M
\`\`\`

This is why the "rollup wars" are so intense.`
          }
        ]
      }
    ]
  },

  // -------------------------------------------------------------------------
  // BITCOIN ECOSYSTEM
  // -------------------------------------------------------------------------
  {
    title: "Bitcoin Protocol Fundamentals",
    description: "Master the original cryptocurrency protocol. Understand UTXOs, Script, mining, and the economic principles that make Bitcoin work.",
    thumbnail: "https://images.unsplash.com/photo-1516245834210-c4c142787335?w=800",
    categorySlug: "bitcoin",
    chapters: [
      {
        title: "Bitcoin Architecture",
        description: "Core protocol design",
        lessons: [
          {
            title: "UTXO Model",
            content: `# The UTXO Model

Bitcoin uses UTXOs (Unspent Transaction Outputs), not accounts.

## Accounts vs UTXOs

### Ethereum (Account Model)
\`\`\`
Alice: 10 ETH
Bob: 5 ETH
\`\`\`

### Bitcoin (UTXO Model)
\`\`\`
UTXO 1: 6 BTC (spendable by Alice)
UTXO 2: 4 BTC (spendable by Alice)
UTXO 3: 5 BTC (spendable by Bob)
\`\`\`

## How Transactions Work

\`\`\`
Inputs: UTXOs being spent
Outputs: New UTXOs created

Alice sends 3 BTC to Bob:
  Input: UTXO 1 (6 BTC, Alice's)
  Output 1: 3 BTC (Bob's new UTXO)
  Output 2: 2.999 BTC (Alice's change)
  Fee: 0.001 BTC (to miner)
\`\`\`

## UTXO Structure

\`\`\`
{
  "txid": "abc123...",        // Transaction ID
  "vout": 0,                  // Output index
  "value": 100000000,         // Satoshis (1 BTC)
  "scriptPubKey": {           // Locking script
    "type": "p2wpkh",
    "address": "bc1q..."
  }
}
\`\`\`

## Benefits of UTXOs

1. **Parallelization**: Spend unrelated UTXOs simultaneously
2. **Privacy**: Fresh addresses for each transaction
3. **Simplicity**: No complex state management
4. **Auditability**: Easy to verify total supply

## Drawbacks

1. **Dust**: Small UTXOs uneconomical to spend
2. **Complexity**: Must manage UTXO selection
3. **No smart contracts**: Limited scripting`
          },
          {
            title: "Bitcoin Script",
            content: `# Bitcoin Script

Bitcoin's simple scripting language for transaction validation.

## What is Script?

- Stack-based language
- Not Turing complete (intentionally)
- Runs on every node
- Determines who can spend UTXOs

## How it Works

\`\`\`
scriptPubKey (lock): OP_DUP OP_HASH160 <pubKeyHash> OP_EQUALVERIFY OP_CHECKSIG
scriptSig (unlock): <signature> <publicKey>

Combined and executed:
<sig> <pubKey> OP_DUP OP_HASH160 <pubKeyHash> OP_EQUALVERIFY OP_CHECKSIG
\`\`\`

## Common Script Types

### P2PKH (Pay to Public Key Hash)
\`\`\`
Lock: OP_DUP OP_HASH160 <hash> OP_EQUALVERIFY OP_CHECKSIG
Unlock: <sig> <pubkey>
\`\`\`

### P2SH (Pay to Script Hash)
\`\`\`
Lock: OP_HASH160 <scriptHash> OP_EQUAL
Unlock: <...inputs> <redeemScript>
\`\`\`

### P2WPKH (SegWit)
\`\`\`
Lock: OP_0 <20-byte-key-hash>
Witness: <sig> <pubkey>
\`\`\`

### P2TR (Taproot)
\`\`\`
Lock: OP_1 <32-byte-output-key>
Witness: <signature> or <script> <control-block>
\`\`\`

## Multisig Example

\`\`\`
# 2-of-3 Multisig
Lock:
  OP_2 <pubKey1> <pubKey2> <pubKey3> OP_3 OP_CHECKMULTISIG

Unlock:
  OP_0 <sig1> <sig2>  # OP_0 due to CHECKMULTISIG bug
\`\`\`

## Script Limitations

- No loops
- No state
- 520 byte limit
- Limited opcodes

These limitations are features, not bugs.`
          }
        ]
      },
      {
        title: "Bitcoin Mining",
        description: "Understanding proof of work",
        lessons: [
          {
            title: "Mining Deep Dive",
            content: `# Mining Deep Dive

How Bitcoin mining actually works.

## The Mining Process

1. **Collect transactions** from mempool
2. **Build candidate block** with coinbase transaction
3. **Hash the header** with different nonces
4. **Find valid hash** below difficulty target
5. **Broadcast block** to network
6. **Collect reward** (subsidy + fees)

## Block Header Structure

\`\`\`
Version:           4 bytes
Previous Hash:     32 bytes
Merkle Root:       32 bytes
Timestamp:         4 bytes
Difficulty Target: 4 bytes
Nonce:             4 bytes
--------------------------
Total:             80 bytes
\`\`\`

## Finding a Valid Hash

\`\`\`python
import hashlib

def mine(header, target):
    nonce = 0
    while True:
        header_with_nonce = header + nonce.to_bytes(4, 'little')
        hash = hashlib.sha256(hashlib.sha256(header_with_nonce).digest()).digest()
        
        if int.from_bytes(hash, 'little') < target:
            return nonce
        nonce += 1
\`\`\`

## Difficulty Adjustment

Every 2016 blocks (~2 weeks):

\`\`\`
new_difficulty = old_difficulty * (2 weeks / actual_time)
\`\`\`

Capped at 4x increase or 0.25x decrease.

## Mining Pools

Solo mining is lottery-like. Pools:
- Combine hash power
- Share rewards proportionally
- Reduce variance

Pool protocols:
- **Stratum**: Most common
- **Stratum V2**: Decentralized block templates

## Economics

\`\`\`
Block Reward = Subsidy + Fees

2024: 3.125 BTC subsidy
Hash rate: ~500 EH/s
Power: ~150 TWh/year
\`\`\``
          }
        ]
      }
    ]
  },

  {
    title: "Lightning Network Development",
    description: "Build on Bitcoin's Layer 2 payment network. Master payment channels, HTLCs, invoices, and building Lightning applications.",
    thumbnail: "https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?w=800",
    categorySlug: "bitcoin",
    chapters: [
      {
        title: "Lightning Fundamentals",
        description: "How Lightning works",
        lessons: [
          {
            title: "Payment Channels",
            content: `# Payment Channels

Lightning enables instant Bitcoin payments through payment channels.

## The Problem

Bitcoin mainnet:
- ~7 transactions per second
- 10+ minute confirmations
- Fees can spike during congestion

## The Solution: Payment Channels

Two parties lock funds in a 2-of-2 multisig:

\`\`\`
Funding Transaction (on-chain):
  Input: Alice 0.5 BTC, Bob 0.5 BTC
  Output: 1 BTC to 2-of-2 multisig

Channel State:
  Alice: 0.5 BTC
  Bob: 0.5 BTC
\`\`\`

## Updating Channel State

\`\`\`
State 1: Alice 0.5, Bob 0.5
State 2: Alice 0.4, Bob 0.6  (Alice pays Bob 0.1)
State 3: Alice 0.3, Bob 0.7  (Alice pays Bob 0.1)
\`\`\`

Each state is a pre-signed transaction.
Only the latest state is valid.

## Commitment Transactions

\`\`\`
Alice's Commitment TX:
  To Bob: 0.7 BTC (immediately)
  To Alice: 0.3 BTC (after timelock OR Bob's revocation key)
  
Bob's Commitment TX:
  To Alice: 0.3 BTC (immediately)
  To Bob: 0.7 BTC (after timelock OR Alice's revocation key)
\`\`\`

## Closing a Channel

### Cooperative Close
Both sign final state, broadcast immediately.

### Unilateral Close
One party broadcasts commitment TX.
Funds available after timelock.

### Breach (Cheating Attempt)
If old state broadcast, other party takes ALL funds using revocation key.`
          },
          {
            title: "HTLCs and Routing",
            content: `# HTLCs and Routing

How payments route through multiple channels.

## The Problem

Alice wants to pay Carol, but has no direct channel:

\`\`\`
Alice ←→ Bob ←→ Carol
\`\`\`

## HTLCs (Hash Time-Locked Contracts)

\`\`\`
if (hash(preimage) == H && signed_by_recipient) {
  // Recipient can claim
} else if (timeout_reached && signed_by_sender) {
  // Sender can reclaim
}
\`\`\`

## Multi-Hop Payment

\`\`\`
1. Carol generates secret R, shares H=hash(R)
2. Alice creates HTLC: "Bob gets 1 BTC if provides preimage of H"
3. Bob creates HTLC: "Carol gets 1 BTC if provides preimage of H"
4. Carol reveals R to claim from Bob
5. Bob uses R to claim from Alice
6. Payment complete!
\`\`\`

## Onion Routing

Payments are onion-encrypted:
- Each node only knows previous and next hop
- Final destination hidden
- Privacy preserved

\`\`\`
Alice sees: [encrypted_for_bob]
Bob sees: [encrypted_for_carol]
Carol sees: payment details
\`\`\`

## Pathfinding

Finding routes considers:
- Channel capacity
- Fee rates
- Reliability history
- Number of hops

Popular algorithms:
- Dijkstra's (shortest path)
- Trampoline (delegated routing)`
          }
        ]
      },
      {
        title: "Building Lightning Apps",
        description: "Practical Lightning development",
        lessons: [
          {
            title: "LND Integration",
            content: `# LND Integration

Build applications with LND (Lightning Network Daemon).

## Setup

\`\`\`bash
# Install LND
git clone https://github.com/lightningnetwork/lnd
cd lnd
make install

# Start LND
lnd --bitcoin.active --bitcoin.mainnet --bitcoin.node=bitcoind
\`\`\`

## REST API

\`\`\`javascript
const axios = require('axios');
const fs = require('fs');

const macaroon = fs.readFileSync('~/.lnd/data/chain/bitcoin/mainnet/admin.macaroon').toString('hex');

const lnd = axios.create({
  baseURL: 'https://localhost:8080',
  headers: { 'Grpc-Metadata-macaroon': macaroon }
});

// Get node info
const info = await lnd.get('/v1/getinfo');

// Create invoice
const invoice = await lnd.post('/v1/invoices', {
  value: 1000, // satoshis
  memo: 'Test payment'
});
console.log(invoice.data.payment_request); // BOLT11 invoice
\`\`\`

## gRPC API

\`\`\`javascript
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageDefinition = protoLoader.loadSync('lightning.proto');
const lnrpc = grpc.loadPackageDefinition(packageDefinition).lnrpc;

const client = new lnrpc.Lightning('localhost:10009', credentials);

// Subscribe to invoices
const call = client.subscribeInvoices({});
call.on('data', (invoice) => {
  if (invoice.settled) {
    console.log('Payment received!', invoice.value);
  }
});
\`\`\`

## LNURL

User-friendly Lightning protocols:

\`\`\`javascript
// LNURL-pay endpoint
app.get('/.well-known/lnurlp/:username', (req, res) => {
  res.json({
    callback: \`https://example.com/pay/\${req.params.username}\`,
    maxSendable: 100000000,
    minSendable: 1000,
    metadata: JSON.stringify([["text/plain", "Payment to " + req.params.username]]),
    tag: "payRequest"
  });
});
\`\`\`

## WebLN

Browser extension integration:

\`\`\`javascript
if (window.webln) {
  await window.webln.enable();
  
  // Request payment
  const result = await window.webln.sendPayment(bolt11Invoice);
  
  // Or create invoice
  const { paymentRequest } = await window.webln.makeInvoice({
    amount: 1000,
    defaultMemo: 'Test'
  });
}
\`\`\``
          }
        ]
      }
    ]
  },

  {
    title: "Ordinals & Inscriptions",
    description: "Create and trade Bitcoin NFTs with Ordinals. Understand inscription mechanics, recursive inscriptions, and the Ordinals ecosystem.",
    thumbnail: "https://images.unsplash.com/photo-1569025690938-a00729c9e1f9?w=800",
    categorySlug: "bitcoin",
    chapters: [
      {
        title: "Ordinals Theory",
        description: "Understanding ordinal numbering",
        lessons: [
          {
            title: "What are Ordinals?",
            content: `# What are Ordinals?

Ordinals assign unique identifiers to every satoshi (0.00000001 BTC).

## The Ordinal Numbering Scheme

Each satoshi has a serial number based on when it was mined:

\`\`\`
Block 0: sats 0 - 5,000,000,000
Block 1: sats 5,000,000,001 - 10,000,000,000
...and so on
\`\`\`

## Rarity Tiers

Based on Bitcoin's halving cycles:

| Rarity | Supply | Description |
|--------|--------|-------------|
| Common | 2.1 quadrillion | Any sat |
| Uncommon | 6,929,999 | First sat of each block |
| Rare | 3,437 | First sat of difficulty adjustment |
| Epic | 32 | First sat of each halving |
| Legendary | 5 | First sat of each cycle |
| Mythic | 1 | First sat ever (sat 0) |

## Tracking Satoshis

Ordinals use "first-in-first-out" (FIFO):

\`\`\`
Transaction Inputs:
  UTXO A: sats [100, 101, 102]
  UTXO B: sats [200, 201]

Transaction Outputs:
  Output 1 (3 sats): [100, 101, 102]
  Output 2 (2 sats): [200, 201]
\`\`\`

## Inscriptions

Data permanently attached to a satoshi:

\`\`\`
Inscription = specific sat + arbitrary content
\`\`\`

Content types:
- Images (PNG, JPEG, GIF, WebP)
- Text
- HTML
- Audio/Video
- Code`
          },
          {
            title: "Creating Inscriptions",
            content: `# Creating Inscriptions

How to inscribe data onto Bitcoin.

## How Inscriptions Work

Data stored in taproot script-path spend:

\`\`\`
OP_FALSE
OP_IF
  OP_PUSH "ord"
  OP_PUSH 1  # content-type tag
  OP_PUSH "image/png"
  OP_PUSH 0  # end of tags
  OP_PUSH <image data chunk 1>
  OP_PUSH <image data chunk 2>
  ...
OP_ENDIF
\`\`\`

## Two-Phase Inscription

### Phase 1: Commit
Create taproot output with inscription script:
\`\`\`
{
  "txid": "abc...",
  "vout": 0,
  "value": 10000,
  "script": P2TR(internal_key, inscription_script)
}
\`\`\`

### Phase 2: Reveal
Spend the commit output, revealing inscription:
\`\`\`
{
  "inputs": [{"txid": "abc...", "vout": 0}],
  "witness": [signature, inscription_script, control_block]
}
\`\`\`

## Using ord CLI

\`\`\`bash
# Install ord
cargo install --git https://github.com/ordinals/ord

# Create wallet
ord wallet create

# Fund wallet
ord wallet receive

# Inscribe
ord wallet inscribe --fee-rate 10 image.png

# View inscription
ord wallet inscriptions
\`\`\`

## Inscribing with JavaScript

\`\`\`javascript
import * as bitcoin from 'bitcoinjs-lib';

function createInscription(content, contentType) {
  const inscriptionScript = bitcoin.script.compile([
    bitcoin.opcodes.OP_FALSE,
    bitcoin.opcodes.OP_IF,
    Buffer.from('ord'),
    0x01, // content-type tag
    Buffer.from(contentType),
    0x00, // end tags
    content,
    bitcoin.opcodes.OP_ENDIF
  ]);
  
  return inscriptionScript;
}
\`\`\`

## Costs

Inscription cost = (data size in vbytes) × (fee rate)

Example:
- 100KB image at 20 sat/vB
- ~25,000 vbytes
- 500,000 sats (~$200 at $40K BTC)`
          }
        ]
      }
    ]
  },

  {
    title: "BRC-20 Tokens",
    description: "Create fungible tokens on Bitcoin using the BRC-20 standard. Understand deploy, mint, and transfer operations.",
    thumbnail: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800",
    categorySlug: "bitcoin",
    chapters: [
      {
        title: "BRC-20 Mechanics",
        description: "How BRC-20 tokens work",
        lessons: [
          {
            title: "BRC-20 Overview",
            content: `# BRC-20 Overview

BRC-20 is an experimental fungible token standard on Bitcoin.

## How It Works

BRC-20 uses JSON inscriptions to track token operations:

\`\`\`json
// Deploy new token
{
  "p": "brc-20",
  "op": "deploy",
  "tick": "ordi",
  "max": "21000000",
  "lim": "1000"
}
\`\`\`

## Key Differences from ERC-20

| Aspect | ERC-20 | BRC-20 |
|--------|--------|--------|
| Smart Contract | Yes | No |
| On-chain Logic | Yes | No (indexer required) |
| Composability | High | None |
| Finality | Instant | Needs indexer consensus |

## Operations

### Deploy
\`\`\`json
{
  "p": "brc-20",
  "op": "deploy",
  "tick": "MYTOKEN",
  "max": "1000000",     // Maximum supply
  "lim": "100",         // Mint limit per inscription
  "dec": "8"            // Decimals (optional, default 18)
}
\`\`\`

### Mint
\`\`\`json
{
  "p": "brc-20",
  "op": "mint",
  "tick": "MYTOKEN",
  "amt": "100"
}
\`\`\`

### Transfer
Two-step process:
\`\`\`json
// Step 1: Inscribe transfer
{
  "p": "brc-20",
  "op": "transfer",
  "tick": "MYTOKEN",
  "amt": "50"
}

// Step 2: Send the inscription to recipient
\`\`\`

## Indexers

Since Bitcoin doesn't execute logic, indexers track balances:

- **OrdScan**
- **Hiro Ordinals API**
- **BestInSlot**

Different indexers may have different balances during reorgs!`
          },
          {
            title: "Building BRC-20 Applications",
            content: `# Building BRC-20 Applications

Integrate BRC-20 tokens into your applications.

## Querying Balances

\`\`\`javascript
// Using Hiro Ordinals API
async function getBRC20Balance(address, ticker) {
  const response = await fetch(
    \`https://api.hiro.so/ordinals/v1/brc-20/balances/\${address}?ticker=\${ticker}\`
  );
  const data = await response.json();
  return data.results[0]?.overall_balance || "0";
}
\`\`\`

## Creating Transfer Inscriptions

\`\`\`javascript
const transferInscription = {
  p: "brc-20",
  op: "transfer",
  tick: "ordi",
  amt: "100"
};

const content = JSON.stringify(transferInscription);

// Inscribe this content, then send the resulting
// inscription UTXO to the recipient
\`\`\`

## Marketplace Integration

\`\`\`javascript
// List token for sale
async function listForSale(inscriptionId, price) {
  // Create PSBT with inscription input
  const psbt = new bitcoin.Psbt({ network });
  
  psbt.addInput({
    hash: inscriptionId.split('i')[0],
    index: parseInt(inscriptionId.split('i')[1]),
    witnessUtxo: { ... }
  });
  
  // Seller's signature (SIGHASH_SINGLE | ANYONECANPAY)
  psbt.signInput(0, sellerKeyPair, [
    bitcoin.Transaction.SIGHASH_SINGLE | 
    bitcoin.Transaction.SIGHASH_ANYONECANPAY
  ]);
  
  // Buyer completes PSBT with payment
  return psbt.toBase64();
}
\`\`\`

## Runes (The Successor)

Casey Rodarmor (Ordinals creator) designed Runes as a better fungible token protocol:

- Native to Bitcoin (not JSON hacks)
- Uses OP_RETURN
- More efficient
- Launched April 2024 at halving

\`\`\`
OP_RETURN
RUNE_MAGIC
<varint: rune ID>
<varint: amount>
<varint: output index>
\`\`\``
          }
        ]
      }
    ]
  },

  {
    title: "Stacks & Clarity",
    description: "Build smart contracts on Bitcoin with Stacks. Learn Clarity, the decidable smart contract language, and connect to Bitcoin's security.",
    thumbnail: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800",
    categorySlug: "bitcoin",
    chapters: [
      {
        title: "Clarity Programming",
        description: "The decidable smart contract language",
        lessons: [
          {
            title: "Clarity Fundamentals",
            content: `# Clarity Fundamentals

Clarity is Stacks' smart contract language - designed to be secure and predictable.

## Why Clarity?

- **Decidable**: You can always tell what code will do
- **No compiler**: Interpreted, what you see is what runs
- **No reentrancy**: By design
- **Bitcoin aware**: Can read Bitcoin state

## Basic Syntax

\`\`\`clarity
;; Define a constant
(define-constant CONTRACT_OWNER tx-sender)

;; Define a data variable
(define-data-var counter uint u0)

;; Define a public function
(define-public (increment)
  (begin
    (var-set counter (+ (var-get counter) u1))
    (ok (var-get counter))
  )
)

;; Define a read-only function
(define-read-only (get-counter)
  (var-get counter)
)
\`\`\`

## Types

\`\`\`clarity
;; Primitives
(define-constant MY_INT 42)           ;; int
(define-constant MY_UINT u42)         ;; uint (unsigned)
(define-constant MY_BOOL true)        ;; bool
(define-constant MY_STRING "hello")   ;; string-ascii/string-utf8
(define-constant MY_PRINCIPAL 'ST1...)  ;; principal (address)

;; Complex
(define-constant MY_TUPLE { name: "alice", age: u30 })
(define-constant MY_LIST (list u1 u2 u3))
(define-constant MY_OPTIONAL (some u42))  ;; or none
(define-constant MY_RESPONSE (ok u42))    ;; or (err u1)
\`\`\`

## Maps

\`\`\`clarity
(define-map balances principal uint)

;; Set
(map-set balances tx-sender u1000)

;; Get
(map-get? balances tx-sender)  ;; Returns (some u1000) or none

;; Delete
(map-delete balances tx-sender)
\`\`\`

## Control Flow

\`\`\`clarity
;; If
(if (> amount u0)
    (ok "positive")
    (err "zero or negative")
)

;; Match
(match (map-get? balances user)
    balance (ok balance)  ;; if some
    (err u404)            ;; if none
)
\`\`\``
          },
          {
            title: "Building Stacks dApps",
            content: `# Building Stacks dApps

Connect frontends to Stacks smart contracts.

## Development Setup

\`\`\`bash
# Install Clarinet
brew install clarinet

# Create project
clarinet new my-project
cd my-project

# Create contract
clarinet contract new counter
\`\`\`

## Simple Token Contract

\`\`\`clarity
;; contracts/token.clar
(define-fungible-token my-token)

(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u401))

(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (ft-mint? my-token amount recipient)
  )
)

(define-public (transfer (amount uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) ERR_UNAUTHORIZED)
    (ft-transfer? my-token amount sender recipient)
  )
)

(define-read-only (get-balance (account principal))
  (ft-get-balance my-token account)
)
\`\`\`

## Frontend Integration

\`\`\`javascript
import { openContractCall } from '@stacks/connect';
import { StacksMainnet } from '@stacks/network';
import { uintCV, principalCV } from '@stacks/transactions';

async function transfer(amount, recipient) {
  await openContractCall({
    network: new StacksMainnet(),
    contractAddress: 'ST1...',
    contractName: 'token',
    functionName: 'transfer',
    functionArgs: [
      uintCV(amount),
      principalCV(senderAddress),
      principalCV(recipient)
    ],
    onFinish: (data) => {
      console.log('Transaction:', data.txId);
    }
  });
}
\`\`\`

## Reading Contract State

\`\`\`javascript
import { callReadOnlyFunction, cvToValue } from '@stacks/transactions';

async function getBalance(address) {
  const result = await callReadOnlyFunction({
    network: new StacksMainnet(),
    contractAddress: 'ST1...',
    contractName: 'token',
    functionName: 'get-balance',
    functionArgs: [principalCV(address)],
    senderAddress: address
  });
  
  return cvToValue(result);
}
\`\`\`

## sBTC (Coming Soon)

Trustless BTC on Stacks:
- Decentralized peg
- 1:1 backed by BTC
- Full DeFi composability`
          }
        ]
      }
    ]
  },

  // -------------------------------------------------------------------------
  // COSMOS ECOSYSTEM
  // -------------------------------------------------------------------------
  {
    title: "Cosmos SDK Fundamentals",
    description: "Build sovereign blockchains with the Cosmos SDK. Master modules, keepers, and the ABCI interface to create application-specific chains.",
    thumbnail: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800",
    categorySlug: "cosmos",
    chapters: [
      {
        title: "SDK Architecture",
        description: "Understanding Cosmos SDK design",
        lessons: [
          {
            title: "Cosmos SDK Overview",
            content: `# Cosmos SDK Overview

The Cosmos SDK is a framework for building application-specific blockchains.

## The Vision

Instead of one chain for everything, Cosmos envisions:
- **Sovereign chains** for each application
- **Interoperability** via IBC
- **Shared security** options

## Architecture

\`\`\`
┌─────────────────────────────────────────┐
│              Application                │
│  ┌───────┐ ┌───────┐ ┌───────┐         │
│  │ Bank  │ │ Staking│ │ Custom │ ...   │
│  │Module │ │Module │ │Module │         │
│  └───────┘ └───────┘ └───────┘         │
├─────────────────────────────────────────┤
│              Cosmos SDK                  │
│         (BaseApp, Multistore)           │
├─────────────────────────────────────────┤
│              Tendermint                 │
│      (Consensus & Networking)           │
└─────────────────────────────────────────┘
\`\`\`

## Core Concepts

### Modules
Self-contained units of functionality:
- **auth**: Account management
- **bank**: Token transfers
- **staking**: Validator operations
- **gov**: On-chain governance

### Keepers
Module APIs for state access:
\`\`\`go
type BankKeeper interface {
    SendCoins(ctx sdk.Context, from, to sdk.AccAddress, amt sdk.Coins) error
    GetBalance(ctx sdk.Context, addr sdk.AccAddress, denom string) sdk.Coin
}
\`\`\`

### Messages
User intents that trigger state changes:
\`\`\`go
type MsgSend struct {
    FromAddress string
    ToAddress   string
    Amount      sdk.Coins
}
\`\`\`

### Queries
Read-only state access:
\`\`\`go
type QueryBalanceRequest struct {
    Address string
    Denom   string
}
\`\`\`

## ABCI Interface

Application Blockchain Interface connects consensus (Tendermint) to application (SDK):

\`\`\`
CheckTx:    Validate transaction
DeliverTx:  Execute transaction  
Commit:     Persist state changes
Query:      Read state
\`\`\``
          },
          {
            title: "Building a Module",
            content: `# Building a Module

Create custom functionality for your Cosmos chain.

## Module Structure

\`\`\`
x/mymodule/
├── keeper/
│   ├── keeper.go      # State management
│   ├── msg_server.go  # Message handlers
│   └── query.go       # Query handlers
├── types/
│   ├── keys.go        # Store keys
│   ├── msgs.go        # Message definitions
│   └── genesis.go     # Genesis state
├── module.go          # Module registration
└── genesis.go         # Init/Export genesis
\`\`\`

## Define Messages

\`\`\`go
// x/mymodule/types/msgs.go
package types

type MsgCreatePost struct {
    Creator string
    Title   string
    Content string
}

func (msg *MsgCreatePost) ValidateBasic() error {
    if msg.Creator == "" {
        return errors.New("creator cannot be empty")
    }
    if msg.Title == "" {
        return errors.New("title cannot be empty")
    }
    return nil
}
\`\`\`

## Implement Keeper

\`\`\`go
// x/mymodule/keeper/keeper.go
package keeper

type Keeper struct {
    storeKey storetypes.StoreKey
    cdc      codec.BinaryCodec
}

func (k Keeper) CreatePost(ctx sdk.Context, post types.Post) {
    store := ctx.KVStore(k.storeKey)
    key := types.PostKey(post.Id)
    value := k.cdc.MustMarshal(&post)
    store.Set(key, value)
}

func (k Keeper) GetPost(ctx sdk.Context, id uint64) (types.Post, bool) {
    store := ctx.KVStore(k.storeKey)
    key := types.PostKey(id)
    bz := store.Get(key)
    if bz == nil {
        return types.Post{}, false
    }
    var post types.Post
    k.cdc.MustUnmarshal(bz, &post)
    return post, true
}
\`\`\`

## Message Handler

\`\`\`go
// x/mymodule/keeper/msg_server.go
func (k msgServer) CreatePost(
    goCtx context.Context,
    msg *types.MsgCreatePost,
) (*types.MsgCreatePostResponse, error) {
    ctx := sdk.UnwrapSDKContext(goCtx)
    
    post := types.Post{
        Id:      k.GetNextId(ctx),
        Creator: msg.Creator,
        Title:   msg.Title,
        Content: msg.Content,
    }
    
    k.CreatePost(ctx, post)
    
    ctx.EventManager().EmitEvent(
        sdk.NewEvent("post_created",
            sdk.NewAttribute("id", fmt.Sprint(post.Id)),
            sdk.NewAttribute("creator", post.Creator),
        ),
    )
    
    return &types.MsgCreatePostResponse{Id: post.Id}, nil
}
\`\`\``
          }
        ]
      }
    ]
  },

  {
    title: "IBC Protocol",
    description: "Master inter-blockchain communication. Learn how IBC enables secure cross-chain messaging between Cosmos chains and beyond.",
    thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800",
    categorySlug: "cosmos",
    chapters: [
      {
        title: "IBC Fundamentals",
        description: "How cross-chain communication works",
        lessons: [
          {
            title: "IBC Architecture",
            content: `# IBC Architecture

Inter-Blockchain Communication (IBC) enables trustless cross-chain messaging.

## Why IBC?

- No trusted bridges (unlike most cross-chain solutions)
- Chains verify each other's state via light clients
- Generalized messaging (not just token transfers)
- Composable applications

## Core Components

### Light Clients
Verify counterparty chain state:
\`\`\`
Chain A runs light client of Chain B
Chain B runs light client of Chain A
Both can verify each other's state transitions
\`\`\`

### Connections
Authenticated communication channels between chains:
\`\`\`
Connection = (client_id, client_id)
One connection per chain pair
\`\`\`

### Channels
Application-level communication:
\`\`\`
Channel = (port, channel_id)
Each application has its own port
Multiple channels per connection
\`\`\`

## Packet Lifecycle

\`\`\`
1. SendPacket (Chain A)
   ├── Application creates packet
   └── Packet committed to state

2. RecvPacket (Chain B)
   ├── Relayer submits packet + proof
   ├── Light client verifies proof
   └── Application processes packet

3. Acknowledgement (Chain A)
   ├── Relayer submits ack + proof
   └── Application handles result

4. Timeout (if needed)
   └── Packet refunded if not received
\`\`\`

## Token Transfers (ICS-20)

\`\`\`
Original token: uatom
Send A→B: transfer/channel-0/uatom (IBC denom on B)
Send B→C: transfer/channel-5/transfer/channel-0/uatom
Send back: Original denom returned
\`\`\``
          },
          {
            title: "Implementing IBC",
            content: `# Implementing IBC

Add cross-chain functionality to your module.

## IBC Module Interface

\`\`\`go
type IBCModule interface {
    OnChanOpenInit(ctx, order, connectionHops, portID, channelID, ...)
    OnChanOpenTry(ctx, order, connectionHops, portID, channelID, ...)
    OnChanOpenAck(ctx, portID, channelID, ...)
    OnChanOpenConfirm(ctx, portID, channelID)
    OnChanCloseInit(ctx, portID, channelID)
    OnChanCloseConfirm(ctx, portID, channelID)
    OnRecvPacket(ctx, packet, relayer) 
    OnAcknowledgementPacket(ctx, packet, ack, relayer)
    OnTimeoutPacket(ctx, packet, relayer)
}
\`\`\`

## Define Packet Data

\`\`\`go
type MyPacketData struct {
    Sender    string
    Recipient string
    Amount    sdk.Coins
    Memo      string
}
\`\`\`

## Send Packet

\`\`\`go
func (k Keeper) SendMyPacket(
    ctx sdk.Context,
    sourcePort string,
    sourceChannel string,
    data MyPacketData,
) error {
    // Serialize packet data
    packetBytes := k.cdc.MustMarshal(&data)
    
    // Create packet
    packet := channeltypes.NewPacket(
        packetBytes,
        sequence,
        sourcePort,
        sourceChannel,
        destinationPort,
        destinationChannel,
        timeoutHeight,
        timeoutTimestamp,
    )
    
    // Send via IBC
    return k.channelKeeper.SendPacket(ctx, packet)
}
\`\`\`

## Receive Packet

\`\`\`go
func (im IBCModule) OnRecvPacket(
    ctx sdk.Context,
    packet channeltypes.Packet,
    relayer sdk.AccAddress,
) exported.Acknowledgement {
    var data MyPacketData
    if err := k.cdc.Unmarshal(packet.GetData(), &data); err != nil {
        return channeltypes.NewErrorAcknowledgement(err)
    }
    
    // Process the packet
    if err := im.keeper.ProcessPacket(ctx, data); err != nil {
        return channeltypes.NewErrorAcknowledgement(err)
    }
    
    return channeltypes.NewResultAcknowledgement([]byte{1})
}
\`\`\`

## Running Relayers

\`\`\`bash
# Hermes relayer
hermes create channel --a-chain cosmoshub-4 --b-chain osmosis-1

# Start relaying
hermes start
\`\`\``
          }
        ]
      }
    ]
  },

  {
    title: "CosmWasm Smart Contracts",
    description: "Write WebAssembly smart contracts for Cosmos chains. Learn Rust-based contract development with CosmWasm.",
    thumbnail: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800",
    categorySlug: "cosmos",
    chapters: [
      {
        title: "CosmWasm Development",
        description: "Building contracts with Rust",
        lessons: [
          {
            title: "CosmWasm Basics",
            content: `# CosmWasm Basics

CosmWasm lets you write smart contracts in Rust that compile to WebAssembly.

## Why CosmWasm?

- **Rust**: Memory-safe, performant
- **Multi-chain**: Deploy on any CosmWasm chain
- **Secure**: Actor model prevents reentrancy
- **IBC-native**: Cross-chain contracts

## Contract Structure

\`\`\`rust
use cosmwasm_std::{
    entry_point, Binary, Deps, DepsMut, Env, 
    MessageInfo, Response, StdResult
};

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    // Initialize contract state
    Ok(Response::new())
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> StdResult<Response> {
    // Handle messages
    match msg {
        ExecuteMsg::Increment {} => execute_increment(deps),
        ExecuteMsg::Reset { count } => execute_reset(deps, count),
    }
}

#[entry_point]
pub fn query(
    deps: Deps,
    env: Env,
    msg: QueryMsg,
) -> StdResult<Binary> {
    // Handle queries
    match msg {
        QueryMsg::GetCount {} => query_count(deps),
    }
}
\`\`\`

## State Management

\`\`\`rust
use cw_storage_plus::{Item, Map};

pub const COUNT: Item<u64> = Item::new("count");
pub const BALANCES: Map<&Addr, u64> = Map::new("balances");

// Save
COUNT.save(deps.storage, &42)?;
BALANCES.save(deps.storage, &addr, &100)?;

// Load
let count = COUNT.load(deps.storage)?;
let balance = BALANCES.may_load(deps.storage, &addr)?;

// Update
COUNT.update(deps.storage, |c| Ok(c + 1))?;
\`\`\`

## Messages

\`\`\`rust
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct InstantiateMsg {
    pub initial_count: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    Increment {},
    Reset { count: u64 },
    Transfer { to: String, amount: u64 },
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    GetCount {},
    GetBalance { address: String },
}
\`\`\``
          },
          {
            title: "Advanced CosmWasm",
            content: `# Advanced CosmWasm

Production patterns for CosmWasm contracts.

## CW20 Token Contract

\`\`\`rust
use cw20_base::contract::{execute, instantiate, query};
use cw20_base::msg::{ExecuteMsg, InstantiateMsg, QueryMsg};

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    cw20_base::contract::instantiate(deps, env, info, msg)
}
\`\`\`

## Cross-Contract Calls

\`\`\`rust
use cosmwasm_std::{WasmMsg, to_binary};

fn call_other_contract(
    deps: DepsMut,
    contract_addr: String,
    amount: u64,
) -> StdResult<Response> {
    let msg = WasmMsg::Execute {
        contract_addr,
        msg: to_binary(&OtherContractMsg::DoSomething { amount })?,
        funds: vec![],
    };
    
    Ok(Response::new().add_message(msg))
}
\`\`\`

## Submessages & Replies

\`\`\`rust
const INSTANTIATE_REPLY_ID: u64 = 1;

fn create_sub_contract(deps: DepsMut) -> StdResult<Response> {
    let msg = WasmMsg::Instantiate {
        admin: None,
        code_id: 123,
        msg: to_binary(&SubContractMsg {})?,
        funds: vec![],
        label: "sub-contract".to_string(),
    };
    
    let submsg = SubMsg::reply_on_success(msg, INSTANTIATE_REPLY_ID);
    
    Ok(Response::new().add_submessage(submsg))
}

#[entry_point]
pub fn reply(deps: DepsMut, _env: Env, msg: Reply) -> StdResult<Response> {
    match msg.id {
        INSTANTIATE_REPLY_ID => {
            let res = parse_reply_instantiate_data(msg)?;
            let addr = deps.api.addr_validate(&res.contract_address)?;
            SUB_CONTRACT.save(deps.storage, &addr)?;
            Ok(Response::new())
        }
        _ => Err(StdError::generic_err("unknown reply id"))
    }
}
\`\`\`

## IBC Enabled Contracts

\`\`\`rust
#[entry_point]
pub fn ibc_channel_open(
    deps: DepsMut,
    env: Env,
    msg: IbcChannelOpenMsg,
) -> StdResult<IbcChannelOpenResponse> {
    // Validate channel parameters
    Ok(None)
}

#[entry_point]
pub fn ibc_packet_receive(
    deps: DepsMut,
    env: Env,
    msg: IbcPacketReceiveMsg,
) -> StdResult<IbcReceiveResponse> {
    // Process incoming packet
    let packet: MyPacket = from_binary(&msg.packet.data)?;
    // Handle packet...
    Ok(IbcReceiveResponse::new()
        .set_ack(to_binary(&Ack::Success)?))
}
\`\`\``
          }
        ]
      }
    ]
  },

  // -------------------------------------------------------------------------
  // ALTERNATIVE L1s
  // -------------------------------------------------------------------------
  {
    title: "Avalanche Development",
    description: "Build on Avalanche's high-performance network. Master C-Chain development, Subnet creation, and cross-chain messaging with Teleporter.",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
    categorySlug: "alternative-l1",
    chapters: [
      {
        title: "Avalanche Fundamentals",
        description: "Understanding Avalanche's architecture",
        lessons: [
          {
            title: "Avalanche Architecture",
            content: `# Avalanche Architecture

Avalanche uses a unique multi-chain architecture with breakthrough consensus.

## The Three Chains

### X-Chain (Exchange)
- Asset creation and trading
- Uses Avalanche consensus
- DAG-based (not linear blocks)

### C-Chain (Contract)
- EVM-compatible smart contracts
- Uses Snowman consensus
- What most developers use

### P-Chain (Platform)
- Validator coordination
- Subnet management
- Staking operations

## Avalanche Consensus

Unlike BFT or Nakamoto consensus, Avalanche uses **repeated random sampling**:

\`\`\`
1. Node receives transaction
2. Query random subset of validators
3. If supermajority agree, adopt their view
4. Repeat until confidence threshold
5. Finalize transaction
\`\`\`

Benefits:
- Sub-second finality
- Thousands of validators
- No leader election

## Network Stats

| Metric | Value |
|--------|-------|
| Time to Finality | ~1 second |
| TPS | 4,500+ |
| Validators | 1,600+ |
| Energy per tx | ~0.0005 kWh |

## Subnets

Custom blockchain networks on Avalanche:
- Own validators
- Custom VMs (EVM, custom)
- Own tokenomics
- Horizontal scaling

Examples:
- DFK Chain (DeFi Kingdoms)
- Swimmer Network (Crabada)
- BEAM (gaming)`
          },
          {
            title: "C-Chain Development",
            content: `# C-Chain Development

Build EVM smart contracts on Avalanche.

## Network Configuration

\`\`\`javascript
// hardhat.config.js
module.exports = {
  networks: {
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: [process.env.PRIVATE_KEY]
    },
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
\`\`\`

## Key Differences

### Native Token
Use AVAX instead of ETH:
\`\`\`solidity
// Send AVAX
payable(recipient).transfer(amount);

// Check AVAX balance
address(this).balance
\`\`\`

### Precompiles
Avalanche has special precompiled contracts:
\`\`\`solidity
// Native Minting (for Subnets)
interface INativeMinter {
    function mintNativeCoin(address addr, uint256 amount) external;
}

// Fee Config Manager
interface IFeeConfigManager {
    function setFeeConfig(...) external;
}

// Warp Messaging (Teleporter)
interface IWarpMessenger {
    function sendWarpMessage(bytes calldata payload) external;
}
\`\`\`

## Avalanche-Specific Features

### Atomic Transactions
Move assets between chains:
\`\`\`javascript
import { Avalanche } from "avalanche";

const ava = new Avalanche("api.avax.network", 443);
const xchain = ava.XChain();
const cchain = ava.CChain();

// Export from X-Chain
const exportTx = await xchain.buildExportTx(...);

// Import to C-Chain
const importTx = await cchain.buildImportTx(...);
\`\`\`

### Teleporter (Cross-Subnet)
\`\`\`solidity
import "@teleporter/ITeleporterMessenger.sol";

contract CrossChainSender {
    ITeleporterMessenger teleporter = 
        ITeleporterMessenger(0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf);
    
    function sendMessage(
        bytes32 destinationChainID,
        address recipient,
        bytes calldata message
    ) external {
        teleporter.sendCrossChainMessage(
            TeleporterMessageInput({
                destinationChainID: destinationChainID,
                destinationAddress: recipient,
                feeInfo: TeleporterFeeInfo(address(0), 0),
                requiredGasLimit: 100000,
                allowedRelayerAddresses: new address[](0),
                message: message
            })
        );
    }
}
\`\`\``
          }
        ]
      }
    ]
  },

  {
    title: "NEAR Protocol Development",
    description: "Build on NEAR with JavaScript or Rust. Learn about sharding, account abstraction, and NEAR's developer-friendly features.",
    thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800",
    categorySlug: "alternative-l1",
    chapters: [
      {
        title: "NEAR Fundamentals",
        description: "Understanding NEAR's approach",
        lessons: [
          {
            title: "NEAR Architecture",
            content: `# NEAR Architecture

NEAR is a sharded, proof-of-stake blockchain designed for usability.

## Key Features

### Human-Readable Accounts
\`\`\`
alice.near
app.mycompany.near
sub.sub.account.near
\`\`\`

### Native Account Abstraction
- No seed phrases required
- Email/social recovery
- Named accounts for all

### Sharding (Nightshade)
- Dynamic resharding
- ~100 shards planned
- Linear scaling with validators

## Account Model

NEAR accounts can hold:
- NEAR tokens
- Access keys
- Contract code
- State data

\`\`\`
Account: alice.near
├── Balance: 100 NEAR
├── Full Access Keys: [ed25519:ABC...]
├── Function Access Keys: [ed25519:DEF... → app.near]
└── Contract: (optional wasm code)
\`\`\`

## Access Keys

### Full Access
Can do anything with the account:
- Deploy contracts
- Delete account
- Add/remove keys

### Function Call Access
Limited permissions:
\`\`\`javascript
{
  receiver_id: "app.near",
  method_names: ["vote", "claim"],
  allowance: "0.25"  // NEAR for gas
}
\`\`\`

## Gas Model

- Pay in NEAR (or get sponsored)
- 30% goes to contract developer
- Unused gas refunded
- Storage staking (not rent)`
          },
          {
            title: "NEAR Smart Contracts",
            content: `# NEAR Smart Contracts

Write contracts in Rust or JavaScript (AssemblyScript).

## JavaScript Contract

\`\`\`javascript
import { NearBindgen, near, call, view } from "near-sdk-js";

@NearBindgen({})
class Counter {
  count = 0;

  @view({})
  get_count() {
    return this.count;
  }

  @call({})
  increment() {
    this.count += 1;
    near.log(\`Count: \${this.count}\`);
  }

  @call({})
  decrement() {
    this.count -= 1;
  }
}
\`\`\`

## Rust Contract

\`\`\`rust
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::{near_bindgen, env};

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, Default)]
pub struct Counter {
    count: i32,
}

#[near_bindgen]
impl Counter {
    pub fn get_count(&self) -> i32 {
        self.count
    }

    pub fn increment(&mut self) {
        self.count += 1;
        env::log_str(&format!("Count: {}", self.count));
    }
    
    #[payable]
    pub fn donate(&mut self) {
        let amount = env::attached_deposit();
        env::log_str(&format!("Received {} yoctoNEAR", amount));
    }
}
\`\`\`

## Cross-Contract Calls

\`\`\`rust
use near_sdk::{ext_contract, Promise};

#[ext_contract(ext_ft)]
trait FungibleToken {
    fn ft_transfer(&mut self, receiver_id: String, amount: String);
}

#[near_bindgen]
impl MyContract {
    pub fn send_tokens(&self, token: AccountId, to: AccountId, amount: String) -> Promise {
        ext_ft::ext(token)
            .with_attached_deposit(1)  // 1 yoctoNEAR for security
            .ft_transfer(to.to_string(), amount)
    }
}
\`\`\`

## Frontend Integration

\`\`\`javascript
import { connect, keyStores, WalletConnection } from "near-api-js";

const near = await connect({
  networkId: "mainnet",
  keyStore: new keyStores.BrowserLocalStorageKeyStore(),
  nodeUrl: "https://rpc.mainnet.near.org",
  walletUrl: "https://wallet.near.org",
});

const wallet = new WalletConnection(near);
const contract = new Contract(wallet.account(), "counter.near", {
  viewMethods: ["get_count"],
  changeMethods: ["increment", "decrement"],
});

// Call methods
const count = await contract.get_count();
await contract.increment();
\`\`\``
          }
        ]
      }
    ]
  },

  {
    title: "Move Language & Aptos",
    description: "Learn Move, the safe smart contract language for Aptos and Sui. Master resources, abilities, and Move's unique approach to asset safety.",
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800",
    categorySlug: "alternative-l1",
    chapters: [
      {
        title: "Move Fundamentals",
        description: "The safe smart contract language",
        lessons: [
          {
            title: "Introduction to Move",
            content: `# Introduction to Move

Move was designed for safe digital asset management.

## Why Move?

- **Resource Safety**: Assets can't be copied or lost
- **Type Safety**: Strong compile-time checks  
- **Formal Verification**: Provable correctness
- **Flexibility**: Programmable resources

## Key Concepts

### Resources
First-class assets that must be explicitly handled:
\`\`\`move
struct Coin has key, store {
    value: u64
}

// Can't copy, must move
let coin = Coin { value: 100 };
let other = coin;  // coin is now invalid
\`\`\`

### Abilities
Control what you can do with types:
\`\`\`move
// copy: Can be duplicated
// drop: Can be discarded
// store: Can be stored in global storage
// key: Can be used as global storage key

struct Token has copy, drop, store {
    amount: u64
}

struct NFT has key, store {  // No copy! Unique.
    id: u64,
    uri: String
}
\`\`\`

### Modules
Organize code and define types:
\`\`\`move
module my_address::my_module {
    struct MyResource has key { value: u64 }
    
    public fun create(): MyResource {
        MyResource { value: 0 }
    }
    
    public fun destroy(r: MyResource) {
        let MyResource { value: _ } = r;
    }
}
\`\`\`

## Move vs Solidity

| Aspect | Move | Solidity |
|--------|------|----------|
| Assets | First-class resources | Mappings |
| Safety | Linear types | No built-in |
| Reentrancy | Impossible | Major risk |
| Integers | Checked | Unchecked <0.8 |`
          },
          {
            title: "Aptos Development",
            content: `# Aptos Development

Build on Aptos with Move.

## Setup

\`\`\`bash
# Install Aptos CLI
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3

# Initialize project
aptos init
aptos move init --name my_project
\`\`\`

## Project Structure

\`\`\`
my_project/
├── Move.toml
├── sources/
│   └── my_module.move
└── tests/
    └── my_module_tests.move
\`\`\`

## Example: Coin Module

\`\`\`move
module my_addr::basic_coin {
    use std::signer;
    
    struct Coin has key {
        value: u64,
    }
    
    struct CoinCapabilities has key {
        mint_cap: bool,
    }
    
    public entry fun mint(
        admin: &signer,
        recipient: address,
        amount: u64
    ) acquires CoinCapabilities {
        let admin_addr = signer::address_of(admin);
        assert!(exists<CoinCapabilities>(admin_addr), 1);
        
        let coin = Coin { value: amount };
        move_to(&account::create_signer(recipient), coin);
    }
    
    public entry fun transfer(
        from: &signer,
        to: address,
        amount: u64
    ) acquires Coin {
        let from_addr = signer::address_of(from);
        let from_coin = borrow_global_mut<Coin>(from_addr);
        
        assert!(from_coin.value >= amount, 2);
        from_coin.value = from_coin.value - amount;
        
        if (exists<Coin>(to)) {
            let to_coin = borrow_global_mut<Coin>(to);
            to_coin.value = to_coin.value + amount;
        } else {
            move_to(&account::create_signer(to), Coin { value: amount });
        }
    }
    
    #[view]
    public fun balance(owner: address): u64 acquires Coin {
        if (exists<Coin>(owner)) {
            borrow_global<Coin>(owner).value
        } else {
            0
        }
    }
}
\`\`\`

## Deploy & Interact

\`\`\`bash
# Compile
aptos move compile

# Test
aptos move test

# Deploy
aptos move publish --named-addresses my_addr=default

# Call function
aptos move run --function-id 'default::basic_coin::mint' \\
    --args address:0x1 u64:1000
\`\`\``
          }
        ]
      }
    ]
  },

  {
    title: "Sui Development",
    description: "Build on Sui with object-centric Move. Learn about Sui's unique object model, parallel execution, and sponsored transactions.",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800",
    categorySlug: "alternative-l1",
    chapters: [
      {
        title: "Sui Fundamentals",
        description: "Understanding Sui's object model",
        lessons: [
          {
            title: "Sui Object Model",
            content: `# Sui Object Model

Sui extends Move with an object-centric model for parallelism.

## Objects, Not Accounts

Everything is an object:
\`\`\`move
// Objects have:
// - Unique ID
// - Owner (address, another object, or shared)
// - Type
// - Contents

struct NFT has key, store {
    id: UID,
    name: String,
    url: String,
}
\`\`\`

## Object Ownership

### Owned Objects
Belong to a single address:
\`\`\`move
public fun create_nft(ctx: &mut TxContext) {
    let nft = NFT {
        id: object::new(ctx),
        name: string::utf8(b"My NFT"),
        url: string::utf8(b"https://..."),
    };
    // Transfer to sender
    transfer::transfer(nft, tx_context::sender(ctx));
}
\`\`\`

### Shared Objects
Accessible by anyone:
\`\`\`move
public fun create_pool(ctx: &mut TxContext) {
    let pool = Pool {
        id: object::new(ctx),
        balance: balance::zero(),
    };
    // Make shared
    transfer::share_object(pool);
}
\`\`\`

### Immutable Objects
Frozen forever:
\`\`\`move
public fun freeze_config(config: Config) {
    transfer::freeze_object(config);
}
\`\`\`

## Why Object Model?

### Parallel Execution
Transactions touching different owned objects execute in parallel:
\`\`\`
Tx1: Alice's NFT → Bob     ┐
Tx2: Carol's Coin → Dave   ├── All parallel!
Tx3: Eve's Token → Frank   ┘
\`\`\`

### Simple Transactions
No gas estimation needed for owned objects.
Only shared objects need ordering.`
          },
          {
            title: "Building on Sui",
            content: `# Building on Sui

Practical Sui development guide.

## Setup

\`\`\`bash
# Install Sui
cargo install --git https://github.com/MystenLabs/sui.git sui

# Create project
sui move new my_project
cd my_project
\`\`\`

## Example: NFT Collection

\`\`\`move
module my_project::nft {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};
    
    struct NFT has key, store {
        id: UID,
        name: String,
        description: String,
        url: String,
    }
    
    struct MintCap has key {
        id: UID,
        supply: u64,
        minted: u64,
    }
    
    fun init(ctx: &mut TxContext) {
        transfer::transfer(
            MintCap {
                id: object::new(ctx),
                supply: 10000,
                minted: 0,
            },
            tx_context::sender(ctx)
        );
    }
    
    public entry fun mint(
        cap: &mut MintCap,
        name: vector<u8>,
        description: vector<u8>,
        url: vector<u8>,
        recipient: address,
        ctx: &mut TxContext
    ) {
        assert!(cap.minted < cap.supply, 0);
        cap.minted = cap.minted + 1;
        
        let nft = NFT {
            id: object::new(ctx),
            name: string::utf8(name),
            description: string::utf8(description),
            url: string::utf8(url),
        };
        
        transfer::public_transfer(nft, recipient);
    }
    
    public entry fun transfer_nft(
        nft: NFT,
        recipient: address,
    ) {
        transfer::public_transfer(nft, recipient);
    }
}
\`\`\`

## TypeScript SDK

\`\`\`typescript
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";

const client = new SuiClient({ url: getFullnodeUrl("mainnet") });
const keypair = Ed25519Keypair.fromSecretKey(privateKey);

// Build transaction
const tx = new TransactionBlock();
tx.moveCall({
  target: "\${PACKAGE_ID}::nft::mint",
  arguments: [
    tx.object(mintCapId),
    tx.pure("My NFT"),
    tx.pure("Description"),
    tx.pure("https://..."),
    tx.pure(recipientAddress),
  ],
});

// Sign and execute
const result = await client.signAndExecuteTransactionBlock({
  signer: keypair,
  transactionBlock: tx,
});
\`\`\`

## Sponsored Transactions

\`\`\`typescript
// Sponsor pays for gas
const tx = new TransactionBlock();
tx.setSender(userAddress);
tx.setGasOwner(sponsorAddress);

// User signs
const userSig = await userKeypair.signTransactionBlock(tx);

// Sponsor signs and submits
const sponsorSig = await sponsorKeypair.signTransactionBlock(tx);
await client.executeTransactionBlock({
  transactionBlock: tx.serialize(),
  signature: [userSig, sponsorSig],
});
\`\`\``
          }
        ]
      }
    ]
  },

  {
    title: "TON Blockchain Development",
    description: "Build on The Open Network (TON), Telegram's blockchain. Master FunC, smart contract development, and TON's unique architecture.",
    thumbnail: "https://images.unsplash.com/photo-1611606063065-ee7946f0787a?w=800",
    categorySlug: "alternative-l1",
    chapters: [
      {
        title: "TON Fundamentals",
        description: "Understanding TON's architecture",
        lessons: [
          {
            title: "TON Architecture",
            content: `# TON Architecture

TON (The Open Network) was designed for massive scalability.

## Design Principles

- **Infinite sharding**: Automatically splits under load
- **Instant hypercube routing**: Fast cross-shard messaging
- **Proof of Stake**: Efficient consensus
- **Telegram integration**: 900M+ user base

## Multi-Chain Structure

\`\`\`
Masterchain (governance)
    │
    ├── Workchain 0 (basechain)
    │   ├── Shard 0
    │   ├── Shard 1
    │   └── ...
    │
    └── Workchain N (future)
        └── ...
\`\`\`

## Account Model

Accounts in TON:
- Actor model (each account is an actor)
- Asynchronous messaging
- Internal currency: TON coin

\`\`\`
Account:
├── Address: EQ...
├── Balance: 100 TON
├── Code: (smart contract)
├── Data: (persistent state)
└── Message queue
\`\`\`

## Message-Based Execution

Unlike synchronous EVM:
\`\`\`
External Message → Contract A
    │
    └─→ Internal Message → Contract B
            │
            └─→ Internal Message → Contract C
\`\`\`

Each step is a separate transaction!

## Gas Model

- Compute fees (execution)
- Storage fees (state rent)
- Message fees (sending)
- Forward fees (routing)

Storage is rented, not bought!`
          },
          {
            title: "FunC Smart Contracts",
            content: `# FunC Smart Contracts

FunC is TON's primary smart contract language.

## Hello World

\`\`\`func
#include "stdlib.fc";

() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    ;; Handle internal messages
    if (in_msg_body.slice_empty?()) {
        return ();
    }
    
    int op = in_msg_body~load_uint(32);
    
    if (op == 1) {
        ;; Increment counter
        var ds = get_data().begin_parse();
        int count = ds~load_uint(64);
        count += 1;
        set_data(begin_cell().store_uint(count, 64).end_cell());
    }
}

int get_count() method_id {
    var ds = get_data().begin_parse();
    return ds~load_uint(64);
}
\`\`\`

## Data Structures

### Cells
\`\`\`func
;; Build a cell
cell c = begin_cell()
    .store_uint(123, 32)
    .store_coins(1000000000)  ;; 1 TON
    .store_ref(another_cell)
    .end_cell();

;; Parse a cell
slice s = c.begin_parse();
int value = s~load_uint(32);
int coins = s~load_coins();
cell ref = s~load_ref();
\`\`\`

### Dictionaries
\`\`\`func
;; Create dict
cell dict = new_dict();

;; Add entry
dict~udict_set(256, key, value);

;; Get entry
(slice value, int found) = dict.udict_get?(256, key);
\`\`\`

## Sending Messages

\`\`\`func
() send_ton(slice recipient, int amount) impure {
    var msg = begin_cell()
        .store_uint(0x18, 6)  ;; bounceable
        .store_slice(recipient)
        .store_coins(amount)
        .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
        .end_cell();
    
    send_raw_message(msg, 1);  ;; mode 1: pay fees separately
}
\`\`\`

## Tact (Modern Alternative)

\`\`\`tact
contract Counter {
    count: Int = 0;
    
    receive("increment") {
        self.count += 1;
    }
    
    get fun count(): Int {
        return self.count;
    }
}
\`\`\``
          }
        ]
      }
    ]
  },

  {
    title: "Polkadot & Substrate",
    description: "Build custom blockchains with Substrate and connect to Polkadot's parachain ecosystem. Master FRAME pallets and cross-chain messaging.",
    thumbnail: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800",
    categorySlug: "alternative-l1",
    chapters: [
      {
        title: "Substrate Development",
        description: "Building custom blockchains",
        lessons: [
          {
            title: "Substrate Overview",
            content: `# Substrate Overview

Substrate is the blockchain framework powering Polkadot.

## Why Substrate?

- **Forkless upgrades**: Update runtime without hard forks
- **Modular**: Mix and match components (pallets)
- **Customizable**: Build any consensus, any feature
- **Polkadot ready**: Become a parachain

## Architecture

\`\`\`
┌─────────────────────────────────────┐
│            Runtime (WASM)           │
│  ┌─────────┐ ┌─────────┐ ┌────────┐ │
│  │ Balances│ │ Staking │ │ Custom │ │
│  └─────────┘ └─────────┘ └────────┘ │
├─────────────────────────────────────┤
│           Client (Native)           │
│  Consensus │ Networking │ Storage   │
└─────────────────────────────────────┘
\`\`\`

## Key Concepts

### Runtime
WebAssembly code defining blockchain logic:
- Stored on-chain
- Upgraded via governance
- Deterministic execution

### Pallets
Modular runtime components:
- **frame_system**: Core blockchain functionality
- **pallet_balances**: Token management
- **pallet_staking**: PoS staking
- Custom pallets: Your logic

### Extrinsics
Transactions in Substrate terms:
- Signed: User transactions
- Unsigned: System operations
- Inherents: Block author data

## Setup

\`\`\`bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown

# Use Substrate node template
git clone https://github.com/substrate-developer-hub/substrate-node-template
cd substrate-node-template
cargo build --release
\`\`\``
          },
          {
            title: "Building a Pallet",
            content: `# Building a Pallet

Create custom blockchain logic with FRAME pallets.

## Pallet Structure

\`\`\`rust
#![cfg_attr(not(feature = "std"), no_std)]

pub use pallet::*;

#[frame_support::pallet]
pub mod pallet {
    use frame_support::pallet_prelude::*;
    use frame_system::pallet_prelude::*;

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    #[pallet::config]
    pub trait Config: frame_system::Config {
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
        type MaxClaimLength: Get<u32>;
    }

    #[pallet::storage]
    pub type Proofs<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        BoundedVec<u8, T::MaxClaimLength>,
        (T::AccountId, BlockNumberFor<T>),
    >;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        ClaimCreated { who: T::AccountId, claim: Vec<u8> },
        ClaimRevoked { who: T::AccountId, claim: Vec<u8> },
    }

    #[pallet::error]
    pub enum Error<T> {
        ProofAlreadyClaimed,
        NoSuchProof,
        NotProofOwner,
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        #[pallet::weight(10_000)]
        #[pallet::call_index(0)]
        pub fn create_claim(
            origin: OriginFor<T>,
            claim: BoundedVec<u8, T::MaxClaimLength>,
        ) -> DispatchResult {
            let sender = ensure_signed(origin)?;
            
            ensure!(
                !Proofs::<T>::contains_key(&claim),
                Error::<T>::ProofAlreadyClaimed
            );

            let block_number = <frame_system::Pallet<T>>::block_number();
            Proofs::<T>::insert(&claim, (&sender, block_number));

            Self::deposit_event(Event::ClaimCreated {
                who: sender,
                claim: claim.to_vec(),
            });

            Ok(())
        }
    }
}
\`\`\`

## Add to Runtime

\`\`\`rust
// runtime/src/lib.rs
impl pallet_template::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type MaxClaimLength = ConstU32<256>;
}

construct_runtime!(
    pub struct Runtime {
        System: frame_system,
        Balances: pallet_balances,
        Template: pallet_template,  // Add your pallet
    }
);
\`\`\`

## Frontend Integration

\`\`\`javascript
import { ApiPromise, WsProvider } from '@polkadot/api';

const api = await ApiPromise.create({
  provider: new WsProvider('ws://127.0.0.1:9944')
});

// Query storage
const proof = await api.query.template.proofs('0x...');

// Submit extrinsic
const tx = api.tx.template.createClaim('0x...');
await tx.signAndSend(account);
\`\`\``
          }
        ]
      }
    ]
  },

  // -------------------------------------------------------------------------
  // ADVANCED DeFi
  // -------------------------------------------------------------------------
  {
    title: "MEV & Flashbots",
    description: "Understand Maximal Extractable Value and how to capture or protect against it. Master flashbots, searcher strategies, and MEV-aware development.",
    thumbnail: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800",
    categorySlug: "defi",
    chapters: [
      {
        title: "Understanding MEV",
        description: "The hidden economy of blockchains",
        lessons: [
          {
            title: "What is MEV?",
            content: `# What is MEV?

MEV (Maximal Extractable Value) is profit extracted by reordering, inserting, or censoring transactions.

## The Opportunity

Block producers control transaction ordering. This creates profit opportunities:

### Arbitrage
Price differences across DEXs:
\`\`\`
1. See ETH cheaper on Uniswap vs Sushiswap
2. Buy low, sell high in same block
3. Profit (minus gas)
\`\`\`

### Liquidations
Racing to liquidate underwater positions:
\`\`\`
1. Monitor Aave/Compound for underwater loans
2. Front-run other liquidators
3. Claim liquidation bonus
\`\`\`

### Sandwich Attacks
Exploiting large swaps:
\`\`\`
1. See large buy order in mempool
2. Buy before victim (front-run)
3. Victim's buy raises price
4. Sell after victim (back-run)
5. Profit from price impact
\`\`\`

## MEV Supply Chain

\`\`\`
Searchers → Builders → Validators
    │           │           │
    │           │           └── Include block
    │           └── Bundle transactions
    └── Find opportunities
\`\`\`

## MEV by the Numbers

- $675M+ extracted on Ethereum
- Most goes to validators now
- Creates negative externalities:
  - Higher gas (priority fee wars)
  - Worse execution for users
  - Network congestion`
          },
          {
            title: "Building MEV Strategies",
            content: `# Building MEV Strategies

How searchers extract value.

## Basic Arbitrage Bot

\`\`\`javascript
const { ethers } = require('ethers');
const { FlashbotsBundleProvider } = require('@flashbots/ethers-provider-bundle');

async function findArbitrage() {
  // Get prices from multiple DEXs
  const uniPrice = await getUniswapPrice(WETH, USDC);
  const sushiPrice = await getSushiswapPrice(WETH, USDC);
  
  const spread = Math.abs(uniPrice - sushiPrice) / Math.min(uniPrice, sushiPrice);
  
  if (spread > MIN_PROFIT_THRESHOLD) {
    return {
      buyDex: uniPrice < sushiPrice ? 'uniswap' : 'sushiswap',
      sellDex: uniPrice < sushiPrice ? 'sushiswap' : 'uniswap',
      expectedProfit: calculateProfit(spread, TRADE_SIZE)
    };
  }
  return null;
}

async function executeArbitrage(opportunity) {
  const flashbots = await FlashbotsBundleProvider.create(
    provider,
    authSigner,
    'https://relay.flashbots.net'
  );
  
  // Build bundle
  const bundle = [
    {
      transaction: {
        to: ARBITRAGE_CONTRACT,
        data: encodeArbitrageCall(opportunity),
        gasLimit: 500000,
        maxFeePerGas: calculateGas(),
        maxPriorityFeePerGas: 0, // Pay via coinbase transfer
      },
      signer: wallet
    }
  ];
  
  // Submit to Flashbots
  const signedBundle = await flashbots.signBundle(bundle);
  const simulation = await flashbots.simulate(signedBundle, targetBlock);
  
  if (simulation.firstRevert) {
    console.log('Bundle reverts:', simulation.firstRevert);
    return;
  }
  
  await flashbots.sendBundle(bundle, targetBlock);
}
\`\`\`

## Arbitrage Contract

\`\`\`solidity
contract Arbitrage {
    function execute(
        address buyDex,
        address sellDex,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external {
        // Buy on first DEX
        IERC20(tokenIn).approve(buyDex, amountIn);
        uint256 amountOut = IRouter(buyDex).swap(tokenIn, tokenOut, amountIn);
        
        // Sell on second DEX
        IERC20(tokenOut).approve(sellDex, amountOut);
        uint256 finalAmount = IRouter(sellDex).swap(tokenOut, tokenIn, amountOut);
        
        // Verify profit
        require(finalAmount > amountIn, "No profit");
        
        // Pay builder
        uint256 profit = finalAmount - amountIn;
        block.coinbase.transfer(profit * 90 / 100); // 90% to builder
    }
}
\`\`\`

## Protecting Against MEV

\`\`\`solidity
// Use private mempools (Flashbots Protect)
// Add slippage protection
function swap(uint256 amountIn, uint256 minAmountOut) external {
    uint256 amountOut = doSwap(amountIn);
    require(amountOut >= minAmountOut, "Slippage exceeded");
}
\`\`\``
          }
        ]
      }
    ]
  },

  {
    title: "Lending Protocol Development",
    description: "Design and build lending protocols like Aave and Compound. Master interest rate models, liquidations, and risk management.",
    thumbnail: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800",
    categorySlug: "defi",
    chapters: [
      {
        title: "Lending Protocol Design",
        description: "Core mechanics of DeFi lending",
        lessons: [
          {
            title: "How Lending Protocols Work",
            content: `# How Lending Protocols Work

DeFi lending enables permissionless borrowing and lending.

## Core Mechanics

### Supplying
Deposit assets to earn interest:
\`\`\`
1. User deposits 100 USDC
2. Receives 100 aUSDC (interest-bearing token)
3. aUSDC balance grows over time
4. Withdraw: aUSDC → USDC + interest
\`\`\`

### Borrowing
Use collateral to borrow:
\`\`\`
1. Deposit 1 ETH as collateral
2. Borrow up to 75% of collateral value (LTV ratio)
3. Pay interest over time
4. Repay loan + interest to unlock collateral
\`\`\`

## Key Concepts

### Loan-to-Value (LTV)
Maximum you can borrow relative to collateral:
- ETH: 75-80% LTV
- Stablecoins: 80-85% LTV
- Volatile tokens: 50-70% LTV

### Liquidation Threshold
When your collateral value drops below this threshold, your position can be liquidated.

### Health Factor
\`\`\`
Health Factor = (Collateral × Liquidation Threshold) / Debt

HF > 1 = Safe
HF < 1 = Liquidatable
\`\`\`

## Interest Rate Models

Most protocols use utilization-based rates:
\`\`\`javascript
// Simple linear model
supplyRate = utilizationRate * borrowRate * (1 - reserveFactor)

// Compound-style kinked model
if (utilization < kink) {
  rate = baseRate + utilization * multiplier
} else {
  rate = baseRate + kink * multiplier + (utilization - kink) * jumpMultiplier
}
\`\`\``
          },
          {
            title: "Building a Lending Protocol",
            content: `# Building a Lending Protocol

Implement core lending functionality in Solidity.

## Basic Lending Pool

\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LendingPool {
    IERC20 public immutable asset;
    
    mapping(address => uint256) public deposits;
    mapping(address => uint256) public borrows;
    mapping(address => uint256) public collateral;
    
    uint256 public totalDeposits;
    uint256 public totalBorrows;
    
    uint256 public constant LTV = 75; // 75%
    uint256 public constant LIQUIDATION_THRESHOLD = 80;
    
    constructor(address _asset) {
        asset = IERC20(_asset);
    }
    
    function deposit(uint256 amount) external {
        asset.transferFrom(msg.sender, address(this), amount);
        deposits[msg.sender] += amount;
        totalDeposits += amount;
    }
    
    function withdraw(uint256 amount) external {
        require(deposits[msg.sender] >= amount, "Insufficient balance");
        deposits[msg.sender] -= amount;
        totalDeposits -= amount;
        asset.transfer(msg.sender, amount);
    }
    
    function borrow(uint256 amount) external {
        uint256 maxBorrow = (collateral[msg.sender] * LTV) / 100;
        require(borrows[msg.sender] + amount <= maxBorrow, "Exceeds LTV");
        
        borrows[msg.sender] += amount;
        totalBorrows += amount;
        asset.transfer(msg.sender, amount);
    }
    
    function repay(uint256 amount) external {
        asset.transferFrom(msg.sender, address(this), amount);
        borrows[msg.sender] -= amount;
        totalBorrows -= amount;
    }
    
    function liquidate(address user) external {
        uint256 healthFactor = getHealthFactor(user);
        require(healthFactor < 1e18, "Position healthy");
        
        // Liquidation logic...
    }
    
    function getHealthFactor(address user) public view returns (uint256) {
        if (borrows[user] == 0) return type(uint256).max;
        return (collateral[user] * LIQUIDATION_THRESHOLD * 1e18) / (borrows[user] * 100);
    }
}
\`\`\`

## Interest Accrual

\`\`\`solidity
contract InterestBearingPool {
    uint256 public lastUpdateTime;
    uint256 public borrowIndex = 1e18;
    uint256 public supplyIndex = 1e18;
    
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    
    function accrueInterest() public {
        uint256 timeElapsed = block.timestamp - lastUpdateTime;
        if (timeElapsed == 0) return;
        
        uint256 utilization = getUtilization();
        uint256 borrowRate = getBorrowRate(utilization);
        
        uint256 interestFactor = borrowRate * timeElapsed / SECONDS_PER_YEAR;
        borrowIndex += (borrowIndex * interestFactor) / 1e18;
        
        lastUpdateTime = block.timestamp;
    }
    
    function getUtilization() public view returns (uint256) {
        if (totalDeposits == 0) return 0;
        return (totalBorrows * 1e18) / totalDeposits;
    }
    
    function getBorrowRate(uint256 utilization) public pure returns (uint256) {
        // 2% base + up to 20% based on utilization
        return 2e16 + (utilization * 20e16) / 1e18;
    }
}
\`\`\`

This gives you the foundation to build Aave/Compound-style protocols!`
          }
        ]
      }
    ]
  }
];

// ============================================================================
// SEED FUNCTION
// ============================================================================

async function seed() {
  console.log("🌱 Seeding extended courses...");

  // Ensure Skola user exists
  let skolaUser = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.address, SKOLA_ADDRESS),
  });

  if (!skolaUser) {
    const [newUser] = await db
      .insert(users)
      .values({
        address: SKOLA_ADDRESS,
        username: "Skola",
        avatar: "https://app.skola.academy/logo.png",
        bio: "Official Skola Academy courses. Learn web3 development, blockchain fundamentals, and decentralized technologies.",
        isCreator: true,
        isAdmin: true,
        creatorTier: "elite",
        creatorRegisteredAt: new Date(),
        referralCode: "SKOLA",
      })
      .returning();
    skolaUser = newUser;
    console.log("Created Skola user:", skolaUser.id);
  } else {
    console.log("Using existing Skola user:", skolaUser.id);
  }

  // Ensure categories exist
  const categoryMap: Record<string, string> = {};
  
  const categoryDefs = [
    { name: "Layer 2", slug: "layer-2", description: "L2 scaling solutions", icon: "⚡", color: "#8B5CF6", order: 10 },
    { name: "DeFi", slug: "defi", description: "Decentralized finance protocols", icon: "🏦", color: "#10B981", order: 11 },
    { name: "Bitcoin", slug: "bitcoin", description: "Bitcoin protocol and ecosystem", icon: "₿", color: "#F7931A", order: 12 },
    { name: "Alternative L1s", slug: "alt-l1", description: "Alternative Layer 1 blockchains", icon: "🔗", color: "#EC4899", order: 13 },
    { name: "Cross-Chain", slug: "cross-chain", description: "Bridges and interoperability", icon: "🌉", color: "#6366F1", order: 14 },
    { name: "Advanced", slug: "advanced", description: "Advanced blockchain topics", icon: "🎓", color: "#F59E0B", order: 15 },
  ];

  for (const cat of categoryDefs) {
    const existing = await db.query.categories.findFirst({
      where: (c, { eq }) => eq(c.slug, cat.slug),
    });
    
    if (existing) {
      categoryMap[cat.slug] = existing.id;
    } else {
      const [newCat] = await db.insert(categories).values(cat).returning();
      categoryMap[cat.slug] = newCat.id;
      console.log(`Created category: ${cat.name}`);
    }
  }

  // Seed courses
  for (const courseData of COURSES) {
    const existingCourse = await db.query.courses.findFirst({
      where: (c, { eq }) => eq(c.title, courseData.title),
    });

    if (existingCourse) {
      console.log(`Course "${courseData.title}" already exists, skipping...`);
      continue;
    }

    console.log(`\nCreating course: ${courseData.title}`);

    const [course] = await db
      .insert(courses)
      .values({
        creatorId: skolaUser.id,
        title: courseData.title,
        description: courseData.description,
        thumbnail: courseData.thumbnail,
        priceUsd: "0",
        isFree: true,
        isPublished: true,
        previewPercentage: 100,
      })
      .returning();

    // Link to category
    if (courseData.categorySlug && categoryMap[courseData.categorySlug]) {
      await db.insert(courseCategories).values({
        courseId: course.id,
        categoryId: categoryMap[courseData.categorySlug],
      }).onConflictDoNothing();
    }

    console.log(`  Created course: ${course.id}`);

    for (let chapterIndex = 0; chapterIndex < courseData.chapters.length; chapterIndex++) {
      const chapterData = courseData.chapters[chapterIndex];

      const [chapter] = await db
        .insert(chapters)
        .values({
          courseId: course.id,
          title: chapterData.title,
          description: chapterData.description,
          order: chapterIndex + 1,
        })
        .returning();

      console.log(`    Chapter ${chapterIndex + 1}: ${chapter.title}`);

      for (let lessonIndex = 0; lessonIndex < chapterData.lessons.length; lessonIndex++) {
        const lessonData = chapterData.lessons[lessonIndex];

        await db.insert(lessons).values({
          chapterId: chapter.id,
          title: lessonData.title,
          content: lessonData.content,
          order: lessonIndex + 1,
          isPreview: true,
        });

        console.log(`      Lesson ${lessonIndex + 1}: ${lessonData.title}`);
      }
    }
  }

  console.log("\n✅ Done! Seeded extended courses.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });