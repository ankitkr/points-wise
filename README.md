# Pointwise

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

## License

Pointwise is **source-available, not open source**. It is licensed under the
**[PolyForm Noncommercial License 1.0.0](./LICENSE)**: you may use, modify, and share it for
**noncommercial purposes only**, and you must retain the copyright/`Required Notice` (credit).
**Commercial use — including deploying or hosting Pointwise for money — is not permitted.**

Required Notice: Copyright Ankit Kumar (https://github.com/ankitkr/points-wise)
