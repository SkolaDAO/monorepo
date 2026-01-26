# Railway Deployment Guide

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Railway Project                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌──────────┐  ┌──────┐  ┌─────┐  ┌────────┐ │
│  │   API   │  │ Platform │  │ Docs │  │ Web │  │Postgres│ │
│  │ :3001   │  │   :80    │  │ :80  │  │ :80 │  │ :5432  │ │
│  └─────────┘  └──────────┘  └──────┘  └─────┘  └────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Services

| Service | Directory | Port | Domain (example) |
|---------|-----------|------|------------------|
| api | `apps/api` | 3001 | api.skola.xyz |
| platform | `apps/platform` | 80 | app.skola.xyz |
| docs | `apps/docs` | 80 | docs.skola.xyz |
| web | `apps/web` | 80 | skola.xyz |
| postgres | (Railway addon) | 5432 | - |

## Setup Steps

### 1. Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init
```

### 2. Add PostgreSQL

In Railway dashboard:
1. Click "New" → "Database" → "PostgreSQL"
2. Copy the `DATABASE_URL` for the API service

### 3. Create Services

For each service (api, platform, docs, web):

**Option A: Railway Dashboard**
1. Click "New" → "GitHub Repo"
2. Select `SkolaDAO/monorepo`
3. Configure:
   - **Root Directory**: Leave empty (builds from repo root)
   - **Dockerfile Path**: `apps/<service>/Dockerfile`
4. Set environment variables (see below)

**Option B: Railway CLI**
```bash
# In project root
railway add --service api
railway add --service platform
railway add --service docs
railway add --service web
```

### 4. Environment Variables

#### API Service
```env
DATABASE_URL=<from Railway Postgres>
JWT_SECRET=<generate: openssl rand -base64 32>
JWT_EXPIRES_IN=7d
RPC_URL=https://base-sepolia.g.alchemy.com/v2/<key>
CHAIN_ID=84532
BUNNY_STREAM_LIBRARY_ID=<your-library-id>
BUNNY_STREAM_API_KEY=<your-api-key>
BUNNY_STREAM_CDN_HOSTNAME=<your-cdn>.b-cdn.net
PORT=3001
CORS_ORIGIN=https://app.skola.xyz
NODE_ENV=production
```

#### Platform Service
```env
VITE_API_URL=https://api.skola.xyz
VITE_WALLET_CONNECT_PROJECT_ID=<your-project-id>
VITE_CLOUDINARY_CLOUD_NAME=<your-cloud-name>
VITE_CLOUDINARY_UPLOAD_PRESET=<your-preset>
```

#### Docs & Web
No environment variables needed.

### 5. Configure Domains

For each service in Railway:
1. Go to Settings → Domains
2. Add custom domain or use Railway's generated domain
3. Update DNS records as instructed

### 6. Run Database Migrations

After API is deployed:
```bash
# Connect to Railway
railway run --service api pnpm db:push
```

Or SSH into the service and run migrations.

## CI/CD

Railway auto-deploys on push to `main`. Each service rebuilds independently.

## Troubleshooting

### Build Fails
- Check Dockerfile paths are correct
- Ensure pnpm-lock.yaml is committed
- Check build logs in Railway dashboard

### API Can't Connect to DB
- Verify DATABASE_URL is set
- Check Postgres service is running
- Ensure connection string includes `?sslmode=require` for Railway

### CORS Issues
- Update CORS_ORIGIN in API to match platform domain
- Include protocol (https://)

## Local Testing with Railway

```bash
# Pull env vars
railway link
railway env pull

# Run locally with production env
pnpm dev
```
