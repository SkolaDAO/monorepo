import "dotenv/config";
import { db } from "./index";
import { users, courses, chapters, lessons, categories, courseCategories, creatorStats } from "./schema";

const SKOLA_ADDRESS = "0x94a42DB1E578eFf403B1644FA163e523803241Fd";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create Skola user
  const [skolaUser] = await db
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
    .onConflictDoNothing()
    .returning();

  const creatorId = skolaUser?.id;
  if (!creatorId) {
    const existing = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.address, SKOLA_ADDRESS),
    });
    if (!existing) throw new Error("Failed to create Skola user");
    console.log("Using existing Skola user:", existing.id);
    await seedCourses(existing.id);
    return;
  }

  console.log("Created Skola user:", creatorId);
  await seedCourses(creatorId);
}

async function seedCourses(creatorId: string) {
  // Create categories
  const [blockchainCat] = await db
    .insert(categories)
    .values({
      name: "Blockchain",
      slug: "blockchain",
      description: "Blockchain fundamentals and concepts",
      icon: "🔗",
      color: "#8B5CF6",
      order: 1,
    })
    .onConflictDoNothing()
    .returning();

  const [devCat] = await db
    .insert(categories)
    .values({
      name: "Development",
      slug: "development",
      description: "Smart contract and dApp development",
      icon: "💻",
      color: "#10B981",
      order: 2,
    })
    .onConflictDoNothing()
    .returning();

  const [marketingCat] = await db
    .insert(categories)
    .values({
      name: "Marketing",
      slug: "marketing",
      description: "Web3 marketing and growth strategies",
      icon: "📈",
      color: "#F59E0B",
      order: 3,
    })
    .onConflictDoNothing()
    .returning();

  const [socialCat] = await db
    .insert(categories)
    .values({
      name: "Social",
      slug: "social",
      description: "Decentralized social networks and protocols",
      icon: "🌐",
      color: "#EC4899",
      order: 4,
    })
    .onConflictDoNothing()
    .returning();

  console.log("Created categories");

  // Course 1: Blockchain Basics
  const [course1] = await db
    .insert(courses)
    .values({
      creatorId,
      title: "Blockchain Fundamentals",
      description: "Master the core concepts of blockchain technology. Learn how distributed ledgers work, understand consensus mechanisms, explore cryptographic principles, and discover why blockchain is revolutionizing industries from finance to supply chain.",
      thumbnail: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800",
      priceUsd: "0",
      isFree: true,
      isPublished: true,
      previewPercentage: 100,
    })
    .returning();

  // Course 1 Chapters & Lessons
  const [ch1_1] = await db.insert(chapters).values({
    courseId: course1.id,
    title: "Introduction to Blockchain",
    description: "Understanding the basics of distributed ledger technology",
    order: 1,
  }).returning();

  await db.insert(lessons).values([
    { chapterId: ch1_1.id, title: "What is Blockchain?", content: `# What is Blockchain?

Blockchain is a **distributed, immutable ledger** that records transactions across a network of computers. Unlike traditional databases controlled by a central authority, blockchain operates on a peer-to-peer network where every participant holds a copy of the entire ledger.

## Key Characteristics

### 1. Decentralization
No single entity controls the network. Instead, thousands of nodes (computers) work together to validate and record transactions.

### 2. Immutability
Once data is recorded on the blockchain, it cannot be altered or deleted. This creates a permanent, tamper-proof record of all transactions.

### 3. Transparency
All transactions are visible to anyone on the network. While identities may be pseudonymous, the transaction history is completely open.

### 4. Security
Blockchain uses advanced cryptography to secure transactions. Each block is cryptographically linked to the previous one, creating an unbreakable chain.

## How It Works

1. A transaction is requested
2. The transaction is broadcast to a network of computers (nodes)
3. Nodes validate the transaction using consensus mechanisms
4. Once verified, the transaction is combined with other transactions to create a new block
5. The new block is added to the existing blockchain
6. The transaction is complete

## Real-World Applications

- **Cryptocurrencies**: Bitcoin, Ethereum, and thousands of other digital currencies
- **DeFi**: Decentralized lending, borrowing, and trading
- **NFTs**: Unique digital ownership certificates
- **Supply Chain**: Tracking products from origin to consumer
- **Healthcare**: Secure medical record sharing
- **Voting**: Tamper-proof election systems`, order: 1, isPreview: true },
    { chapterId: ch1_1.id, title: "History of Blockchain", content: `# The History of Blockchain

## The Pre-Bitcoin Era (1991-2008)

### 1991: The First Concept
Stuart Haber and W. Scott Stornetta introduced the concept of a cryptographically secured chain of blocks. Their goal was to timestamp digital documents so they couldn't be backdated or tampered with.

### 1998: Bit Gold
Nick Szabo designed "Bit Gold," a decentralized digital currency. While never implemented, it's considered a direct precursor to Bitcoin.

### 2004: Reusable Proof of Work
Hal Finney created a system called RPOW (Reusable Proof of Work), introducing concepts that would later be fundamental to Bitcoin.

## The Bitcoin Revolution (2008-2013)

### October 31, 2008: The Bitcoin Whitepaper
A person (or group) using the pseudonym **Satoshi Nakamoto** published "Bitcoin: A Peer-to-Peer Electronic Cash System." This 9-page document outlined a revolutionary new form of digital money.

### January 3, 2009: Genesis Block
The Bitcoin network went live with the mining of the "Genesis Block" (Block 0). Embedded in this block was the message: "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks."

### 2010: First Real-World Transaction
Laszlo Hanyecz paid 10,000 BTC for two pizzas, marking the first known real-world Bitcoin transaction. Today, those coins would be worth hundreds of millions of dollars.

## The Ethereum Era (2013-Present)

### 2013: Ethereum Whitepaper
Vitalik Buterin, then 19 years old, proposed Ethereum—a blockchain that could execute arbitrary code through "smart contracts."

### 2015: Ethereum Launch
Ethereum went live, enabling developers to build decentralized applications (dApps) on its platform. This opened blockchain to far more use cases than just currency.

### 2017: ICO Boom
Initial Coin Offerings exploded in popularity, raising billions of dollars for blockchain projects.

### 2020-2021: DeFi Summer & NFT Explosion
Decentralized Finance protocols and Non-Fungible Tokens captured mainstream attention, bringing millions of new users to blockchain.

### 2022-Present: Institutional Adoption
Major banks, corporations, and even governments began seriously exploring and adopting blockchain technology.`, order: 2, isPreview: true },
  ]);

  const [ch1_2] = await db.insert(chapters).values({
    courseId: course1.id,
    title: "Consensus Mechanisms",
    description: "How blockchains agree on the state of the ledger",
    order: 2,
  }).returning();

  await db.insert(lessons).values([
    { chapterId: ch1_2.id, title: "Proof of Work (PoW)", content: `# Proof of Work (PoW)

Proof of Work is the original consensus mechanism used by Bitcoin and many other cryptocurrencies. It's designed to be computationally expensive to solve but easy to verify.

## How It Works

1. **Transaction Pool**: Pending transactions collect in a mempool
2. **Block Creation**: Miners select transactions and create a candidate block
3. **Hash Puzzle**: Miners must find a number (nonce) that, when combined with block data and hashed, produces a result below a target threshold
4. **Competition**: All miners compete simultaneously to solve the puzzle
5. **Verification**: Other nodes verify the solution instantly
6. **Reward**: The winning miner receives newly created coins plus transaction fees

## The Mining Process

\`\`\`
Block Data + Nonce → Hash Function → Output Hash

Example:
"Block123" + 0 → SHA256 → 8a7f2b...
"Block123" + 1 → SHA256 → 3e9c1a...
"Block123" + 2 → SHA256 → 00002f... ✓ (below target!)
\`\`\`

## Difficulty Adjustment

Bitcoin adjusts mining difficulty every 2,016 blocks (~2 weeks) to maintain a 10-minute block time average. As more miners join:
- Hash rate increases
- Blocks are found faster
- Difficulty increases
- Block time returns to target

## Pros and Cons

### Advantages
- Battle-tested security (15+ years for Bitcoin)
- Truly decentralized (anyone can mine)
- Expensive to attack (51% attacks cost billions)

### Disadvantages
- High energy consumption
- Slow transaction throughput
- Mining centralization in large pools
- Hardware arms race (ASICs)

## Energy Debate

PoW's energy usage is controversial. Consider:
- Bitcoin uses ~120 TWh/year (more than some countries)
- Much mining uses renewable energy (estimates vary: 40-75%)
- Energy cost is what makes the network secure
- Some argue it's justified; others call it wasteful`, order: 1, isPreview: true },
    { chapterId: ch1_2.id, title: "Proof of Stake (PoS)", content: `# Proof of Stake (PoS)

Proof of Stake is a consensus mechanism where validators are chosen to create new blocks based on the amount of cryptocurrency they "stake" as collateral.

## How It Works

1. **Staking**: Validators lock up tokens as collateral
2. **Selection**: The protocol selects a validator to propose the next block
3. **Attestation**: Other validators verify and attest to the block's validity
4. **Finalization**: Once enough attestations are received, the block is finalized
5. **Rewards**: The proposer and attesters receive staking rewards
6. **Slashing**: Malicious validators lose part of their stake

## Selection Methods

### Random Selection
Validators are chosen randomly, weighted by stake amount. More stake = higher probability of selection.

### Coin Age Selection
Combines stake amount with how long coins have been staked. Prevents concentration of power.

### Delegated PoS (DPoS)
Token holders vote for a limited number of delegates who validate blocks. Used by EOS, Tron.

## Ethereum's Transition (The Merge)

In September 2022, Ethereum switched from PoW to PoS:
- Energy usage dropped ~99.95%
- Validators need 32 ETH to run a node
- Annual issuance decreased significantly
- Stakers earn ~4-5% APY

## Staking Requirements

| Network | Minimum Stake | Annual Yield |
|---------|--------------|--------------|
| Ethereum | 32 ETH | 4-5% |
| Cardano | 10 ADA | 4-6% |
| Solana | 0.01 SOL | 6-8% |
| Polkadot | 120 DOT | 14-16% |

## Pros and Cons

### Advantages
- 99%+ more energy efficient than PoW
- Lower barrier to participation
- Better scalability potential
- Economic security through slashing

### Disadvantages
- "Rich get richer" concerns
- Nothing-at-stake problem (theoretical)
- Less battle-tested than PoW
- Complexity in implementation`, order: 2, isPreview: true },
  ]);

  // Course 2: EVM Smart Contracts
  const [course2] = await db
    .insert(courses)
    .values({
      creatorId,
      title: "EVM Smart Contract Development",
      description: "Learn to build, deploy, and secure smart contracts on Ethereum and EVM-compatible chains. From Solidity basics to advanced patterns, testing, and gas optimization.",
      thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800",
      priceUsd: "0",
      isFree: true,
      isPublished: true,
      previewPercentage: 100,
    })
    .returning();

  const [ch2_1] = await db.insert(chapters).values({
    courseId: course2.id,
    title: "Solidity Fundamentals",
    description: "Learn the basics of Solidity programming",
    order: 1,
  }).returning();

  await db.insert(lessons).values([
    { chapterId: ch2_1.id, title: "Introduction to Solidity", content: `# Introduction to Solidity

Solidity is a **statically-typed, contract-oriented programming language** designed for writing smart contracts on the Ethereum Virtual Machine (EVM).

## Your First Smart Contract

\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract HelloWorld {
    string public greeting = "Hello, World!";
    
    function setGreeting(string memory _greeting) public {
        greeting = _greeting;
    }
    
    function getGreeting() public view returns (string memory) {
        return greeting;
    }
}
\`\`\`

## Key Concepts

### 1. License Identifier
\`// SPDX-License-Identifier: MIT\`
Every Solidity file should declare its license.

### 2. Pragma
\`pragma solidity ^0.8.24;\`
Specifies the compiler version. The caret (^) allows minor version updates.

### 3. Contract
Contracts are like classes in OOP. They contain:
- State variables (stored on blockchain)
- Functions (executable code)
- Events (logging)
- Modifiers (reusable conditions)

### 4. Visibility
- \`public\`: Accessible from anywhere
- \`private\`: Only within the contract
- \`internal\`: Contract and derived contracts
- \`external\`: Only from outside the contract

### 5. State Mutability
- \`view\`: Reads but doesn't modify state
- \`pure\`: Neither reads nor modifies state
- (none): Can modify state

## Data Types

### Value Types
\`\`\`solidity
bool isActive = true;
uint256 count = 100;      // Unsigned integer
int256 balance = -50;     // Signed integer
address wallet = 0x123...;
bytes32 hash = keccak256("hello");
\`\`\`

### Reference Types
\`\`\`solidity
string name = "Alice";
bytes data = hex"001234";
uint256[] numbers;
mapping(address => uint256) balances;
\`\`\`

## Development Tools

1. **Remix IDE**: Browser-based IDE (remix.ethereum.org)
2. **Hardhat**: Development framework
3. **Foundry**: Fast Rust-based toolkit
4. **OpenZeppelin**: Secure contract library`, order: 1, isPreview: true },
    { chapterId: ch2_1.id, title: "Variables and Data Types", content: `# Variables and Data Types in Solidity

## State Variables vs Local Variables

### State Variables
Stored permanently on the blockchain. Cost gas to modify.

\`\`\`solidity
contract Storage {
    // State variables
    uint256 public storedNumber;
    address public owner;
    mapping(address => uint256) public balances;
}
\`\`\`

### Local Variables
Exist only during function execution. Stored in memory or stack.

\`\`\`solidity
function calculate() public pure returns (uint256) {
    // Local variables
    uint256 a = 10;
    uint256 b = 20;
    return a + b;
}
\`\`\`

## Integer Types

\`\`\`solidity
// Unsigned integers (0 to 2^n - 1)
uint8 tiny = 255;           // 0 to 255
uint256 big = 2**256 - 1;   // Default uint size

// Signed integers (-2^(n-1) to 2^(n-1) - 1)
int8 small = -128;          // -128 to 127
int256 large = -1000;
\`\`\`

## Address Type

\`\`\`solidity
address wallet = 0x742d35Cc6634C0532925a3b844Bc9e7595f;
address payable recipient = payable(wallet);

// Address members
wallet.balance;              // ETH balance in wei
recipient.transfer(1 ether); // Send ETH (reverts on failure)
recipient.send(1 ether);     // Send ETH (returns bool)
\`\`\`

## Arrays

\`\`\`solidity
// Fixed-size array
uint256[5] fixedArray;

// Dynamic array
uint256[] dynamicArray;

// Array operations
dynamicArray.push(100);      // Add element
dynamicArray.pop();          // Remove last
dynamicArray.length;         // Get length
delete dynamicArray[0];      // Reset to default
\`\`\`

## Mappings

\`\`\`solidity
// Simple mapping
mapping(address => uint256) public balances;

// Nested mapping
mapping(address => mapping(address => uint256)) public allowances;

// Usage
balances[msg.sender] = 100;
allowances[owner][spender] = 50;
\`\`\`

## Structs

\`\`\`solidity
struct User {
    address wallet;
    string name;
    uint256 balance;
    bool isActive;
}

User public alice = User({
    wallet: 0x123...,
    name: "Alice",
    balance: 100,
    isActive: true
});
\`\`\`

## Enums

\`\`\`solidity
enum Status { Pending, Active, Completed, Cancelled }

Status public orderStatus = Status.Pending;

function activate() public {
    orderStatus = Status.Active;
}
\`\`\``, order: 2, isPreview: true },
  ]);

  const [ch2_2] = await db.insert(chapters).values({
    courseId: course2.id,
    title: "Security Best Practices",
    description: "Protect your smart contracts from common vulnerabilities",
    order: 2,
  }).returning();

  await db.insert(lessons).values([
    { chapterId: ch2_2.id, title: "Common Vulnerabilities", content: `# Common Smart Contract Vulnerabilities

## 1. Reentrancy Attacks

The most infamous vulnerability. An attacker calls back into your contract before state is updated.

### Vulnerable Code
\`\`\`solidity
// ❌ VULNERABLE
function withdraw() public {
    uint256 amount = balances[msg.sender];
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success);
    balances[msg.sender] = 0; // State updated AFTER external call
}
\`\`\`

### Secure Code
\`\`\`solidity
// ✅ SECURE - Checks-Effects-Interactions pattern
function withdraw() public {
    uint256 amount = balances[msg.sender];
    balances[msg.sender] = 0; // State updated BEFORE external call
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success);
}

// ✅ Even better - use ReentrancyGuard
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

function withdraw() public nonReentrant {
    // ...
}
\`\`\`

## 2. Integer Overflow/Underflow

Before Solidity 0.8, arithmetic didn't check for overflow.

\`\`\`solidity
// In Solidity < 0.8
uint8 x = 255;
x = x + 1; // x = 0 (overflow!)

uint8 y = 0;
y = y - 1; // y = 255 (underflow!)

// Solidity 0.8+ automatically reverts on overflow
// Use unchecked{} only when you're sure it's safe
\`\`\`

## 3. Access Control Issues

\`\`\`solidity
// ❌ VULNERABLE - Anyone can call
function mint(address to, uint256 amount) public {
    _mint(to, amount);
}

// ✅ SECURE - Only owner can call
function mint(address to, uint256 amount) public onlyOwner {
    _mint(to, amount);
}
\`\`\`

## 4. Front-Running

Attackers watch the mempool and submit transactions with higher gas to execute before yours.

### Mitigation Strategies
- Commit-reveal schemes
- Submarine sends
- Flashbots Protect
- Maximum slippage settings

## 5. Oracle Manipulation

\`\`\`solidity
// ❌ VULNERABLE - Single block price
uint256 price = pair.getReserves();

// ✅ SECURE - Time-weighted average
uint256 price = oracle.consult(token, 1 ether);
\`\`\`

## Security Checklist

- [ ] Use latest Solidity version
- [ ] Follow Checks-Effects-Interactions
- [ ] Implement access control
- [ ] Use OpenZeppelin contracts
- [ ] Get professional audits
- [ ] Test with fuzzing
- [ ] Start with small amounts
- [ ] Have an emergency pause`, order: 1, isPreview: true },
  ]);

  // Course 3: Web3 Marketing
  const [course3] = await db
    .insert(courses)
    .values({
      creatorId,
      title: "Web3 Marketing & Growth",
      description: "Master the unique strategies for marketing in the decentralized world. Learn community building, token launches, influencer partnerships, and growth hacking for crypto projects.",
      thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
      priceUsd: "0",
      isFree: true,
      isPublished: true,
      previewPercentage: 100,
    })
    .returning();

  const [ch3_1] = await db.insert(chapters).values({
    courseId: course3.id,
    title: "Community Building",
    description: "Build and nurture a thriving Web3 community",
    order: 1,
  }).returning();

  await db.insert(lessons).values([
    { chapterId: ch3_1.id, title: "Discord & Telegram Strategy", content: `# Discord & Telegram Strategy for Web3 Projects

## Why Community Platforms Matter

In Web3, your community IS your product. Unlike Web2 where users are customers, Web3 users are stakeholders, ambassadors, and contributors.

## Discord Setup

### Essential Channels
\`\`\`
📢 ANNOUNCEMENTS
├── #announcements (read-only)
├── #partnerships
└── #governance-updates

💬 GENERAL
├── #general-chat
├── #introductions
├── #memes

💡 PROJECT
├── #roadmap
├── #feedback
├── #bug-reports

🎓 EDUCATION
├── #tutorials
├── #faq
└── #resources

🔧 SUPPORT
├── #support-tickets
└── #troubleshooting
\`\`\`

### Bot Setup
1. **MEE6 or Carl-bot**: Moderation & leveling
2. **Collab.Land**: Token-gated access
3. **Guild.xyz**: Advanced role management
4. **Sesh**: Event scheduling
5. **Degen Bot**: Tipping system

### Engagement Tactics
- Weekly AMAs with founders
- Community calls (Twitter Spaces)
- Meme contests with prizes
- Contributor recognition programs
- Exclusive alpha channels

## Telegram Strategy

### Group Structure
- **Main Group**: Open discussion
- **Announcements Channel**: One-way updates
- **Alpha Group**: Token-gated for holders
- **Regional Groups**: Localized communities

### Best Practices
- Anti-spam bots (Combot, Rose)
- Clear rules pinned message
- Active admins across time zones
- No price discussion channels
- Welcome message automation

## Metrics to Track

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| DAU/MAU | >30% | Community health |
| Messages/day | Growing | Engagement level |
| New members/week | Steady growth | Acquisition |
| Retention rate | >60% | Stickiness |
| Support response time | <2 hours | User satisfaction |

## Common Mistakes

1. ❌ Shilling in other communities
2. ❌ Ignoring negative feedback
3. ❌ Over-moderating discussions
4. ❌ Promising unrealistic timelines
5. ❌ Neglecting non-English speakers`, order: 1, isPreview: true },
    { chapterId: ch3_1.id, title: "Twitter/X Growth Tactics", content: `# Twitter/X Growth Tactics for Web3

## Why Twitter Dominates Web3

Twitter is the town square of crypto. Breaking news, alpha, community building—it all happens here.

## Profile Optimization

### Bio Formula
\`\`\`
[Role] at @Project | [Expertise] | [Personality trait] | [CTA]

Example:
"Co-founder @CoolDAO | Building the future of X | 🎯 DMs open for collabs"
\`\`\`

### Essential Elements
- Professional PFP (or high-quality NFT)
- Banner showcasing project
- Pinned tweet with project intro
- Link to Discord/website
- Location: "Web3" or "gm.eth"

## Content Strategy

### The 4-3-2-1 Rule (per week)
- **4** Educational threads
- **3** Engagement posts (polls, questions)
- **2** Personal/behind-the-scenes
- **1** Direct promotion

### Thread Formula
\`\`\`
🧵 Hook (1/X)

[Provocative statement or question]

Why does this matter? Let me explain 👇

(2-10) Body content with:
- Clear points
- Examples
- Data when possible
- Screenshots/images

(Final) Summary + CTA
"If you found this valuable:
1. Follow @handle for more
2. RT the first tweet
3. Drop a 🔥 if you want part 2"
\`\`\`

### Best Posting Times
- **Peak hours**: 8-10 AM EST, 12-2 PM EST, 8-10 PM EST
- **Crypto Twitter**: Active 24/7 but US hours dominate
- **Consistency > Timing**: Post daily at similar times

## Engagement Tactics

### Building Relationships
1. Reply to big accounts with value-add comments
2. Quote tweet with your take
3. Join Twitter Spaces as speaker
4. Create lists of key accounts
5. DM networking (don't pitch immediately)

### Growth Hacks
- Ride trending hashtags
- React quickly to news
- Create memes about market moves
- Collaborate on threads
- Host Spaces with other projects

## Analytics to Track

- Impressions growth
- Profile visits
- Follower growth rate
- Engagement rate (aim for >3%)
- Link clicks

## What NOT to Do

1. ❌ Buying followers
2. ❌ Engagement pods (Twitter detects them)
3. ❌ Posting only promotional content
4. ❌ Ignoring comments/mentions
5. ❌ Getting into public fights`, order: 2, isPreview: true },
  ]);

  // Course 4: DeFi Development
  const [course4] = await db
    .insert(courses)
    .values({
      creatorId,
      title: "DeFi Protocol Development",
      description: "Build decentralized finance applications from scratch. Learn about AMMs, lending protocols, yield farming, and composability in the DeFi ecosystem.",
      thumbnail: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800",
      priceUsd: "0",
      isFree: true,
      isPublished: true,
      previewPercentage: 100,
    })
    .returning();

  const [ch4_1] = await db.insert(chapters).values({
    courseId: course4.id,
    title: "DeFi Fundamentals",
    description: "Understanding decentralized finance primitives",
    order: 1,
  }).returning();

  await db.insert(lessons).values([
    { chapterId: ch4_1.id, title: "What is DeFi?", content: `# What is DeFi?

**Decentralized Finance (DeFi)** is a blockchain-based financial ecosystem that operates without traditional intermediaries like banks, brokerages, or exchanges.

## Traditional Finance vs DeFi

| Aspect | Traditional Finance | DeFi |
|--------|-------------------|------|
| Access | Bank account required | Just a wallet |
| KYC | Always required | Usually none |
| Operating hours | Business hours | 24/7/365 |
| Custody | Institution holds funds | You hold your keys |
| Transparency | Opaque | Fully auditable |
| Composability | Siloed | Lego-like building blocks |
| Settlement | Days | Seconds to minutes |

## Core DeFi Primitives

### 1. Decentralized Exchanges (DEXs)
Swap tokens without a centralized order book.
- **Uniswap**: AMM pioneer
- **Curve**: Stablecoin optimized
- **dYdX**: Perpetuals trading

### 2. Lending/Borrowing
Supply assets to earn interest, or borrow against collateral.
- **Aave**: Multi-chain lending
- **Compound**: cToken model
- **MakerDAO**: DAI stablecoin

### 3. Stablecoins
Crypto assets pegged to fiat currencies.
- **USDC**: Centralized, fiat-backed
- **DAI**: Decentralized, crypto-backed
- **FRAX**: Algorithmic-fractional

### 4. Liquid Staking
Stake ETH while maintaining liquidity.
- **Lido**: stETH
- **Rocket Pool**: rETH
- **Frax**: sfrxETH

### 5. Yield Aggregators
Auto-compound yields across protocols.
- **Yearn**: Vaults
- **Convex**: Curve optimization
- **Beefy**: Multi-chain

## Key Metrics

### Total Value Locked (TVL)
Amount of assets deposited in DeFi protocols.
- Peak: ~$180B (Nov 2021)
- Current: ~$50B (varies)

### Protocol Revenue
Fees generated by the protocol.

### Token Incentives
Rewards distributed to users (often unsustainable).

## Risks in DeFi

### Smart Contract Risk
Code bugs can lead to lost funds. Always check:
- Audit reports
- Bug bounties
- Time in production

### Economic/Oracle Risk
- Flash loan attacks
- Oracle manipulation
- Liquidity crises

### Regulatory Risk
- Unclear legal status
- Potential enforcement actions
- Tax implications

## Getting Started

1. Set up MetaMask or similar wallet
2. Bridge funds to desired chain
3. Start with established protocols
4. Never invest more than you can lose
5. Learn to read Etherscan`, order: 1, isPreview: true },
    { chapterId: ch4_1.id, title: "Automated Market Makers", content: `# Automated Market Makers (AMMs)

AMMs revolutionized decentralized trading by replacing order books with mathematical formulas.

## The Constant Product Formula

Uniswap's breakthrough: **x * y = k**

Where:
- x = quantity of token A
- y = quantity of token B
- k = constant (liquidity)

### Example
Pool: 100 ETH × 200,000 USDC = 20,000,000 (k)

To buy 10 ETH:
\`\`\`
(100 - 10) × y = 20,000,000
90 × y = 20,000,000
y = 222,222 USDC

Cost: 222,222 - 200,000 = 22,222 USDC
Price: 2,222.2 USDC/ETH (vs 2,000 initial)
\`\`\`

The larger the trade relative to liquidity, the higher the price impact.

## Providing Liquidity

\`\`\`solidity
// Simplified LP deposit
function addLiquidity(
    uint256 amountA,
    uint256 amountB
) external returns (uint256 liquidity) {
    // Transfer tokens to pool
    tokenA.transferFrom(msg.sender, address(this), amountA);
    tokenB.transferFrom(msg.sender, address(this), amountB);
    
    // Mint LP tokens proportional to contribution
    liquidity = Math.sqrt(amountA * amountB);
    _mint(msg.sender, liquidity);
}
\`\`\`

## Impermanent Loss

When you provide liquidity, you're exposed to **impermanent loss** if prices diverge.

### IL Formula
\`\`\`
IL = 2 * sqrt(priceRatio) / (1 + priceRatio) - 1

Price 2x → IL = 5.7%
Price 3x → IL = 13.4%
Price 4x → IL = 20.0%
Price 5x → IL = 25.5%
\`\`\`

### When is IL "Permanent"?
- You withdraw at a different ratio than deposit
- The loss only "realizes" when you exit

### Mitigating IL
- Provide liquidity to correlated pairs (ETH/stETH)
- Use concentrated liquidity (Uniswap V3)
- Factor in trading fee earnings
- Consider IL protection protocols

## AMM Innovations

### Uniswap V2
- Any ERC20 pair
- Flash swaps
- Price oracles (TWAP)

### Uniswap V3
- Concentrated liquidity
- Multiple fee tiers
- NFT LP positions

### Curve
- StableSwap invariant
- Lower slippage for pegged assets
- Gauge system for emissions

### Balancer
- Multi-token pools
- Custom weights (not just 50/50)
- Smart Order Router

## Building a Simple AMM

\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SimpleAMM {
    IERC20 public tokenA;
    IERC20 public tokenB;
    
    uint256 public reserveA;
    uint256 public reserveB;
    
    function swap(
        address tokenIn,
        uint256 amountIn
    ) external returns (uint256 amountOut) {
        bool isTokenA = tokenIn == address(tokenA);
        
        (uint256 resIn, uint256 resOut) = isTokenA 
            ? (reserveA, reserveB) 
            : (reserveB, reserveA);
        
        // x * y = k formula
        amountOut = (amountIn * resOut) / (resIn + amountIn);
        
        // Apply 0.3% fee
        amountOut = amountOut * 997 / 1000;
        
        // Execute swap...
    }
}
\`\`\``, order: 2, isPreview: true },
  ]);

  // Course 5: Web3 Social Networks
  const [course5] = await db
    .insert(courses)
    .values({
      creatorId,
      title: "Decentralized Social Networks",
      description: "Explore the future of social media with Web3. Learn about Farcaster, Lens Protocol, decentralized identity, and building social applications on blockchain.",
      thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800",
      priceUsd: "0",
      isFree: true,
      isPublished: true,
      previewPercentage: 100,
    })
    .returning();

  const [ch5_1] = await db.insert(chapters).values({
    courseId: course5.id,
    title: "The Social Graph",
    description: "Understanding decentralized social protocols",
    order: 1,
  }).returning();

  await db.insert(lessons).values([
    { chapterId: ch5_1.id, title: "Why Decentralized Social?", content: `# Why Decentralized Social Networks?

## The Problem with Web2 Social

### Platform Risk
- Account suspensions without recourse
- Shadowbanning and algorithmic suppression
- Complete data loss if platform shuts down
- Terms of service changes

### Data Exploitation
- You are the product
- Data sold to advertisers
- No ownership of your content
- Privacy violations

### Creator Economy Issues
- Platforms take 30-50% of creator earnings
- Algorithmic distribution favors engagement bait
- No portability of followers
- Demonetization without explanation

## The Web3 Social Promise

### True Ownership
- **Your followers are yours**: Stored on-chain, portable anywhere
- **Your content is yours**: Can't be deleted by platforms
- **Your identity is yours**: Self-sovereign, not rented

### Aligned Incentives
- Users and platforms share upside
- Token rewards for quality content
- Community governance of rules
- No extractive middlemen

### Interoperability
- Post once, distribute everywhere
- Apps compete on UX, not network effects
- Mix and match components
- Composable social primitives

## Current Landscape

### Farcaster
- Sufficiently decentralized protocol
- Ethereum-based identity
- Frames for interactive content
- Fastest growing Web3 social

### Lens Protocol
- Built on Polygon
- Profile NFTs
- Follow/collect mechanics
- Multiple client apps

### Bluesky
- AT Protocol
- Federated architecture
- Domain-based identity
- Twitter-like UX

### Nostr
- Simple protocol
- Relay-based distribution
- Bitcoin/Lightning integration
- Highly censorship resistant

## Challenges

### The Cold Start Problem
- Network effects favor incumbents
- Hard to bootstrap social graphs
- "All my friends are on Twitter"

### UX Friction
- Wallet requirements
- Gas fees (on some networks)
- Key management complexity

### Moderation
- Who decides what's allowed?
- Illegal content concerns
- Spam and bot armies

### Sustainability
- How do protocols fund development?
- Token inflation concerns
- Regulatory uncertainty`, order: 1, isPreview: true },
    { chapterId: ch5_1.id, title: "Building on Farcaster", content: `# Building on Farcaster

Farcaster is the leading decentralized social protocol with over 500k users and a vibrant developer ecosystem.

## Architecture Overview

\`\`\`
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Clients   │────▶│    Hubs     │────▶│  Ethereum   │
│ (Warpcast)  │     │  (Storage)  │     │  (Identity) │
└─────────────┘     └─────────────┘     └─────────────┘
\`\`\`

- **Clients**: User-facing apps (Warpcast, Supercast, etc.)
- **Hubs**: Decentralized storage nodes
- **Ethereum**: On-chain identity registry

## Key Concepts

### FID (Farcaster ID)
Unique identifier registered on-chain. Think of it as your Web3 social security number.

### Casts
The equivalent of tweets. Stored on Hubs, signed by your key.

### Frames
Interactive mini-apps embedded in casts. Can trigger transactions, display dynamic content, create polls, and more.

## Building a Frame

\`\`\`typescript
// Basic Frame response
import { Frog } from 'frog';

const app = new Frog();

app.frame('/', (c) => {
  const { buttonValue, status } = c;
  
  return c.res({
    image: (
      <div style={{ color: 'white', fontSize: 60 }}>
        {status === 'response'
          ? \`You clicked: \${buttonValue}\`
          : 'Welcome to my Frame!'}
      </div>
    ),
    intents: [
      <Button value="apple">🍎 Apple</Button>,
      <Button value="banana">🍌 Banana</Button>,
      <Button.Transaction target="/mint">Mint NFT</Button.Transaction>,
    ],
  });
});
\`\`\`

## Popular Frame Use Cases

### 1. Minting
Let users mint NFTs directly in their feed.

### 2. Polls & Voting
On-chain polls with verifiable results.

### 3. Games
Simple games like rock-paper-scissors, prediction markets.

### 4. Tipping
Send tokens to creators with one click.

### 5. Authentication
Sign in with Farcaster for apps.

## APIs and Tools

### Neynar
The go-to API provider for Farcaster data.
\`\`\`typescript
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

const client = new NeynarAPIClient(API_KEY);

// Get user profile
const user = await client.lookupUserByFid(3);

// Get user's casts
const casts = await client.fetchAllCastsCreatedByUser(3);

// Post a cast
await client.publishCast(signerUuid, "Hello Farcaster!");
\`\`\`

### Pinata
Hub hosting and Frame hosting services.

### Airstack
Cross-protocol social graph queries.

## Best Practices

1. **Start simple**: Basic frames before complex apps
2. **Mobile-first**: Most users on Warpcast mobile
3. **Fast responses**: Frames timeout after 5 seconds
4. **Clear CTAs**: Users should know what buttons do
5. **Test thoroughly**: Use frame validators before deploying

## Resources

- [Farcaster Docs](https://docs.farcaster.xyz)
- [Frog Framework](https://frog.fm)
- [Neynar API](https://neynar.com)
- [/fc-devs channel](https://warpcast.com/~/channel/fc-devs)`, order: 2, isPreview: true },
  ]);

  // Link courses to categories
  if (blockchainCat) {
    await db.insert(courseCategories).values([
      { courseId: course1.id, categoryId: blockchainCat.id },
      { courseId: course4.id, categoryId: blockchainCat.id },
    ]).onConflictDoNothing();
  }

  if (devCat) {
    await db.insert(courseCategories).values([
      { courseId: course2.id, categoryId: devCat.id },
      { courseId: course4.id, categoryId: devCat.id },
      { courseId: course5.id, categoryId: devCat.id },
    ]).onConflictDoNothing();
  }

  if (marketingCat) {
    await db.insert(courseCategories).values([
      { courseId: course3.id, categoryId: marketingCat.id },
    ]).onConflictDoNothing();
  }

  if (socialCat) {
    await db.insert(courseCategories).values([
      { courseId: course5.id, categoryId: socialCat.id },
    ]).onConflictDoNothing();
  }

  // Create creator stats for Skola
  await db.insert(creatorStats).values({
    userId: creatorId,
    coursesCount: 5,
    studentsCount: 0,
    totalEarningsUsd: "0",
    points: 1000,
  }).onConflictDoNothing();

  console.log("✅ Created 5 courses with chapters and lessons");
  console.log("✅ Seeding complete!");
}

seed()
  .catch(console.error)
  .finally(() => process.exit());
