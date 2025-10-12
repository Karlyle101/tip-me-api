# Tip Me API

Node.js API server for Tip Me — a platform for baristas and service workers to receive tips via QR codes. Built with Express + TypeScript + Prisma + SQLite (local dev). Production can use PostgreSQL (e.g., Azure Database for PostgreSQL).

## Features
- User registration and login (JWT auth)
- Roles: BARISTA and CUSTOMER
- Unique handle per user; QR code endpoint to generate scannable codes
- Create tip intents with service fee calculation (configurable by env)
- Incoming/outgoing tips endpoints
- Prisma ORM with SQLite for local development

## Getting Started

1. Install dependencies
   - Node.js 18+
   - Run:
     - `npm install`

2. Environment variables
   - Copy `.env.example` to `.env` and adjust as needed.
   - Defaults work for local dev (SQLite):
     - `DATABASE_URL="file:./dev.db"`

3. Database
   - Initialize Prisma client and run migrations:
     - `npx prisma generate`
     - `npx prisma migrate dev --name init`
   - Optional: seed data
     - `npm run seed`

4. Run the API
   - Development: `npm run dev`
   - Health check: GET http://localhost:3000/health

## API Overview

- POST /auth/register
- POST /auth/login
- GET /auth/me (Bearer token)
- GET /users/me (Bearer token)
- GET /qr/:handle (PNG image)
- POST /tips { toHandle, amountCents, message?, fromEmail? }
- GET /tips/incoming (Bearer token)
- GET /tips/outgoing (Bearer token)

## Configuration
- PORT (default 3000)
- JWT_SECRET (change in production!)
- SERVICE_FEE_BPS (basis points, default 250 = 2.5%)
- BASE_URL (default http://localhost:3000)

## Azure Notes
- For production on Azure App Service or Container Apps:
  - Switch Prisma datasource to PostgreSQL and set DATABASE_URL accordingly.
  - Example: `DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"`
  - Run `prisma migrate deploy` on deploy.
- Consider integrating Stripe or another PSP for payments and payouts.

## Scripts
- `npm run dev` — run in watch mode
- `npm run build` — compile TypeScript
- `npm start` — run compiled server
- `npm run prisma:generate` — generate Prisma Client
- `npm run prisma:migrate` — dev migration
- `npm run prisma:studio` — open Prisma Studio
- `npm run seed` — run seeding
