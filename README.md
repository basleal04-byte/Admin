# BirrBack Panel

Admin dashboard for BirrBack. End users and merchants use the Telebirr mini-app.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

http://localhost:3000

Credentials: `DEMO.md`

## Structure

```
pages -> hooks -> /api/admin/* -> lib/store.ts (mock)
```

Swap `lib/store.ts` for real API calls when the backend is available.

## Auth

- NextAuth credentials + MFA (required for all admins)
- RBAC roles: `super_admin`, `ops`, `finance`, `support`
- Session: 30 min JWT, 15 min idle logout
- Login rate limit: 5 / 15 min

## Routes

| Path | Purpose |
|------|---------|
| `/` | Overview |
| `/merchants` | Merchant list and actions |
| `/merchants/[id]` | Merchant detail |
| `/users` | Consumer list |
| `/users/[id]` | Consumer detail |
| `/transactions` | Payments |
| `/escrow` | Escrow balance and reconciliation |
| `/redemptions` | Points redemptions |
| `/expiry` | Point expiry and extensions |
| `/brand` | Brand ad campaigns |
| `/fis` | Merchant integrity scores |
| `/webhooks` | System health |
| `/push` | Push notifications |
| `/reports` | Performance reports |
| `/campaigns` | Happy hour campaigns |
| `/fees` | Fee split config |
| `/admins` | Admin users |
| `/audit` | Audit log |
