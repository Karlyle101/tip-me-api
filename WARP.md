# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project: tip-me-api (Node.js + TypeScript + Express + Prisma)

Essential commands (Windows PowerShell or cross-platform)
- Install dependencies
  - npm install
- Development server (ts-node-dev)
  - npm run dev
- Build TypeScript to JS (outputs to dist/)
  - npm run build
- Start compiled server
  - npm start
- Prisma (ORM) workflow
  - Generate client: npm run prisma:generate
  - Run dev migration (creates/updates local DB): npm run prisma:migrate
  - Open Prisma Studio: npm run prisma:studio
  - Seed database: npm run seed (creates demo barista and admin)

Environment configuration
- Loads from .env via dotenv in src/config.ts and validated with zod.
- Key variables (see README.md):
  - PORT (default 3000)
  - JWT_SECRET (default change-me-in-prod-please)
  - SERVICE_FEE_BPS (default 250 = 2.5%)
  - BASE_URL (default http://localhost:3000)
  - DATABASE_URL (optional; SQLite by default: file:./dev.db)
- Example (PowerShell) to run with custom JWT secret and fee locally:
  - $env:JWT_SECRET = "your-long-secret-here"; $env:SERVICE_FEE_BPS = "250"; npm run dev

Database model (Prisma)
- prisma/schema.prisma defines:
  - Role: BARISTA | CUSTOMER | ADMIN
  - TipStatus: PENDING | COMPLETED | FAILED
  - PayoutStatus: REQUESTED | PROCESSING | PAID | FAILED
  - User: unique email, unique handle; relations to incoming/outgoing tips
  - Tip: toUser (required), fromUser (optional), fromEmail (optional), fee/net amounts, status
  - Payout: payout records per user
- Local development uses SQLite (DATABASE_URL=file:./dev.db). Migrations: npm run prisma:migrate

API surface and request flow (high level)
- Entry points
  - src/app.ts builds the Express app, mounts routers, sets CORS/JSON, and defines /health.
  - src/server.ts boots the app and listens on config.port.
- Routing
  - /auth → src/routes/auth.ts → src/controllers/authController.ts
    - POST /auth/register: email/password/name/role/handle; bcrypt for hashing; creates user; returns JWT
    - POST /auth/login: verifies credentials; returns JWT
    - GET /auth/me: requires Bearer token; returns user
  - /users → src/routes/users.ts → src/controllers/usersController.ts
    - GET /users/me: requires Bearer token; returns user
  - /tips → src/routes/tips.ts → src/controllers/tipsController.ts
    - POST /tips: public tip intent; computes fee using SERVICE_FEE_BPS; demo auto-completes tip
    - GET /tips/incoming: auth; tips to current user
    - GET /tips/outgoing: auth; tips from current user
  - /qr → src/routes/qr.ts → src/controllers/qrController.ts
    - GET /qr/:handle: returns PNG QR code pointing to BASE_URL/portal/:handle
  - /portal → src/routes/portal.ts → src/controllers/portalController.ts
    - GET /portal/:handle: minimal HTML page for anonymous tipping; posts to /tips
  - /admin → src/routes/admin.ts → src/controllers/adminController.ts (requires ADMIN)
    - Users: GET /admin/users
    - Tips: GET /admin/tips, PATCH /admin/tips/:id/status
    - Payouts: GET /admin/payouts, PATCH /admin/payouts/:id/status
  - /payouts → src/routes/payouts.ts → src/controllers/payoutsController.ts
    - POST /payouts/request: create payout request for current user
    - GET /payouts: list current user payouts
- Auth middleware
  - src/middleware/auth.ts provides authRequired and adminRequired
- Persistence
  - src/lib/prisma.ts exports a singleton PrismaClient
- Error handling
  - Global error handler in app.ts catches errors and returns JSON with status/message

Testing and linting
- No test or lint scripts are configured in package.json, and no test/lint configs are present in the repo.
  - If tests are added (e.g., Vitest or Jest), update this file with: how to run all tests and a single test (e.g., npm test -- "-t pattern").
  - If linting is added (e.g., ESLint/Prettier), add commands here (e.g., npm run lint, npm run format).

Operational notes
- First run (local): npm install → npm run prisma:generate → npm run prisma:migrate → npm run seed → npm run dev.
- Health check: GET http://localhost:3000/health
- Authenticated routes require Authorization: Bearer <JWT from /auth/login>.
- Anonymous tipping uses GET /portal/:handle then POST /tips.
- After schema changes (e.g., new roles), run npm run prisma:migrate and npm run prisma:generate.
- For production, switch DATABASE_URL to PostgreSQL and run prisma migrate deploy (see README.md).
