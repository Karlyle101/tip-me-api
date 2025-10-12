#!/bin/bash
set -e

echo "Starting database migration..."

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

echo "Database migration completed successfully!"

# Start the application
npm start