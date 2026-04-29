# kronova-rust-nextjs-example

> **Work in Progress** — This repository is actively evolving as we build out the Kronova platform SDK and developer experience.

A comprehensive reference implementation demonstrating how to integrate with the [Kronova](https://kronova.io) AI and blockchain intelligent orchestration platform using **Rust** and **Next.js**. This example showcases the full Kronova stack — from the rspc-based TypeScript SDK and Rust serverless functions to AI agent orchestration, multi-chain blockchain asset management, real-time banking via Plaid, and a production-grade enterprise dashboard.

---

## About Kronova

Kronova is an enterprise AI and blockchain orchestration platform that unifies physical, digital, and financial asset management through:

- **AI Agent Orchestration** — Autonomous agents for asset analysis, predictive analytics, workflow optimization, and cost intelligence
- **Multi-Chain Blockchain Integration** — Native support for Ethereum, Bitcoin, Sui, and Canton networks
- **Intelligent Asset Gateway** — Unified import pipeline from vector databases (Qdrant), blockchains, banking APIs, and IoT sources
- **rspc API Layer** — Type-safe Rust-to-TypeScript RPC powered by rspc and Supabase Edge Functions
- **Real-Time Banking** — Plaid-powered financial account aggregation and transaction intelligence

### AetherNet Protocol

Kronova is in the process of releasing the majority of the platform API **for free** as open infrastructure. We are maintaining a paywall exclusively for our proprietary **AetherNet Protocol** — a post-quantum secure, end-to-end encrypted communication and data layer built for enterprise-grade deployments where security cannot be compromised.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, shadcn/ui |
| Backend | Rust (WASM), rspc, Supabase Edge Functions |
| Database | Supabase (PostgreSQL + pgvector) |
| AI | OpenAI, Vercel AI SDK, Qdrant vector DB |
| Blockchain | Ethereum, Bitcoin, Sui, Canton |
| Banking | Plaid API |
| Auth | Supabase Auth |

---

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
OPENAI_API_KEY=
PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=sandbox
NEXT_PUBLIC_SITE_URL=
```

> See `docs/SUPABASE_API_KEY_MIGRATION.md` for the updated Supabase key format.

---

## SDK Documentation

- [`lib/rspc-sdk/PUBLISHING.md`](lib/rspc-sdk/PUBLISHING.md) — Publishing the TypeScript rspc SDK to npm/pnpm
- [`lib/rust-sdk/PUBLISHING.md`](lib/rust-sdk/PUBLISHING.md) — Publishing the Rust SDK via wasm-pack
- [`docs/SDK-USAGE.md`](docs/SDK-USAGE.md) — Full SDK usage reference
- [`docs/SUPABASE_API_KEY_MIGRATION.md`](docs/SUPABASE_API_KEY_MIGRATION.md) — Supabase API key migration guide

---

## Built with v0

This repository is linked to a [v0](https://v0.app) project. Start new chats to make changes and v0 will push commits directly to this repo. Every merge to `main` automatically deploys.

[Continue working on v0 →](https://v0.app/chat/projects/prj_Vjv7QXIezlaKbeowQDV62VUCCmbC)

<a href="https://v0.app/chat/api/kiro/clone/Kronova-Intelligent-Systems/kronova-rust-nextjs-example" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>

---

## License

Copyright &copy; 2026 [Kronova Intelligent Systems](https://kronova.io). All rights reserved.
