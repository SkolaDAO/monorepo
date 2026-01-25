#!/bin/bash

set -e

echo "🚀 Setting up Skola development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"

# Start PostgreSQL
echo "📦 Starting PostgreSQL..."
docker compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check if PostgreSQL is ready
until docker compose exec -T postgres pg_isready -U skola -d skola > /dev/null 2>&1; do
    echo "   Waiting for database..."
    sleep 2
done

echo "✅ PostgreSQL is ready"

# Push database schema
echo "📊 Pushing database schema..."
pnpm db:push

echo ""
echo "✅ Setup complete!"
echo ""
echo "Run 'pnpm dev' to start all services:"
echo "  - API:      http://localhost:3001"
echo "  - Platform: http://localhost:5174"
echo "  - Docs:     http://localhost:5173"
echo "  - Web:      http://localhost:5175"
