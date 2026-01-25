import "dotenv/config";
import { db } from "../db";
import { users, courses, chapters, lessons, creatorStats } from "../db/schema";
import { eq } from "drizzle-orm";

const SKOLA_ADDRESS = "0x536b6f6c6144414f0000000000000000000000000";
const SKOLA_AVATAR = "/logo.png";

const FREE_COURSES = [
  {
    title: "How Blockchain Works",
    description:
      "Understand the core principles behind blockchain technology. Learn about distributed ledgers, consensus mechanisms, cryptographic hashing, and why blockchain is revolutionizing trust in the digital age.",
    thumbnail: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80",
    chapters: [
      {
        title: "Foundations of Blockchain",
        description: "Core concepts and building blocks",
        lessons: [
          {
            title: "What Problem Does Blockchain Solve?",
            content: `# What Problem Does Blockchain Solve?

Before blockchain, digital trust required middlemen. Let's understand why.

## The Double-Spend Problem

Digital files can be copied infinitely. How do you prove you own something digital?

Before blockchain:
- Banks track who owns money
- Governments track who owns property
- Companies track who owns accounts

The problem: You must **trust** these institutions.

## The Byzantine Generals Problem

Imagine generals surrounding a city, needing to coordinate an attack:
- They can only communicate by messenger
- Some generals might be traitors
- How do they reach agreement?

This is the core challenge of distributed systems.

## Satoshi's Solution

In 2008, Satoshi Nakamoto solved both problems:

1. **Proof of Work** - Makes cheating expensive
2. **Chain of Blocks** - Makes history tamper-evident
3. **Distributed Network** - No single point of failure

Result: Trust without trusted third parties.`,
          },
          {
            title: "Distributed Ledgers Explained",
            content: `# Distributed Ledgers Explained

A blockchain is a special type of distributed ledger. Let's break this down.

## What's a Ledger?

A ledger is a record of transactions:
- Your bank statement is a ledger
- A company's accounting books are ledgers
- Transaction history = ledger

## Centralized vs Distributed

### Centralized Ledger
- One company keeps the records
- You trust them to be honest
- Single point of failure
- Can be censored or changed

### Distributed Ledger
- Thousands of copies worldwide
- No single owner
- Consensus required for changes
- Extremely hard to censor

## How Distribution Works

1. **Every node has a full copy** of the ledger
2. **New transactions broadcast** to all nodes
3. **Nodes validate** transactions independently
4. **Consensus determines** which transactions are valid
5. **All copies update** simultaneously

## Why This Matters

No government, company, or hacker can:
- Shut down the network
- Reverse transactions
- Freeze accounts
- Change the rules unilaterally`,
          },
          {
            title: "Cryptographic Hashing",
            content: `# Cryptographic Hashing

Hashing is the mathematical magic that makes blockchain secure.

## What's a Hash?

A hash function takes any input and produces a fixed-size output:

Input: "Hello World"
Output: a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e

## Key Properties

### 1. Deterministic
Same input ALWAYS produces same output.

### 2. One-Way
Cannot reverse-engineer input from output.
(Like turning a cow into hamburger - can't undo it)

### 3. Avalanche Effect
Tiny input change = completely different output.

"Hello World" → a591a6d40bf420...
"Hello World!" → 7f83b1657ff1fc53...

### 4. Collision Resistant
Virtually impossible to find two inputs with same output.

## Hashing in Blockchain

Each block contains:
- Hash of previous block (creates the "chain")
- Hash of all transactions in block
- Timestamp and other metadata

Change anything → hash changes → chain breaks

This makes the blockchain **tamper-evident**.`,
          },
          {
            title: "Blocks and Chains",
            content: `# Blocks and Chains

Now let's see how blocks link together to form a blockchain.

## Anatomy of a Block

Each block contains:

\`\`\`
┌─────────────────────────────┐
│ Block Header                │
│ ├─ Previous Block Hash      │
│ ├─ Timestamp                │
│ ├─ Nonce (for mining)       │
│ └─ Merkle Root              │
├─────────────────────────────┤
│ Transactions                │
│ ├─ Tx 1: Alice → Bob, 1 ETH │
│ ├─ Tx 2: Carol → Dave, 2 ETH│
│ └─ ... more transactions    │
└─────────────────────────────┘
\`\`\`

## The Chain

Each block includes the **hash of the previous block**:

Block 1 → Block 2 → Block 3 → Block 4
   ↑         ↑         ↑
   └─────────┴─────────┴── Each points back

## Why Chains Are Secure

To change Block 2, you must:
1. Change Block 2's data
2. Recalculate Block 2's hash
3. Update Block 3's "previous hash"
4. Recalculate Block 3's hash
5. Update Block 4's "previous hash"
6. ...and every block after

And do all this faster than the honest network adds new blocks.

**Practically impossible.**`,
          },
        ],
      },
      {
        title: "Consensus Mechanisms",
        description: "How networks agree on truth",
        lessons: [
          {
            title: "What is Consensus?",
            content: `# What is Consensus?

With thousands of computers worldwide, how does the network agree on what's true?

## The Challenge

- No central authority
- Nodes can join/leave freely
- Some nodes might be malicious
- Network delays cause inconsistencies

Yet we need ONE agreed-upon history.

## Consensus Requirements

A good consensus mechanism must be:

1. **Safe** - All honest nodes agree
2. **Live** - Network keeps making progress
3. **Fault Tolerant** - Works despite failures
4. **Sybil Resistant** - Can't cheat by creating fake nodes

## Types of Consensus

### Proof of Work (PoW)
- Used by Bitcoin
- Miners solve puzzles
- Most secure, but energy-intensive

### Proof of Stake (PoS)
- Used by Ethereum
- Validators lock up money
- Energy efficient

### Other Mechanisms
- Delegated Proof of Stake (DPoS)
- Proof of Authority (PoA)
- Proof of History (Solana)

We'll explore each in detail.`,
          },
          {
            title: "Proof of Work Deep Dive",
            content: `# Proof of Work Deep Dive

Bitcoin's original consensus mechanism. Let's understand how it works.

## The Mining Puzzle

Miners compete to find a special number (nonce) that makes the block hash start with many zeros:

\`\`\`
Target: Hash must start with 0000...

Attempt 1: nonce=1 → hash=7a3f2b... ❌
Attempt 2: nonce=2 → hash=b91c4d... ❌
...millions of attempts...
Attempt N: nonce=4892751 → hash=0000ab... ✓
\`\`\`

## Why This Works

1. **Finding valid hash is HARD** - Requires billions of attempts
2. **Verifying is EASY** - Just hash once to check
3. **Can't shortcut** - Must do the work
4. **Adjustable difficulty** - Network tunes how many zeros needed

## Block Rewards

Winner gets:
- Newly minted coins (block reward)
- Transaction fees from included transactions

This incentivizes honest behavior.

## 51% Attack

To cheat, attacker needs >50% of total computing power.
Cost: Billions in hardware + electricity
Reward: Destroy the thing you just spent billions on?

Economics make attacks irrational.`,
          },
          {
            title: "Proof of Stake Explained",
            content: `# Proof of Stake Explained

Ethereum switched to Proof of Stake in 2022. Here's why and how.

## The Problem with PoW

- Consumes electricity of entire countries
- Requires specialized hardware
- Centralizes around cheap electricity

## How PoS Works

Instead of computing power, validators stake money:

1. **Deposit ETH** - Lock up 32 ETH to become validator
2. **Get selected** - Protocol randomly picks block proposers
3. **Propose block** - Selected validator creates block
4. **Others attest** - Other validators verify and sign
5. **Earn rewards** - Get paid for honest participation

## Slashing

What prevents cheating? **Slashing**:

- Sign conflicting blocks → Lose some stake
- Go offline frequently → Lose some stake
- Coordinated attack → Lose ALL stake

Your money is hostage for good behavior.

## Benefits of PoS

- 99.95% less energy than PoW
- No special hardware needed
- More decentralized (theoretically)
- Faster finality

## Ethereum's Implementation

- 32 ETH minimum stake
- ~900,000 validators currently
- Blocks every 12 seconds
- Finality in ~15 minutes`,
          },
          {
            title: "Finality and Forks",
            content: `# Finality and Forks

When is a transaction truly final? What happens when the chain splits?

## Transaction Finality

**Probabilistic Finality (PoW)**
- Never 100% final
- Gets more certain over time
- Bitcoin: Wait 6 blocks (~1 hour)
- Could theoretically be reversed

**Economic Finality (PoS)**
- Final once enough validators attest
- Reversal would cost attackers billions
- Ethereum: ~15 minutes to finality

## What's a Fork?

A fork happens when the chain splits into two paths:

\`\`\`
        ┌─ Block 4a
Block 3 ┤
        └─ Block 4b
\`\`\`

## Types of Forks

### Temporary Forks
- Two miners find blocks simultaneously
- Network eventually picks one
- Orphaned block gets discarded

### Hard Forks
- Intentional protocol upgrade
- Old rules incompatible with new
- Creates permanent split if not everyone upgrades
- Example: Ethereum vs Ethereum Classic

### Soft Forks
- Backward-compatible upgrade
- Old nodes still work
- Smoother transition

## The Longest Chain Rule

In PoW, the valid chain with most work wins.
In PoS, the chain with most attestations wins.

This resolves temporary forks automatically.`,
          },
        ],
      },
      {
        title: "Beyond the Basics",
        description: "Advanced concepts and real-world applications",
        lessons: [
          {
            title: "Smart Contracts",
            content: `# Smart Contracts

Blockchain's killer feature: programmable agreements.

## What's a Smart Contract?

Code that runs on the blockchain:
- Executes automatically
- Cannot be stopped
- Transparent and verifiable
- Trustless (trust the code, not people)

## Simple Example

Traditional escrow:
1. Buyer sends money to escrow company
2. Seller ships item
3. Buyer confirms receipt
4. Escrow releases money
5. Hope the escrow company is honest...

Smart contract escrow:
1. Buyer sends money to contract
2. Seller ships item
3. Buyer confirms (or timeout triggers)
4. Contract automatically releases money
5. No trust needed!

## What Can Smart Contracts Do?

- **DeFi** - Lending, borrowing, trading
- **NFTs** - Digital ownership
- **DAOs** - Decentralized organizations
- **Gaming** - Verifiable game mechanics
- **Identity** - Self-sovereign credentials

## Limitations

- Can't access external data directly (need oracles)
- Bugs can't be fixed (immutable)
- Gas costs for computation
- Not truly "smart" (just deterministic)`,
          },
          {
            title: "Layer 2 Scaling",
            content: `# Layer 2 Scaling

Blockchains are slow. Layer 2s make them fast.

## The Scalability Problem

Ethereum mainnet:
- ~15 transactions per second
- $5-50 per transaction
- Compare: Visa does 65,000 TPS

## Layer 2 Solutions

Build on top of Layer 1 (Ethereum), inherit its security:

### Rollups
Bundle many transactions into one L1 transaction.

**Optimistic Rollups** (Arbitrum, Optimism, Base)
- Assume transactions are valid
- Fraud proofs catch cheaters
- 7-day withdrawal period

**ZK Rollups** (zkSync, StarkNet)
- Prove validity mathematically
- Instant finality
- More complex technology

## How Base Works

Base (where Skola lives):
- Optimistic rollup by Coinbase
- Inherits Ethereum security
- Transactions cost < $0.01
- Confirms in seconds

## The Future

Ethereum's roadmap:
- More rollups
- Data availability improvements
- Potential 100,000+ TPS
- Maintaining decentralization`,
          },
          {
            title: "Public vs Private Blockchains",
            content: `# Public vs Private Blockchains

Not all blockchains are created equal.

## Public Blockchains

**Characteristics:**
- Anyone can participate
- Fully transparent
- Censorship resistant
- Truly decentralized

**Examples:** Bitcoin, Ethereum, Solana

**Use cases:**
- Cryptocurrency
- DeFi
- NFTs
- Permissionless applications

## Private Blockchains

**Characteristics:**
- Permissioned access
- Controlled by organization
- Faster (fewer nodes)
- Not truly trustless

**Examples:** Hyperledger, R3 Corda

**Use cases:**
- Enterprise supply chain
- Inter-bank settlement
- Healthcare records
- Government systems

## The Spectrum

\`\`\`
Full Public ←────────────────→ Full Private
   │                              │
Bitcoin                     Corporate DB
Ethereum                    Hyperledger
  Base                      Private chains
   │                              │
Permissionless              Permissioned
\`\`\`

## Which is "Real" Blockchain?

Purists argue only public chains are true blockchains.
Private chains are "distributed databases with extra steps."

But both have legitimate use cases.`,
          },
          {
            title: "The Future of Blockchain",
            content: `# The Future of Blockchain

Where is this technology heading?

## Current Challenges

1. **Scalability** - Still not Visa-level
2. **UX** - Seed phrases, gas fees confuse users
3. **Regulation** - Legal uncertainty
4. **Energy** - PoW concerns (mostly solved by PoS)
5. **Interoperability** - Chains don't talk easily

## Emerging Solutions

### Account Abstraction
- Smart contract wallets
- Social recovery (no seed phrases)
- Gas paid in any token
- Better UX

### Cross-Chain Communication
- Bridges between blockchains
- Unified liquidity
- Chain-agnostic apps

### Zero-Knowledge Proofs
- Privacy without hiding
- Prove things without revealing data
- Scaling through validity proofs

## Mainstream Adoption

Signs of progress:
- BlackRock Bitcoin ETF
- Stablecoins in emerging markets
- NFTs in gaming and media
- CBDCs (Central Bank Digital Currencies)

## What Won't Change

Core principles remain:
- Decentralization matters
- Trust minimization
- Censorship resistance
- User ownership

The technology improves, but the philosophy persists.

---

Congratulations! You now understand how blockchain works at a fundamental level. Ready to build on this foundation?`,
          },
        ],
      },
    ],
  },
  {
    title: "Solidity Fundamentals",
    description:
      "Learn to write smart contracts with Solidity, the programming language of Ethereum. From basic syntax to advanced patterns, build your foundation for Web3 development.",
    thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80",
    chapters: [
      {
        title: "Getting Started with Solidity",
        description: "Your first smart contracts",
        lessons: [
          {
            title: "What is Solidity?",
            content: `# What is Solidity?

Solidity is THE language for Ethereum smart contracts.

## Overview

- Created specifically for Ethereum
- Statically typed
- Supports inheritance
- Influenced by C++, Python, JavaScript

## Where Solidity Runs

Your Solidity code compiles to **bytecode** that runs on:
- Ethereum mainnet
- Layer 2s (Arbitrum, Optimism, Base)
- Sidechains (Polygon)
- Testnets (Sepolia, Goerli)

## Your First Contract

\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract HelloWorld {
    string public message = "Hello, World!";
    
    function setMessage(string memory newMessage) public {
        message = newMessage;
    }
}
\`\`\`

## Key Parts Explained

- **SPDX-License-Identifier** - License declaration
- **pragma solidity** - Compiler version
- **contract** - Like a class in other languages
- **public** - Anyone can read/call
- **memory** - Temporary storage location

## Development Tools

- **Remix** - Browser IDE (great for learning)
- **Hardhat** - Professional framework
- **Foundry** - Fast, Rust-based toolkit
- **Truffle** - Original framework`,
          },
          {
            title: "Data Types and Variables",
            content: `# Data Types and Variables

Solidity is statically typed. Let's learn the types.

## Value Types

\`\`\`solidity
// Booleans
bool public isActive = true;

// Integers
uint256 public count = 100;        // Unsigned (0 to 2^256-1)
int256 public temperature = -10;   // Signed

// Addresses
address public owner = 0x742d35Cc6634C0532925a3b844Bc454e4438f44e;
address payable public wallet;     // Can receive ETH

// Bytes
bytes32 public hash;               // Fixed size
bytes public data;                 // Dynamic size
\`\`\`

## Reference Types

\`\`\`solidity
// Arrays
uint256[] public numbers;          // Dynamic array
uint256[10] public fixedNumbers;   // Fixed array

// Strings
string public name = "Skola";

// Mappings (like hash tables)
mapping(address => uint256) public balances;

// Structs
struct User {
    string name;
    uint256 balance;
    bool isActive;
}
\`\`\`

## Storage Locations

- **storage** - Permanent, on blockchain (expensive)
- **memory** - Temporary, during function (cheap)
- **calldata** - Read-only function input (cheapest)

\`\`\`solidity
function process(string calldata input) public {
    string memory temp = input;  // Copy to memory
    // storage variables persist after function ends
}
\`\`\``,
          },
          {
            title: "Functions and Modifiers",
            content: `# Functions and Modifiers

Functions are how users interact with your contract.

## Function Syntax

\`\`\`solidity
function functionName(
    uint256 param1,
    string memory param2
) public view returns (uint256) {
    // function body
    return param1;
}
\`\`\`

## Visibility

\`\`\`solidity
public    // Anyone can call
external  // Only from outside
internal  // This contract + children
private   // Only this contract
\`\`\`

## State Mutability

\`\`\`solidity
view      // Reads state, no modification
pure      // No state access at all
payable   // Can receive ETH
// (none)  // Can modify state
\`\`\`

## Modifiers

Reusable function checks:

\`\`\`solidity
modifier onlyOwner() {
    require(msg.sender == owner, "Not owner");
    _;  // Continue with function
}

modifier validAmount(uint256 amount) {
    require(amount > 0, "Amount must be positive");
    _;
}

function withdraw(uint256 amount) 
    public 
    onlyOwner 
    validAmount(amount) 
{
    // Only owner can call, amount must be > 0
    payable(msg.sender).transfer(amount);
}
\`\`\`

## Constructor

Runs once at deployment:

\`\`\`solidity
constructor(string memory _name) {
    owner = msg.sender;
    name = _name;
}
\`\`\``,
          },
          {
            title: "Events and Logging",
            content: `# Events and Logging

Events let contracts communicate with the outside world.

## Why Events?

- Cheaper than storage
- Searchable/filterable
- Frontend apps can listen
- Audit trail

## Declaring Events

\`\`\`solidity
event Transfer(
    address indexed from,
    address indexed to,
    uint256 value
);

event NewUser(
    address indexed user,
    string name,
    uint256 timestamp
);
\`\`\`

## Emitting Events

\`\`\`solidity
function transfer(address to, uint256 amount) public {
    balances[msg.sender] -= amount;
    balances[to] += amount;
    
    emit Transfer(msg.sender, to, amount);
}
\`\`\`

## Indexed Parameters

- Up to 3 indexed params per event
- Indexed params are searchable
- Non-indexed stored in data section

## Listening in JavaScript

\`\`\`javascript
contract.on("Transfer", (from, to, value) => {
    console.log(\`\${from} sent \${value} to \${to}\`);
});

// Or query past events
const events = await contract.queryFilter("Transfer");
\`\`\`

## Best Practices

- Event for every state change
- Use indexed for addresses
- Include relevant context
- Emit AFTER state changes`,
          },
        ],
      },
      {
        title: "Smart Contract Patterns",
        description: "Common patterns and best practices",
        lessons: [
          {
            title: "Ownable Pattern",
            content: `# Ownable Pattern

Most contracts need an owner/admin. Here's how to implement it.

## Basic Implementation

\`\`\`solidity
contract Ownable {
    address public owner;
    
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );
    
    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not owner");
        _;
    }
    
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Ownable: zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    function renounceOwnership() public onlyOwner {
        emit OwnershipTransferred(owner, address(0));
        owner = address(0);
    }
}
\`\`\`

## Using OpenZeppelin

Don't reinvent the wheel:

\`\`\`solidity
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyContract is Ownable {
    function adminFunction() public onlyOwner {
        // Only owner can call
    }
}
\`\`\`

## Two-Step Transfer

Safer ownership transfer:

\`\`\`solidity
address public pendingOwner;

function transferOwnership(address newOwner) public onlyOwner {
    pendingOwner = newOwner;
}

function acceptOwnership() public {
    require(msg.sender == pendingOwner, "Not pending owner");
    owner = pendingOwner;
    pendingOwner = address(0);
}
\`\`\``,
          },
          {
            title: "Reentrancy Protection",
            content: `# Reentrancy Protection

The most dangerous vulnerability in smart contracts.

## The Attack

\`\`\`solidity
// VULNERABLE CONTRACT
contract Vulnerable {
    mapping(address => uint256) public balances;
    
    function withdraw() public {
        uint256 amount = balances[msg.sender];
        
        // Sends ETH - attacker's receive() is called
        (bool success,) = msg.sender.call{value: amount}("");
        require(success);
        
        // Balance updated AFTER sending
        balances[msg.sender] = 0;
    }
}

// ATTACKER
contract Attacker {
    Vulnerable target;
    
    receive() external payable {
        // Called when receiving ETH
        // Balance not yet updated, so can withdraw again!
        if (address(target).balance >= 1 ether) {
            target.withdraw();
        }
    }
}
\`\`\`

## The Fix: Checks-Effects-Interactions

\`\`\`solidity
function withdraw() public {
    uint256 amount = balances[msg.sender];
    
    // CHECK
    require(amount > 0, "No balance");
    
    // EFFECT (update state BEFORE external call)
    balances[msg.sender] = 0;
    
    // INTERACTION (external call LAST)
    (bool success,) = msg.sender.call{value: amount}("");
    require(success);
}
\`\`\`

## ReentrancyGuard

Use OpenZeppelin's solution:

\`\`\`solidity
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Safe is ReentrancyGuard {
    function withdraw() public nonReentrant {
        // Protected from reentrancy
    }
}
\`\`\``,
          },
          {
            title: "Safe Math and Overflow",
            content: `# Safe Math and Overflow

Numbers can overflow. Here's how to handle it.

## The Problem (Pre-0.8.0)

\`\`\`solidity
uint8 max = 255;
max + 1 = 0;  // Overflow! Wraps around

uint8 min = 0;
min - 1 = 255;  // Underflow!
\`\`\`

## Solidity 0.8.0+ Solution

Overflow checks are automatic:

\`\`\`solidity
// Reverts with panic on overflow
uint256 a = type(uint256).max;
uint256 b = a + 1;  // REVERTS
\`\`\`

## Unchecked Math

When you WANT overflow (gas savings):

\`\`\`solidity
unchecked {
    // No overflow checks here
    uint256 i = 0;
    i--;  // Wraps to max value
}
\`\`\`

## Common Use Case: Loop Counter

\`\`\`solidity
// Gas efficient loop
for (uint256 i = 0; i < length;) {
    // Do something
    
    unchecked {
        ++i;  // Can't overflow if length < max
    }
}
\`\`\`

## Best Practices

- Use 0.8.0+ for automatic checks
- Use unchecked only when certain
- Be careful with user inputs
- Test edge cases`,
          },
          {
            title: "ERC Standards Overview",
            content: `# ERC Standards Overview

ERCs (Ethereum Request for Comments) define standard interfaces.

## ERC-20: Fungible Tokens

The standard for tokens like USDC, LINK, UNI:

\`\`\`solidity
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}
\`\`\`

## ERC-721: NFTs

Non-fungible tokens, each unique:

\`\`\`solidity
interface IERC721 {
    function balanceOf(address owner) external view returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
}
\`\`\`

## ERC-1155: Multi-Token

Both fungible and non-fungible in one contract:

\`\`\`solidity
// One contract can have:
// - Token ID 1: 1000 copies (fungible)
// - Token ID 2: 1 copy (NFT)
// - Token ID 3: 500 copies (fungible)
\`\`\`

## Other Important ERCs

- **ERC-2612** - Permit (gasless approvals)
- **ERC-4626** - Tokenized vaults
- **ERC-6551** - NFT-bound accounts
- **ERC-4337** - Account abstraction

Always use battle-tested implementations like OpenZeppelin!`,
          },
        ],
      },
      {
        title: "Testing and Deployment",
        description: "Ship your contracts safely",
        lessons: [
          {
            title: "Writing Tests",
            content: `# Writing Tests

Tests are non-negotiable for smart contracts. Money is at stake.

## Why Test Smart Contracts?

- Bugs can't be fixed after deployment
- Millions of dollars at risk
- Complex interactions
- Edge cases kill

## Testing with Foundry

\`\`\`solidity
// test/Counter.t.sol
import "forge-std/Test.sol";
import "../src/Counter.sol";

contract CounterTest is Test {
    Counter counter;
    
    function setUp() public {
        counter = new Counter();
    }
    
    function test_InitialValue() public {
        assertEq(counter.count(), 0);
    }
    
    function test_Increment() public {
        counter.increment();
        assertEq(counter.count(), 1);
    }
    
    function testFail_DecrementBelowZero() public {
        counter.decrement();  // Should revert
    }
    
    function testFuzz_SetCount(uint256 x) public {
        counter.setCount(x);
        assertEq(counter.count(), x);
    }
}
\`\`\`

## Test Categories

### Unit Tests
Test individual functions in isolation.

### Integration Tests
Test multiple contracts interacting.

### Fuzz Tests
Random inputs to find edge cases.

### Invariant Tests
Properties that must always hold.

## Coverage Goal

Aim for 100% coverage, but remember:
- Coverage != correctness
- Test the logic, not just lines
- Include failure cases`,
          },
          {
            title: "Gas Optimization",
            content: `# Gas Optimization

Every operation costs gas. Let's minimize it.

## Storage is Expensive

\`\`\`solidity
// BAD: Multiple storage reads
function bad() public view returns (uint256) {
    return myValue + myValue + myValue;  // 3 SLOADs
}

// GOOD: Cache in memory
function good() public view returns (uint256) {
    uint256 cached = myValue;  // 1 SLOAD
    return cached + cached + cached;
}
\`\`\`

## Pack Your Structs

\`\`\`solidity
// BAD: 3 storage slots
struct BadUser {
    uint256 id;      // Slot 0
    bool isActive;   // Slot 1
    uint256 balance; // Slot 2
}

// GOOD: 2 storage slots
struct GoodUser {
    uint256 id;      // Slot 0
    uint256 balance; // Slot 1
    bool isActive;   // Slot 1 (packed)
}
\`\`\`

## Use Appropriate Types

\`\`\`solidity
// Consider smaller types if range allows
uint8 status;      // 0-255
uint32 timestamp;  // Until year 2106
uint96 balance;    // Up to 79 billion ETH
\`\`\`

## Short-Circuit Logic

\`\`\`solidity
// Cheaper check first
require(amount > 0 && balances[msg.sender] >= amount);
//        ^ Quick      ^ Storage read
\`\`\`

## More Tips

- Use \`calldata\` instead of \`memory\` for read-only params
- Use \`++i\` instead of \`i++\`
- Avoid unnecessary variables
- Use events instead of storage for logs
- Batch operations when possible`,
          },
          {
            title: "Deployment Best Practices",
            content: `# Deployment Best Practices

Deploying to mainnet is permanent. Be careful.

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] 100% test coverage
- [ ] Internal audit complete
- [ ] External audit (for significant value)
- [ ] Testnet deployment tested
- [ ] Admin keys secured
- [ ] Deployment script tested
- [ ] Verification ready

## Testnet First

Always deploy to testnet before mainnet:

1. **Sepolia** - Ethereum testnet
2. **Base Sepolia** - Base testnet
3. **Local fork** - Test against mainnet state

## Deployment Script (Foundry)

\`\`\`solidity
// script/Deploy.s.sol
import "forge-std/Script.sol";
import "../src/MyContract.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        MyContract myContract = new MyContract();
        
        vm.stopBroadcast();
        
        console.log("Deployed to:", address(myContract));
    }
}
\`\`\`

## Verify Your Contract

\`\`\`bash
forge verify-contract <address> MyContract \\
    --chain base \\
    --etherscan-api-key $ETHERSCAN_KEY
\`\`\`

## Post-Deployment

1. Verify on block explorer
2. Test all functions work
3. Transfer ownership if needed
4. Document the deployment
5. Monitor for issues`,
          },
          {
            title: "Upgradeable Contracts",
            content: `# Upgradeable Contracts

Regular contracts are immutable. But there are patterns for upgrades.

## Why Upgradeable?

- Fix bugs after deployment
- Add features
- Respond to changing requirements

## Proxy Pattern

\`\`\`
User → Proxy → Implementation
         ↓
      Storage
\`\`\`

- Proxy holds storage and ETH
- Implementation has the logic
- Upgrade = point proxy to new implementation

## OpenZeppelin Upgrades

\`\`\`solidity
// Implementation
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract MyContractV1 is Initializable {
    uint256 public value;
    
    // No constructor! Use initializer instead
    function initialize(uint256 _value) public initializer {
        value = _value;
    }
}
\`\`\`

## Storage Layout

CRITICAL: Never change storage order!

\`\`\`solidity
// V1
contract V1 {
    uint256 public a;  // Slot 0
    uint256 public b;  // Slot 1
}

// V2 - CORRECT
contract V2 {
    uint256 public a;  // Slot 0 (same)
    uint256 public b;  // Slot 1 (same)
    uint256 public c;  // Slot 2 (new, at end)
}

// V2 - WRONG (would corrupt b)
contract V2Wrong {
    uint256 public a;
    uint256 public c;  // Now in slot 1!
    uint256 public b;  // Now in slot 2!
}
\`\`\`

## Consider Immutability

Upgradeable contracts:
- Add complexity
- Require trust in admin
- Can introduce bugs

Sometimes immutable is better!`,
          },
        ],
      },
    ],
  },
  {
    title: "Solana Development Fundamentals",
    description:
      "Dive into Solana development with Rust and the Anchor framework. Learn about accounts, programs, and building high-performance dApps on the fastest blockchain.",
    thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
    chapters: [
      {
        title: "Introduction to Solana",
        description: "Understanding Solana's unique architecture",
        lessons: [
          {
            title: "Why Solana?",
            content: `# Why Solana?

Solana takes a different approach to blockchain scalability.

## Speed Comparison

| Blockchain | TPS | Finality |
|-----------|-----|----------|
| Bitcoin | 7 | 60 min |
| Ethereum | 15 | 15 min |
| Solana | 65,000+ | 400ms |

## How Is This Possible?

### Proof of History (PoH)
A cryptographic clock that orders events:
- Validators don't need to communicate for ordering
- Time is built into the blockchain
- Massive parallelization possible

### Tower BFT
Modified PBFT that uses PoH:
- Reduces messaging overhead
- Faster consensus
- Lower validator requirements

### Gulf Stream
Transaction forwarding protocol:
- Transactions sent ahead to validators
- Reduces mempool size
- Faster confirmation

### Turbine
Block propagation protocol:
- Breaks blocks into packets
- Spreads via network tree
- Bandwidth efficient

## Trade-offs

Pros:
- Blazing fast
- Low fees ($0.00025)
- Great UX

Cons:
- Higher hardware requirements
- More centralized
- Network outages have occurred`,
          },
          {
            title: "Solana vs Ethereum Architecture",
            content: `# Solana vs Ethereum Architecture

Fundamental differences in how these chains work.

## Account Model

### Ethereum
\`\`\`
Contract = Code + Storage + Balance
User = Balance only
\`\`\`

### Solana
\`\`\`
Everything is an Account:
- Programs (code, no state)
- Data accounts (state, no code)
- Native accounts (SOL balance)
\`\`\`

## Key Differences

### Programs vs Smart Contracts

**Ethereum:**
- Contract stores its own data
- One deployment = one instance

**Solana:**
- Programs are stateless
- Data stored in separate accounts
- One program, many data accounts

### Execution Model

**Ethereum:**
- Sequential execution
- One transaction at a time
- Global state lock

**Solana:**
- Parallel execution
- Transactions declare accounts upfront
- Non-overlapping transactions run parallel

### Fees

**Ethereum:**
- Gas for computation
- Variable based on demand
- Can be very expensive

**Solana:**
- Fixed per-signature fee
- Priority fees for faster inclusion
- Always cheap (~$0.00025)

## Mental Model Shift

From: "Contract has state"
To: "Program operates on accounts"

This takes getting used to!`,
          },
          {
            title: "Development Environment Setup",
            content: `# Development Environment Setup

Let's get your Solana dev environment ready.

## Install Rust

\`\`\`bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup default stable
rustup update
\`\`\`

## Install Solana CLI

\`\`\`bash
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"

# Add to PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Verify
solana --version
\`\`\`

## Install Anchor

\`\`\`bash
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked

# Verify
anchor --version
\`\`\`

## Configure CLI

\`\`\`bash
# Set to devnet for learning
solana config set --url devnet

# Create a wallet
solana-keygen new

# Get free devnet SOL
solana airdrop 2
\`\`\`

## Your First Project

\`\`\`bash
anchor init my_project
cd my_project
anchor build
anchor test
\`\`\`

## Project Structure

\`\`\`
my_project/
├── programs/           # Rust programs
│   └── my_project/
│       └── src/
│           └── lib.rs
├── tests/              # TypeScript tests
├── migrations/         # Deployment scripts
├── Anchor.toml         # Config
└── package.json
\`\`\``,
          },
        ],
      },
      {
        title: "Solana Programming Model",
        description: "Accounts, programs, and data",
        lessons: [
          {
            title: "Understanding Accounts",
            content: `# Understanding Accounts

Everything on Solana is an account. Master this concept.

## Account Structure

\`\`\`rust
pub struct Account {
    pub lamports: u64,      // Balance (1 SOL = 1B lamports)
    pub data: Vec<u8>,      // Arbitrary data
    pub owner: Pubkey,      // Program that owns this
    pub executable: bool,   // Is this a program?
    pub rent_epoch: u64,    // Rent tracking
}
\`\`\`

## Account Types

### System Accounts
- Owned by System Program
- Hold SOL balance
- Every wallet is a system account

### Program Accounts
- Contain executable code
- Immutable after deployment
- Marked with executable: true

### Data Accounts (PDAs)
- Store program state
- Owned by programs
- Derived deterministically

## Account Ownership

Key rule: **Only the owner can modify data**

\`\`\`
System Program owns → Wallets
Token Program owns → Token accounts
Your Program owns → Your data accounts
\`\`\`

## Creating Accounts

Accounts need rent (SOL deposit):

\`\`\`rust
// Minimum balance for rent exemption
let rent = Rent::get()?;
let space = 100; // bytes
let lamports = rent.minimum_balance(space);
\`\`\`

## Key Insight

Ethereum: "Call contract, it reads/writes its storage"
Solana: "Call program, pass it accounts to read/write"`,
          },
          {
            title: "Program Derived Addresses (PDAs)",
            content: `# Program Derived Addresses (PDAs)

PDAs are Solana's killer feature for program-owned accounts.

## What's a PDA?

An address that:
- Is derived deterministically from seeds
- Has no private key (can't sign)
- Can only be "signed" by the program

## Why PDAs?

- Programs can "own" accounts
- Deterministic addresses (find without storing)
- Cross-program invocation authority

## Deriving PDAs

\`\`\`rust
// Seeds: ["user", user_pubkey]
let (pda, bump) = Pubkey::find_program_address(
    &[b"user", user_pubkey.as_ref()],
    &program_id
);
\`\`\`

The "bump" is a number that makes the PDA fall off the curve (no private key).

## In Anchor

\`\`\`rust
#[derive(Accounts)]
pub struct CreateUser<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8,
        seeds = [b"user", authority.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserData>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}
\`\`\`

## Common PDA Patterns

\`\`\`rust
// User profile: ["user", wallet]
// Game state: ["game", game_id]
// Token vault: ["vault", mint]
// Config: ["config"]
\`\`\`

## Finding PDAs Client-Side

\`\`\`typescript
const [pda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("user"), wallet.publicKey.toBuffer()],
    programId
);
\`\`\``,
          },
          {
            title: "Cross-Program Invocation (CPI)",
            content: `# Cross-Program Invocation (CPI)

Programs can call other programs. This enables composability.

## What is CPI?

Program A calling Program B:

\`\`\`
User → Program A → Program B
                → Program C
\`\`\`

## Simple CPI Example

\`\`\`rust
// Transfer SOL via System Program
let transfer_ix = system_instruction::transfer(
    from_pubkey,
    to_pubkey,
    lamports,
);

invoke(
    &transfer_ix,
    &[from_account, to_account, system_program],
)?;
\`\`\`

## CPI with PDA Signer

PDAs can "sign" for CPIs:

\`\`\`rust
let seeds = &[b"vault", &[bump]];
let signer_seeds = &[&seeds[..]];

invoke_signed(
    &transfer_ix,
    &[vault_account, recipient, system_program],
    signer_seeds,  // PDA signs!
)?;
\`\`\`

## In Anchor

\`\`\`rust
// CPI to token program
let cpi_accounts = Transfer {
    from: ctx.accounts.vault.to_account_info(),
    to: ctx.accounts.recipient.to_account_info(),
    authority: ctx.accounts.vault_authority.to_account_info(),
};

let cpi_program = ctx.accounts.token_program.to_account_info();
let cpi_ctx = CpiContext::new_with_signer(
    cpi_program, 
    cpi_accounts,
    signer_seeds
);

token::transfer(cpi_ctx, amount)?;
\`\`\`

## Security Considerations

- Validate all accounts passed in
- Check program IDs
- Verify PDA derivations
- Be careful with authority`,
          },
        ],
      },
      {
        title: "Building with Anchor",
        description: "The standard framework for Solana",
        lessons: [
          {
            title: "Anchor Program Structure",
            content: `# Anchor Program Structure

Anchor is to Solana what Hardhat is to Ethereum.

## Basic Program

\`\`\`rust
use anchor_lang::prelude::*;

declare_id!("Your11111ProgramId111111111111111111111");

#[program]
pub mod my_program {
    use super::*;
    
    pub fn initialize(ctx: Context<Initialize>, data: u64) -> Result<()> {
        let account = &mut ctx.accounts.my_account;
        account.data = data;
        account.authority = ctx.accounts.authority.key();
        Ok(())
    }
    
    pub fn update(ctx: Context<Update>, new_data: u64) -> Result<()> {
        let account = &mut ctx.accounts.my_account;
        account.data = new_data;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 8 + 32  // discriminator + data + pubkey
    )]
    pub my_account: Account<'info, MyAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(
        mut,
        has_one = authority
    )]
    pub my_account: Account<'info, MyAccount>,
    
    pub authority: Signer<'info>,
}

#[account]
pub struct MyAccount {
    pub data: u64,
    pub authority: Pubkey,
}
\`\`\`

## Key Parts

- **declare_id!** - Your program's address
- **#[program]** - Contains instruction handlers
- **#[derive(Accounts)]** - Account validation
- **#[account]** - Data structure definition`,
          },
          {
            title: "Account Constraints",
            content: `# Account Constraints

Anchor's constraint system handles validation automatically.

## Common Constraints

\`\`\`rust
#[derive(Accounts)]
pub struct MyInstruction<'info> {
    // Initialize new account
    #[account(
        init,
        payer = user,
        space = 8 + MyData::SIZE
    )]
    pub new_account: Account<'info, MyData>,
    
    // Mutable existing account
    #[account(mut)]
    pub mutable_account: Account<'info, MyData>,
    
    // PDA with seeds
    #[account(
        seeds = [b"config", user.key().as_ref()],
        bump
    )]
    pub config: Account<'info, Config>,
    
    // Verify ownership
    #[account(has_one = authority)]
    pub owned_account: Account<'info, OwnedData>,
    
    // Custom constraint
    #[account(
        constraint = data.value > 0 @ MyError::InvalidValue
    )]
    pub data: Account<'info, Data>,
    
    // Close and reclaim rent
    #[account(
        mut,
        close = user
    )]
    pub closing_account: Account<'info, Data>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}
\`\`\`

## Account Types

\`\`\`rust
Account<'info, T>      // Deserialized program account
Signer<'info>          // Must sign transaction
Program<'info, T>      // Executable program
SystemAccount<'info>   // System-owned account
UncheckedAccount<'info> // No validation (dangerous!)
\`\`\`

## Error Handling

\`\`\`rust
#[error_code]
pub enum MyError {
    #[msg("Value must be greater than zero")]
    InvalidValue,
    #[msg("Unauthorized access")]
    Unauthorized,
}
\`\`\``,
          },
          {
            title: "Testing Anchor Programs",
            content: `# Testing Anchor Programs

Anchor makes testing easy with TypeScript.

## Test Setup

\`\`\`typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MyProgram } from "../target/types/my_program";
import { expect } from "chai";

describe("my_program", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    
    const program = anchor.workspace.MyProgram as Program<MyProgram>;
    
    it("initializes account", async () => {
        const myAccount = anchor.web3.Keypair.generate();
        
        await program.methods
            .initialize(new anchor.BN(42))
            .accounts({
                myAccount: myAccount.publicKey,
                authority: provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([myAccount])
            .rpc();
        
        const account = await program.account.myAccount.fetch(
            myAccount.publicKey
        );
        
        expect(account.data.toNumber()).to.equal(42);
    });
    
    it("updates account", async () => {
        // ... similar pattern
    });
});
\`\`\`

## Running Tests

\`\`\`bash
# Run all tests
anchor test

# Run specific test
anchor test --skip-local-validator -- --grep "initializes"
\`\`\`

## Testing PDAs

\`\`\`typescript
const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config"), wallet.publicKey.toBuffer()],
    program.programId
);

await program.methods
    .initializeConfig()
    .accounts({
        config: configPda,
        user: wallet.publicKey,
    })
    .rpc();
\`\`\`

## Best Practices

- Test happy path and errors
- Check account state after transactions
- Test PDA derivations
- Verify constraints work`,
          },
          {
            title: "Deploying to Devnet",
            content: `# Deploying to Devnet

Let's deploy your first Solana program.

## Build Your Program

\`\`\`bash
anchor build
\`\`\`

This creates:
- \`target/deploy/my_program.so\` - The program binary
- \`target/idl/my_program.json\` - Interface definition
- \`target/types/my_program.ts\` - TypeScript types

## Get Your Program ID

\`\`\`bash
solana address -k target/deploy/my_program-keypair.json
\`\`\`

Update \`declare_id!\` in your program and \`Anchor.toml\`.

## Fund Deployment Wallet

\`\`\`bash
solana airdrop 5 --url devnet
\`\`\`

## Deploy

\`\`\`bash
anchor deploy --provider.cluster devnet
\`\`\`

## Verify Deployment

\`\`\`bash
solana program show <PROGRAM_ID> --url devnet
\`\`\`

## Interacting Post-Deploy

\`\`\`typescript
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import idl from "./idl.json";

const connection = new Connection("https://api.devnet.solana.com");
const programId = new PublicKey("Your...ProgramId");

const program = new Program(idl, programId, provider);

// Call your program
await program.methods
    .initialize(42)
    .accounts({ ... })
    .rpc();
\`\`\`

## Upgrade Programs

Solana programs can be upgraded (if authority set):

\`\`\`bash
anchor upgrade target/deploy/my_program.so \\
    --program-id <PROGRAM_ID> \\
    --provider.cluster devnet
\`\`\`

Make program immutable when ready:

\`\`\`bash
solana program set-upgrade-authority <PROGRAM_ID> --final
\`\`\``,
          },
        ],
      },
    ],
  },
  {
    title: "Learn Everything About DAOs",
    description:
      "Master Decentralized Autonomous Organizations from concept to creation. Understand governance, treasury management, voting mechanisms, and how to participate in or launch your own DAO.",
    thumbnail: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80",
    chapters: [
      {
        title: "DAO Fundamentals",
        description: "Understanding decentralized governance",
        lessons: [
          {
            title: "What is a DAO?",
            content: `# What is a DAO?

DAO = Decentralized Autonomous Organization

## The Simple Definition

A DAO is an internet-native organization where:
- Rules are encoded in smart contracts
- Members vote on decisions
- Treasury is controlled by code
- No traditional management hierarchy

## Traditional Org vs DAO

| Traditional | DAO |
|------------|-----|
| CEO makes decisions | Token holders vote |
| Legal contracts | Smart contracts |
| Bank account | On-chain treasury |
| Employees | Contributors |
| Shareholders | Token holders |
| Slow changes | Proposals executed automatically |

## Why DAOs Matter

### Trustless Coordination
Rules enforced by code, not promises.

### Global by Default
Anyone worldwide can participate.

### Transparent
All proposals, votes, treasury visible.

### Aligned Incentives
Token holders benefit from good decisions.

## DAO Examples

- **MakerDAO** - Governs DAI stablecoin
- **Uniswap** - Protocol governance
- **ENS** - Domain name governance
- **Nouns** - NFT community treasury
- **Gitcoin** - Public goods funding
- **Constitution DAO** - Attempted to buy Constitution`,
          },
          {
            title: "Types of DAOs",
            content: `# Types of DAOs

DAOs come in many flavors. Here are the main categories.

## Protocol DAOs

Govern DeFi protocols:
- MakerDAO (stablecoin)
- Aave (lending)
- Uniswap (DEX)
- Compound (lending)

Members vote on:
- Protocol parameters
- Fee structures
- Treasury allocation
- Upgrades

## Investment DAOs

Pool capital for investments:
- MetaCartel Ventures
- The LAO
- Flamingo DAO (NFTs)
- PleasrDAO

Members vote on:
- What to invest in
- Exit strategies
- New member admission

## Collector DAOs

Acquire and manage assets:
- Constitution DAO
- Nouns DAO
- APE DAO
- FlamingoDAO

Focus on:
- Art and NFTs
- Cultural assets
- Shared experiences

## Service DAOs

Provide services:
- RaidGuild (dev work)
- LexDAO (legal)
- MetaFactory (merch)

Organized around:
- Freelancer coordination
- Revenue sharing
- Reputation

## Social DAOs

Community focused:
- Friends With Benefits (FWB)
- Cabin
- Seed Club

Value:
- Networking
- Events
- Shared identity`,
          },
          {
            title: "DAO Governance Models",
            content: `# DAO Governance Models

How decisions get made varies by DAO.

## Token-Based Voting

Most common model:
- 1 token = 1 vote
- More tokens = more influence
- Simple to understand

**Pros:** Clear, measurable
**Cons:** Plutocracy risk, whale dominance

## Quadratic Voting

Vote cost increases quadratically:
- 1 vote = 1 token
- 2 votes = 4 tokens
- 3 votes = 9 tokens

**Pros:** Reduces whale power
**Cons:** Sybil attack risk

## Conviction Voting

Votes accumulate over time:
- Longer you vote, stronger it gets
- Rewards long-term alignment
- Used by Gitcoin

**Pros:** Less reactive
**Cons:** Slow for urgent decisions

## Optimistic Governance

Proposals pass unless vetoed:
- Submit proposal
- Wait period (e.g., 7 days)
- Passes if no objection
- Used by Nouns

**Pros:** Efficient
**Cons:** Requires active monitoring

## Multi-sig

Small group holds keys:
- 3-of-5, 5-of-9 signatures
- Faster decisions
- Used alongside token voting

**Pros:** Quick execution
**Cons:** Centralization risk

## Choosing a Model

Consider:
- Speed requirements
- Token distribution
- Attack vectors
- Community values`,
          },
          {
            title: "Token Economics for DAOs",
            content: `# Token Economics for DAOs

Tokens align incentives. Design matters.

## Token Functions

### Governance Rights
- Voting on proposals
- Delegation to others
- Proposal creation

### Economic Rights
- Treasury claims
- Revenue share
- Staking rewards

### Access Rights
- Gated channels
- Member benefits
- Special features

## Distribution Methods

### Fair Launch
- No pre-mine
- Equal opportunity
- Examples: YFI, Loot

### Airdrop
- Distribute to users
- Reward early adopters
- Build community

### Token Sale
- Raise capital
- Price discovery
- Regulatory concerns

### Liquidity Mining
- Reward protocol usage
- Bootstrap liquidity
- Mercenary capital risk

## Supply Dynamics

### Fixed Supply
- Bitcoin model
- Predictable
- Potentially deflationary

### Inflationary
- Ongoing distribution
- Fund development
- Dilutes holders

### Burn Mechanisms
- Reduce supply over time
- Fee burns
- Creates scarcity

## Vesting

Prevent dumps:
- Team tokens vest over time
- Cliff period (e.g., 1 year)
- Linear unlock (e.g., 4 years)

## Common Mistakes

- Too much to team
- No lockup periods
- Concentrated whales
- Unclear utility`,
          },
        ],
      },
      {
        title: "DAO Operations",
        description: "Running a DAO day-to-day",
        lessons: [
          {
            title: "Treasury Management",
            content: `# Treasury Management

The treasury is a DAO's lifeblood. Manage it well.

## What's in a Treasury?

- Native tokens
- Stablecoins
- Protocol fees
- Investments
- NFTs

## Treasury Strategies

### Conservative
- Mostly stablecoins
- Low risk
- Predictable runway

### Aggressive
- Mostly native token
- High correlation risk
- Potential upside

### Balanced
- Mix of assets
- Diversification
- Moderate risk

## Diversification

Don't hold only your own token:
- Sell some for stables
- Build runway (18-24 months)
- Reduce volatility

Example allocation:
- 40% Native token
- 30% Stablecoins (USDC, DAI)
- 20% ETH
- 10% Other investments

## Spending

Common categories:
- Development (40-60%)
- Marketing (10-20%)
- Operations (10-15%)
- Community (5-10%)
- Reserves (10-20%)

## Multi-sig Security

Treasury held in multi-sig:
- Multiple signers required
- Geographic distribution
- Mix of roles
- Documented procedures

## Tools

- **Gnosis Safe** - Multi-sig standard
- **Parcel** - Treasury management
- **Llama** - Permissions & payments
- **Utopia** - Payroll`,
          },
          {
            title: "Proposal Lifecycle",
            content: `# Proposal Lifecycle

How ideas become actions in a DAO.

## Typical Flow

\`\`\`
Idea → Discussion → Proposal → Vote → Execution
         ↓            ↓          ↓
      Forum        Snapshot   On-chain
\`\`\`

## Stage 1: Discussion

Where: Discord, Forum, Discourse
Purpose:
- Gauge interest
- Get feedback
- Refine idea
- Build support

Duration: Days to weeks

## Stage 2: Temperature Check

Some DAOs do informal polls:
- Discord emoji votes
- Forum polls
- Snapshot signal votes

Not binding, just gauging sentiment.

## Stage 3: Formal Proposal

Standard format:
- **Title** - Clear and concise
- **Summary** - One paragraph
- **Motivation** - Why do this?
- **Specification** - Exact details
- **Budget** - Costs involved
- **Timeline** - Key dates
- **Success Metrics** - How to measure

## Stage 4: Voting

Platforms:
- **Snapshot** - Off-chain, gasless
- **Tally** - On-chain
- **Compound Governor** - On-chain

Parameters:
- Quorum (minimum participation)
- Threshold (% to pass)
- Duration (voting period)

## Stage 5: Execution

If passed:
- Automatic (Governor contract)
- Multi-sig execution
- Timelock delay (security)

## Fail States

Proposals can fail due to:
- Not reaching quorum
- Below threshold
- Vetoed during timelock`,
          },
          {
            title: "Contributor Coordination",
            content: `# Contributor Coordination

DAOs run on contributors. How do you organize them?

## Contributor Types

### Core Contributors
- Full-time equivalent
- Consistent salary
- Deep involvement

### Part-time Contributors
- Specific projects
- Bounty-based
- Flexible commitment

### Community Contributors
- Occasional help
- Tips/small rewards
- Building reputation

## Coordination Mechanisms

### Workstreams/Guilds
Functional groups:
- Development
- Marketing
- Community
- Treasury

Each has:
- Lead/Steward
- Budget
- Autonomy

### Seasons
Time-boxed periods:
- Plan goals
- Allocate budgets
- Review results
- Typical: 3 months

### Bounties
Task-based rewards:
- Clear scope
- Fixed payment
- Open participation

Platforms: Dework, Layer3, Wonderverse

## Compensation

Models:
- **Salary** - Stable, predictable
- **Tokens** - Aligned incentives, volatile
- **Hybrid** - Best of both
- **Retroactive** - Reward after impact

Coordinape:
- Peer-based allocation
- Team distributes tokens
- Recognition by peers

## Challenges

- Unclear accountability
- Free rider problem
- Burnout
- Timezone coordination

## Best Practices

- Clear roles and ownership
- Regular syncs
- Transparent compensation
- Celebrate wins
- Offboard gracefully`,
          },
          {
            title: "Legal Considerations",
            content: `# Legal Considerations

DAOs exist in a legal gray area. Here's what to know.

## The Problem

Traditional law assumes:
- Identifiable parties
- Geographic jurisdiction
- Legal entity

DAOs challenge all three.

## Unincorporated DAOs

Default state:
- General partnership by default
- Unlimited personal liability
- Each member liable for all

Risks:
- Tax obligations unclear
- Can't sign contracts
- Bank accounts difficult
- Regulatory exposure

## Legal Wrappers

### Wyoming DAO LLC
- First US DAO law
- Limited liability
- Smart contract governance recognized
- Must register in Wyoming

### Foundation (Cayman, Switzerland)
- Popular for protocol DAOs
- No shareholders
- Managed by council
- Neutral jurisdiction

### Association (Swiss Verein)
- Membership organization
- Democratic governance
- Non-profit focus

### Unincorporated Nonprofit (UNA)
- US option
- No state filing
- Some liability protection

## Practical Steps

1. **Assess risk** - Size, activities, jurisdiction
2. **Consult lawyers** - DAO-experienced
3. **Choose structure** - Based on needs
4. **Document** - Operating agreement
5. **Comply** - Tax, reporting, etc.

## Token Classification

Tokens might be:
- Securities (investment)
- Utilities (access)
- Governance (voting)

Classification affects:
- Who can hold
- How to sell
- Reporting requirements

## Resources

- a][ (legal education)
- LexDAO (legal engineers)
- Paradigm's "DAOs and the Law"`,
          },
        ],
      },
      {
        title: "Participating in DAOs",
        description: "How to get involved",
        lessons: [
          {
            title: "Finding the Right DAO",
            content: `# Finding the Right DAO

Thousands of DAOs exist. How do you find your fit?

## Discover DAOs

### Directories
- DeepDAO.io - Analytics and rankings
- DAOlist - Curated directory
- Messari - Research reports

### Categories to Explore
- Protocols you use
- Causes you care about
- Skills you have
- Communities you're part of

## Evaluation Criteria

### Mission Alignment
- Do you believe in the purpose?
- Would you contribute for free?
- Long-term vision resonates?

### Activity Level
- Recent proposals?
- Active Discord?
- Regular contributors?

### Treasury Health
- Sufficient runway?
- Diversified?
- Transparent spending?

### Token Distribution
- Concentrated or distributed?
- Team lockups?
- Fair launch?

### Governance Quality
- Participation rates?
- Thoughtful proposals?
- Healthy debate?

## Red Flags

- No activity in months
- Single whale dominance
- Unclear roadmap
- No shipping
- Toxic culture
- Opaque treasury

## Due Diligence Steps

1. Join Discord (lurk first)
2. Read recent proposals
3. Check treasury (Gnosis Safe)
4. Review tokenomics
5. Talk to members
6. Start small before going deep`,
          },
          {
            title: "Contributing to DAOs",
            content: `# Contributing to DAOs

Ready to add value? Here's how.

## Start with Lurking

Before contributing:
- Read Discord history
- Follow governance forum
- Understand culture
- Learn the lingo

## Low-Commitment Entry

### Governance Participation
- Vote on proposals
- Comment thoughtfully
- Share on social media

### Community Help
- Answer questions
- Welcome newcomers
- Report bugs
- Create memes

### Content Creation
- Write threads
- Make videos
- Design graphics
- Translate docs

## Leveling Up

### Join Working Groups
- Attend calls
- Take on small tasks
- Build relationships
- Show reliability

### Bounties
- Complete posted tasks
- Demonstrate skills
- Build portfolio
- Get noticed

### Propose Projects
- Identify needs
- Write proposal
- Request funding
- Deliver results

## Skills in Demand

### Technical
- Smart contract dev
- Frontend/backend
- Security auditing
- Data analysis

### Non-Technical
- Community management
- Content/marketing
- Operations
- Legal/finance

## Building Reputation

- Deliver consistently
- Over-communicate
- Be helpful
- Stay humble
- Think long-term

## Compensation Journey

\`\`\`
Free contribution
    ↓
Bounties ($)
    ↓
Part-time contributor
    ↓
Core contributor
\`\`\``,
          },
          {
            title: "Voting and Delegation",
            content: `# Voting and Delegation

Your tokens, your voice. Use them wisely.

## Why Vote?

- Shape the protocol
- Protect your investment
- Fulfill governance responsibility
- Signal preferences

## Where to Vote

### Snapshot (Off-chain)
- Gas-free voting
- Uses token balance at snapshot
- Not automatically executed
- Most DAOs use this

### On-chain (Tally, etc.)
- Costs gas
- Binding execution
- More secure
- Used for critical votes

## How to Vote Well

### Research the Proposal
- Read full text
- Understand implications
- Check discussion
- Who supports/opposes?

### Consider Trade-offs
- Short vs long term
- Different stakeholders
- Precedent setting?

### Vote Your Conviction
- Don't follow whales blindly
- Abstain if unsure
- It's okay to vote no

## Delegation

Don't have time? Delegate!

### What is Delegation?
- Transfer voting power
- Keep your tokens
- Can reclaim anytime
- Delegate votes for you

### Choosing a Delegate

Look for:
- Alignment with your values
- Active participation
- Track record
- Transparency

### Being a Delegate

Responsibilities:
- Vote consistently
- Explain reasoning
- Represent delegators
- Be reachable

Benefits:
- Influence without tokens
- Reputation building
- Career opportunity

## Delegation Platforms

- Snapshot delegation
- Tally delegate profiles
- Karma (delegate scoring)
- Agora (ENS delegation)`,
          },
          {
            title: "Starting Your Own DAO",
            content: `# Starting Your Own DAO

Ready to launch? Here's your roadmap.

## Before You Start

Ask yourself:
- Does this need a DAO?
- Could a company work better?
- Do you have initial community?
- What's the governance philosophy?

## Step 1: Define the Mission

Clear and compelling:
- What problem are you solving?
- Who are the stakeholders?
- What's the long-term vision?

## Step 2: Design Tokenomics

Decide on:
- Total supply
- Distribution (community, team, treasury)
- Vesting schedules
- Utility and governance rights

## Step 3: Choose Tools

### Treasury
- Gnosis Safe (multi-sig)

### Governance
- Snapshot (voting)
- Discourse (forum)
- Commonwealth (all-in-one)

### Communication
- Discord (community)
- Telegram (announcements)

### Coordination
- Notion (docs)
- Dework (tasks)
- Coordinape (rewards)

## Step 4: Create Governance Framework

Document:
- Proposal process
- Voting parameters
- Quorum requirements
- Execution process

## Step 5: Build Community

Before launch:
- Core contributor team
- Discord community
- Twitter presence
- Early believers

## Step 6: Launch

Options:
- Token airdrop
- Fair launch
- Gradual decentralization
- Season 0 (beta)

## Step 7: Iterate

DAOs evolve:
- Listen to feedback
- Experiment with governance
- Improve processes
- Grow the community

## Common Mistakes

- Launching too early
- Over-engineering governance
- Concentrating power
- Ignoring legal
- Poor communication

---

Congratulations! You now have a comprehensive understanding of DAOs. Whether you're joining, contributing to, or starting a DAO, you have the knowledge to participate effectively in this new form of human coordination.`,
          },
        ],
      },
    ],
  },
];

async function seed() {
  console.log("Seeding free courses...\n");

  let skolaUser = await db.query.users.findFirst({
    where: eq(users.address, SKOLA_ADDRESS),
  });

  if (!skolaUser) {
    console.log("Creating Skola user...");
    const [newUser] = await db
      .insert(users)
      .values({
        address: SKOLA_ADDRESS,
        username: "Skola",
        avatar: SKOLA_AVATAR,
        bio: "Official Skola courses to help you learn Web3 development and blockchain fundamentals.",
        isCreator: true,
        creatorTier: "elite",
        creatorRegisteredAt: new Date(),
      })
      .returning();
    skolaUser = newUser;
    console.log("Created Skola user:", skolaUser.id);
  } else {
    console.log("Skola user exists:", skolaUser.id);
    if (!skolaUser.avatar) {
      console.log("Updating Skola avatar...");
      await db
        .update(users)
        .set({ avatar: SKOLA_AVATAR })
        .where(eq(users.id, skolaUser.id));
    }
  }

  for (const courseData of FREE_COURSES) {
    const existingCourse = await db.query.courses.findFirst({
      where: eq(courses.title, courseData.title),
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

  const existingStats = await db.query.creatorStats.findFirst({
    where: eq(creatorStats.userId, skolaUser.id),
  });

  const courseCount = FREE_COURSES.length;
  const points = courseCount * 10;

  if (!existingStats) {
    await db.insert(creatorStats).values({
      userId: skolaUser.id,
      coursesCount: courseCount,
      studentsCount: 0,
      totalEarningsUsd: "0",
      points,
    });
  } else {
    await db
      .update(creatorStats)
      .set({
        coursesCount: courseCount,
        points,
        updatedAt: new Date(),
      })
      .where(eq(creatorStats.userId, skolaUser.id));
  }

  console.log("\nDone! Created free courses by Skola.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
