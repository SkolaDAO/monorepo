import "dotenv/config";
import { db } from "../db";
import { categories, courses, courseCategories } from "../db/schema";
import { eq, ilike } from "drizzle-orm";

const CATEGORIES = [
  {
    name: "Blockchain Fundamentals",
    slug: "blockchain-fundamentals",
    description: "Learn the core concepts of blockchain technology, consensus mechanisms, and distributed systems.",
    icon: "cube",
    color: "#3B82F6",
  },
  {
    name: "Smart Contracts",
    slug: "smart-contracts",
    description: "Master smart contract development with Solidity, Vyper, and other languages.",
    icon: "code",
    color: "#8B5CF6",
  },
  {
    name: "DeFi",
    slug: "defi",
    description: "Explore decentralized finance protocols, yield farming, lending, and DEXs.",
    icon: "bank",
    color: "#10B981",
  },
  {
    name: "NFTs & Digital Assets",
    slug: "nfts",
    description: "Create, trade, and understand non-fungible tokens and digital collectibles.",
    icon: "image",
    color: "#F59E0B",
  },
  {
    name: "DAOs & Governance",
    slug: "daos",
    description: "Learn about decentralized autonomous organizations and on-chain governance.",
    icon: "users",
    color: "#EC4899",
  },
  {
    name: "Web3 Development",
    slug: "web3-development",
    description: "Build decentralized applications with React, ethers.js, wagmi, and more.",
    icon: "globe",
    color: "#06B6D4",
  },
  {
    name: "Ethereum",
    slug: "ethereum",
    description: "Deep dive into Ethereum, the EVM, and the Ethereum ecosystem.",
    icon: "diamond",
    color: "#627EEA",
  },
  {
    name: "Solana",
    slug: "solana",
    description: "Build high-performance dApps on Solana with Rust and Anchor.",
    icon: "bolt",
    color: "#14F195",
  },
  {
    name: "Bitcoin",
    slug: "bitcoin",
    description: "Understand Bitcoin, the Lightning Network, and Bitcoin development.",
    icon: "currency",
    color: "#F7931A",
  },
  {
    name: "Layer 2 & Scaling",
    slug: "layer2",
    description: "Explore rollups, sidechains, and scaling solutions like Arbitrum, Optimism, and Base.",
    icon: "layers",
    color: "#FF0420",
  },
  {
    name: "Security & Auditing",
    slug: "security",
    description: "Learn smart contract security, common vulnerabilities, and auditing techniques.",
    icon: "shield",
    color: "#EF4444",
  },
  {
    name: "Trading & Analysis",
    slug: "trading",
    description: "Technical analysis, trading strategies, and market dynamics for crypto.",
    icon: "chart",
    color: "#22C55E",
  },
  {
    name: "Tokenomics",
    slug: "tokenomics",
    description: "Design token economies, understand incentive mechanisms, and value accrual.",
    icon: "coins",
    color: "#A855F7",
  },
  {
    name: "Zero Knowledge",
    slug: "zero-knowledge",
    description: "Explore ZK proofs, ZK-SNARKs, ZK-STARKs, and privacy-preserving technology.",
    icon: "eye-off",
    color: "#6366F1",
  },
  {
    name: "Infrastructure",
    slug: "infrastructure",
    description: "Run nodes, validators, and understand blockchain infrastructure.",
    icon: "server",
    color: "#64748B",
  },
  {
    name: "Gaming & Metaverse",
    slug: "gaming",
    description: "Build blockchain games, virtual worlds, and play-to-earn mechanics.",
    icon: "gamepad",
    color: "#F472B6",
  },
  {
    name: "Identity & Social",
    slug: "identity",
    description: "Decentralized identity, social graphs, and reputation systems.",
    icon: "fingerprint",
    color: "#0EA5E9",
  },
  {
    name: "Legal & Compliance",
    slug: "legal",
    description: "Navigate crypto regulations, compliance, and legal frameworks.",
    icon: "scale",
    color: "#78716C",
  },
  {
    name: "Product & Design",
    slug: "product-design",
    description: "UX/UI design for Web3, wallet experiences, and dApp interfaces.",
    icon: "palette",
    color: "#E879F9",
  },
  {
    name: "Career & Community",
    slug: "career",
    description: "Build your Web3 career, find jobs, and grow in the ecosystem.",
    icon: "briefcase",
    color: "#84CC16",
  },
];

const COURSE_CATEGORY_MAPPING: Record<string, string[]> = {
  "How Blockchain Works": ["blockchain-fundamentals", "ethereum"],
  "Solidity Fundamentals": ["smart-contracts", "ethereum", "web3-development"],
  "Solana Development Fundamentals": ["solana", "web3-development", "smart-contracts"],
  "Learn Everything About DAOs": ["daos", "blockchain-fundamentals", "tokenomics"],
};

async function seed() {
  console.log("Seeding categories...\n");

  for (let i = 0; i < CATEGORIES.length; i++) {
    const categoryData = CATEGORIES[i];

    const existing = await db.query.categories.findFirst({
      where: eq(categories.slug, categoryData.slug),
    });

    if (existing) {
      console.log(`Category "${categoryData.name}" already exists, skipping...`);
      continue;
    }

    await db.insert(categories).values({
      name: categoryData.name,
      slug: categoryData.slug,
      description: categoryData.description,
      icon: categoryData.icon,
      color: categoryData.color,
      order: i + 1,
    });

    console.log(`Created category: ${categoryData.name}`);
  }

  console.log("\nAssigning categories to existing courses...\n");

  for (const [courseTitle, categorySlugs] of Object.entries(COURSE_CATEGORY_MAPPING)) {
    const course = await db.query.courses.findFirst({
      where: ilike(courses.title, `%${courseTitle}%`),
    });

    if (!course) {
      console.log(`Course "${courseTitle}" not found, skipping...`);
      continue;
    }

    for (const slug of categorySlugs) {
      const category = await db.query.categories.findFirst({
        where: eq(categories.slug, slug),
      });

      if (!category) {
        console.log(`  Category "${slug}" not found, skipping...`);
        continue;
      }

      const existing = await db.query.courseCategories.findFirst({
        where: (cc, { and, eq }) =>
          and(eq(cc.courseId, course.id), eq(cc.categoryId, category.id)),
      });

      if (existing) {
        continue;
      }

      await db.insert(courseCategories).values({
        courseId: course.id,
        categoryId: category.id,
      });

      console.log(`  Assigned "${category.name}" to "${course.title}"`);
    }
  }

  console.log("\nDone! Categories seeded.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
