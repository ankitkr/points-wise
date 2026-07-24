# PointsWise

A ledger-accurate, reward-aware personal tracker for Indian credit cards — earn points and
cashback per card (base + accelerated), reconcile monthly earn against statements to surface
discrepancies, track surcharge / "extra paid" so the *actual* earn rate is derivable (SmartBuy
voucher fees, Amazon Pay gift-card loading chains, platform surcharges), and share a household
across a family membership.

Status: **early development.** The first milestone is the authentication and account/household
foundation.

## Stack

- Next.js (App Router) on Cloudflare Workers via `@opennextjs/cloudflare`
- Cloudflare D1 (directory + authorization) and Durable Objects (per-user ledger)
- `next-auth` v5 — Discord sign-in, with membership tier driven by Discord guild roles
- Tailwind CSS + shadcn/ui

## Development setup

Requires Node ≥ 20 and pnpm.

```bash
pnpm install

# 1. Create the D1 database and paste the returned id into wrangler.jsonc
wrangler d1 create points-wise

# 2. Apply migrations locally
pnpm db:migrate:local

# 3. Configure secrets — copy and fill in Discord + auth values
cp .dev.vars.example .dev.vars

# 4. Run
pnpm dev
```

**Discord setup:** create a Discord application (OAuth2 redirect `http://localhost:3000/api/auth/callback/discord`) and a server (guild) with `@family` and `@standalone` roles. Put the client id/secret, guild id, and role ids in `.dev.vars`. Membership tier is read live from these roles on every login: not in the guild → denied; no tier role → read-only; `@standalone` → standalone; `@family` → family.

Useful scripts: `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm db:generate` (regenerate migrations after editing `src/db/schema.ts`).

## License

PointsWise is **source-available, not open source**. It is licensed under the
**[PolyForm Noncommercial License 1.0.0](./LICENSE)**: you may use, modify, and share it for
**noncommercial purposes only**, and you must retain the copyright/`Required Notice` (credit).
**Commercial use — including deploying or hosting PointsWise for money — is not permitted.**

Required Notice: Copyright Ankit Kumar (https://github.com/ankitkr/points-wise)
