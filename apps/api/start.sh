#!/bin/sh
set -e

echo "Running database migrations..."
pnpm db:push --force

echo "Updating Skola user avatar..."
node update-skola-avatar.mjs || true

echo "Starting server..."
exec node dist/index.js
