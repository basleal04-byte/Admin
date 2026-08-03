# BirrBack Panel

Admin dashboard for BirrBack. Users and merchants use the Telebirr mini-app.

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

- NextAuth credentials + MFA
- Role: `admin` only
- Session: 30 min JWT, 15 min idle logout
- Login rate limit: 5 / 15 min

## Pages

| Path | Purpose |
|------|---------|
| `/` | Overview |
| `/merchants` | Approve / suspend |
| `/transactions` | Payments |
| `/campaigns` | Offers |
| `/fees` | Fee split |
| `/audit` | Audit log |
