# Skola

Decentralized course marketplace. Creators keep 92%. Pay once, publish forever.

## Structure

```
├── apps/
│   ├── api/           # Backend API (Hono + PostgreSQL + Drizzle)
│   ├── docs/          # VitePress documentation site
│   ├── web/           # Marketing website
│   └── platform/      # Main app (React + RainbowKit)
├── packages/
│   ├── ui/            # Shared UI components (@skola/ui)
│   └── contracts/     # Foundry smart contracts
├── Dockerfile         # Railway deployment
└── railway.toml       # Railway config
```

## Development

```bash
# Install dependencies
pnpm install

# Run all apps
pnpm dev

# Run individually
pnpm dev:api       # Backend API (port 3001)
pnpm dev:platform  # Main app (port 5174)
pnpm dev:docs      # Documentation (port 5173)
pnpm dev:web       # Marketing site (port 5175)

# Database
pnpm db:generate   # Generate migrations
pnpm db:migrate    # Run migrations
pnpm db:push       # Push schema changes
pnpm db:studio     # Open Drizzle Studio

# Build
pnpm build
```

## Smart Contracts

```bash
cd packages/contracts

# Run tests
forge test

# Deploy to Base Sepolia
forge script script/Deploy.s.sol --rpc-url base_sepolia --broadcast --verify
```

## Key Features

- **One-time payment** - $10/$50/$200 tiers, no recurring fees
- **92% revenue share** - Creators keep the majority
- **Protected video hosting** - Bunny Stream with signed URLs
- **Built-in chat** - Community chat per course + creator DMs
- **Real-time notifications** - Purchase alerts, messages
- **Referral system** - Earn 3% on referred purchases
- **Course previews** - 5% of content free before purchase
- **Early supporter airdrop** - ETH/USDC payers get tokens at launch
- **Built on Base** - Low fees, fast transactions

## Environment Variables

### API (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/skola
JWT_SECRET=your-secret-key-min-32-chars
RPC_URL=https://base-sepolia.g.alchemy.com/v2/your-key
BUNNY_STREAM_LIBRARY_ID=your-library-id
BUNNY_STREAM_API_KEY=your-api-key
BUNNY_STREAM_CDN_HOSTNAME=your-cdn.b-cdn.net
```

### Platform (.env)
```
VITE_API_URL=http://localhost:3001
```

## Deploy to Railway

1. Connect repo to Railway
2. Add PostgreSQL database
3. Set environment variables
4. Railway auto-detects `railway.toml` and `Dockerfile`
5. Deploy
