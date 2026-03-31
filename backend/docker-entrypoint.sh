#!/bin/sh
set -e

# Run schema push (automates database setup)
echo "Syncing database schema..."
npx prisma db push --skip-generate

# Start the actual NestJS application
echo "Starting backend..."
exec "$@"
