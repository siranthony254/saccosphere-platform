# Saccosphere Platform

A unified SACCO management platform for Kenya. Three apps, one API, one monorepo.

## Architecture

```
saccosphere-platform/
├── apps/
│   ├── member-app/       # React Native + Expo — iOS, Android, PWA
│   ├── sacco-admin/      # React + Vite — admin.saccosphere.co.ke
│   └── super-admin/      # React + Vite — superadmin.saccosphere.co.ke
└── packages/
    ├── schemas/           # @saccosphere/schemas — Zod schemas + TypeScript types
    ├── api-client/        # @saccosphere/api-client — typed Axios client
    ├── ui/                # @saccosphere/ui — shared components
    └── config/            # @saccosphere/config — env helpers, MOCK flags, constants
```

## Prerequisites

- Node.js 18+
- pnpm 9+ (`npm install -g pnpm`)
- For member app: Expo CLI (`npm install -g expo-cli`)

## Quick start

```bash
# Install all dependencies across all workspaces
pnpm install

# Start all three apps simultaneously (mock mode on by default)
pnpm turbo dev

# Or start individual apps
pnpm turbo dev --filter=member-app
pnpm turbo dev --filter=sacco-admin
pnpm turbo dev --filter=super-admin
```

**Member app** → Expo Go on your phone (scan QR) or http://localhost:8081  
**SACCO admin** → http://localhost:5173  
**Super admin** → http://localhost:5174

## Mock-first development protocol

All three apps run in **mock mode** by default. No backend required.

Every data-fetching hook has:
1. **Mock data** — realistic fake data matching real API shape
2. **Real API call** — commented out, ready to uncomment
3. **MOCK flag check** — reads environment variable to decide which to use

### Switching a feature to real API

When the Django backend team delivers an endpoint:

1. Open the relevant hook file (e.g. `apps/member-app/hooks/useDashboard.ts`)
2. Uncomment the `import { api }` line at the top
3. Uncomment the `fetchDashboard` function in Section 2
4. Uncomment the real `useQuery` in Section 3
5. Set the env flag to `false` in `.env.development`:
   ```
   EXPO_PUBLIC_MOCK_MEMBERSHIPS=false
   ```
6. Test against staging backend

**No component files change. No routes change. No refactoring.**

### Mock flags (per feature)

| Flag | Controls |
|------|----------|
| `EXPO_PUBLIC_MOCK_AUTH` | Login, register, OTP, password reset |
| `EXPO_PUBLIC_MOCK_SACCOS` | SACCO discovery, configuration |
| `EXPO_PUBLIC_MOCK_MEMBERSHIPS` | Dashboard, memberships, transactions |
| `EXPO_PUBLIC_MOCK_LOANS` | Loan applications, guarantors, comparison |
| `EXPO_PUBLIC_MOCK_PAYMENTS` | M-Pesa STK push |
| `VITE_MOCK_SACCO_ADMIN` | Entire SACCO admin portal |
| `VITE_MOCK_SUPER_ADMIN` | Entire super admin portal |

## Shared packages

### @saccosphere/schemas
Zod schemas and TypeScript types. **The contract between frontend and backend.**
Share with the Django team — their serializers must produce JSON matching these schemas.

```ts
import type { Dashboard, SaccoConfig, LoanApplication } from '@saccosphere/schemas'
```

### @saccosphere/api-client
Typed API functions for all endpoints. Handles auth token, 401 refresh, idempotency.

```ts
import { api } from '@saccosphere/api-client'
const dashboard = await api.member.getDashboard()
```

### @saccosphere/config
Environment helpers, MOCK flags, query keys, error codes.

```ts
import { MOCK, QueryKeys, ErrorCode } from '@saccosphere/config'
if (MOCK.loans) { /* use mock data */ }
```

## Build & deployment

```bash
# Type-check all workspaces
pnpm turbo type-check

# Run all tests
pnpm turbo test

# Build admin portals (web)
pnpm turbo build --filter=sacco-admin
pnpm turbo build --filter=super-admin

# Build member app (requires EAS)
pnpm --filter=member-app eas build --platform all
```

## Environment files

Copy `.env.example` to each app's `.env.development` and fill in values.
**Never commit `.env` files.**

| File | Purpose |
|------|---------|
| `.env.example` | Template — commit this |
| `apps/member-app/.env.development` | Local dev (all mocks on) |
| `apps/member-app/.env.staging` | Staging (all mocks off) |
| `apps/member-app/.env.production` | Production |
| `apps/sacco-admin/.env.development` | Local dev |
| `apps/super-admin/.env.development` | Local dev |

## Tech stack

| Layer | Technology |
|-------|-----------|
| Member app | React Native 0.74 + Expo SDK 51 + Expo Router v3 |
| Admin portals | React 19 + TypeScript 5 + Vite 5 + React Router v6 |
| Monorepo | Turborepo + pnpm workspaces |
| Server state | TanStack React Query v5 |
| Client state | Zustand 4 |
| Forms | React Hook Form + Zod |
| Styling (native) | NativeWind (Tailwind for React Native) |
| Styling (web) | Tailwind CSS 3 |
| HTTP client | Axios (via @saccosphere/api-client) |
| Real-time | SSE (admin portals) + Firebase FCM (member app) |

## Backend

The Django REST API is maintained separately by the backend team.
Schema contract: `packages/schemas/src/`

API base URL: `http://localhost:8000/api/v1` (development)

## Project conventions

- **One hook file per feature** — mock + real in the same file, toggled by env var
- **Never call `api.*` directly in components** — always through a hook
- **Never put server data in Zustand** — React Query owns server state
- **Access tokens in memory only** — never localStorage
- **All TypeScript types from @saccosphere/schemas** — no inline type definitions for API data

---

Built for Kenya's 22,000+ SACCOs and 14 million+ members.
