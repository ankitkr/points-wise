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

## Deploy (Cloudflare Workers)

**First deploy — manual (once):**

```bash
pnpm wrangler login
pnpm wrangler d1 create points-wise      # paste the id into wrangler.jsonc
pnpm db:migrate:remote                    # apply migrations to remote D1
pnpm run deploy                           # deploys the ledger Worker, then the OpenNext web Worker
```

`pnpm run deploy` deploys **both** Workers in the required order:
`points-wise-ledger` (owns the `LedgerDO`) first, then `points-wise` (the web
app, which binds that DO via `script_name`). Use `deploy:web` / `deploy:ledger`
to deploy one in isolation. For local dev the ledger Worker runs separately:
`pnpm dev:ledger` in a second terminal alongside `pnpm dev`.

Then set the runtime secrets on the Worker (they persist across deploys):

```bash
pnpm wrangler secret put AUTH_SECRET      # openssl rand -base64 32
pnpm wrangler secret put AUTH_DISCORD_ID
pnpm wrangler secret put AUTH_DISCORD_SECRET
pnpm wrangler secret put DISCORD_GUILD_ID
pnpm wrangler secret put DISCORD_FAMILY_ROLE_ID
pnpm wrangler secret put DISCORD_STANDALONE_ROLE_ID
```

Add the deployed callback URL to your Discord app's OAuth2 redirects:
`https://<worker-subdomain>.workers.dev/api/auth/callback/discord`.

**Automated deploys — GitHub Actions** (`.github/workflows/deploy.yml`): pushes to `main` build and deploy automatically. wrangler authenticates from env, not `wrangler login`. Secrets live in a GitHub **Environment** named `cloudflare` (the deploy job declares `environment: cloudflare`); add these two there:

- `CLOUDFLARE_API_TOKEN` — token with *Workers Scripts: Edit* + *D1: Edit*
- `CLOUDFLARE_ACCOUNT_ID`

These are encrypted, write-only, and never exposed to fork pull requests (the workflow runs only on `push`/`workflow_dispatch`). Using an Environment also lets you add protection rules (e.g. required reviewers) to the deploy. Never commit secrets to files — only `database_id` (a non-secret identifier) lives in `wrangler.jsonc`.

## License

PointsWise is **source-available, not open source**. It is licensed under the
**[PolyForm Noncommercial License 1.0.0](./LICENSE)**: you may use, modify, and share it for
**noncommercial purposes only**, and you must retain the copyright/`Required Notice` (credit).
**Commercial use — including deploying or hosting PointsWise for money — is not permitted.**

Required Notice: Copyright Ankit Kumar (https://github.com/ankitkr/points-wise)
