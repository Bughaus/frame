#!/bin/sh
set -e

# Run schema push (automates database setup)
echo "Syncing database schema..."
npx prisma db push --skip-generate

# Run seeding (ensures admin user exists)
echo "Seeding database..."
npx prisma db seed

# Start the actual NestJS application
echo "Starting backend..."
exec "$@"
