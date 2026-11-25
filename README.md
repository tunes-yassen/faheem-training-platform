# منصة فهيم للتدريب — Faheem Training Platform

Production-grade modular monolith platform combining Professional Training (LMS — In-Person, Live Online, Recorded, NCEL-ready Certificates, Corporate B2B) and Academic Tutoring (Direct, Open Auto-Match, Coordinator-Assisted) with Parent/Guardian oversight, Append-Only Wallet Ledger, Maker-Checker Refunds, and Dynamic Admin Integrations.

## Architecture

- `apps/api` — NestJS (TypeScript) + Prisma + PostgreSQL REST API (`http://localhost:4000/api/v1`, Swagger at `/api/docs`)
- `apps/web` — Next.js Arabic RTL Web App & Portals (`http://localhost:3000`)
- `apps/admin` — Next.js Arabic RTL Admin Console (`http://localhost:3001`)
- `apps/mobile` — React Native (Expo) Arabic RTL Mobile App

## Quick Start (Backend)

```bash
# 1. Start PostgreSQL & Redis
docker compose up -d postgres redis

# 2. Configure environment
cp .env.example apps/api/.env

# 3. Install dependencies, push schema & seed Arabic demo data
cd apps/api
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed

# 4. Run API (port 4000)
npm run start:dev
```

## Demo Accounts (OTP in dev mode: `123456` or echoed in response)

| Role | Email | Phone |
| --- | --- | --- |
| Super Admin | `admin@faheem.sa` | `+966500000001` |
| Finance Maker | `finance.maker@faheem.sa` | `+966500000002` |
| Finance Checker | `finance.checker@faheem.sa` | `+966500000003` |
| Coordinator | `coordinator@faheem.sa` | `+966500000004` |
| Approved Tutor | `tutor@faheem.sa` | `+966500000005` |
| Approved Tutor 2 | `tutor2@faheem.sa` | `+966500000006` |
| Pending Tutor | `pending.tutor@faheem.sa` | `+966500000007` |
| Trainer | `trainer@faheem.sa` | `+966500000008` |
| Parent | `parent@faheem.sa` | `+966500000009` |
| Student | `student@faheem.sa` | `+966500000010` |
