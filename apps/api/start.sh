#!/bin/sh
set -e

echo "Running database migrations..."
pnpm db:push --force

echo "Starting server..."
exec node dist/index.js
