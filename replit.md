# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + Shadcn/UI + Recharts

## Application: Stock Investing Algorithm (QuantCore)

A professional stock analysis platform implementing a 5-phase systematic investing algorithm:

### Algorithm
- **9 fundamental criteria** → 0-100 fundamental score: P/E ratio, P/B ratio, Debt-to-Equity, Current Ratio, Revenue Growth, EPS Growth, Profit Margin, ROE, Dividend Yield
- **5 technical indicators** → 0-5 technical score: RSI, MACD signal, SMA50 vs SMA200, Volume trend, Price vs 52-week high
- **Overall score** = 70% fundamental + 30% technical (normalized)
- **Tier classification**: A+ (≥85), A (≥70), B (≥55), C (<55)
- **Entry signals**: Strong Buy (≥85), Buy (≥70), Hold (≥55), Wait (<55)
- **Risk management**: Automatic 8% stop-loss, profit targets at 20%, 35%, 50%

### Data Source
- Alpha Vantage API (`ALPHA_VANTAGE_API_KEY` secret required)

### Pages
1. **Dashboard** – Portfolio summary (total value, P&L, win rate) + active positions + top signals
2. **Algorithm (Analyze)** – Ticker input form, full analysis results with scores, tier, signal, targets
3. **Portfolio** – Open/closed positions table with P&L tracking, add/update/close positions
4. **Watchlist** – Watched tickers with last analysis results, quick-analyze button
5. **Signals (Recommendations)** – Filterable grid of past analyses by tier and signal

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   │   └── src/
│   │       ├── lib/
│   │       │   ├── alphaVantage.ts  # Alpha Vantage API client
│   │       │   └── algorithm.ts     # 5-phase scoring algorithm
│   │       └── routes/
│   │           ├── analyze.ts       # POST /api/analyze
│   │           ├── recommendations.ts # GET /api/recommendations
│   │           ├── portfolio.ts     # CRUD /api/portfolio
│   │           └── watchlist.ts     # CRUD /api/watchlist
│   └── stock-algo/         # React + Vite frontend (QuantCore)
│       └── src/
│           ├── pages/       # dashboard, analyze, portfolio, watchlist, recommendations
│           ├── components/  # Layout, Badges, ScoreRing, UI components
│           └── hooks/       # use-app-queries.ts (React Query hooks)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas
│   └── db/                 # Drizzle ORM schema + DB connection
│       └── src/schema/
│           └── stocks.ts   # stock_analyses, portfolio_positions, watchlist tables
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
- `pnpm --filter @workspace/db run push` — push DB schema changes
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client and Zod schemas

## Database Schema

Three tables in PostgreSQL:
- `stock_analyses` — stores all analysis runs (scores, tiers, fundamentals, technicals)
- `portfolio_positions` — portfolio tracking with open/closed positions and P&L
- `watchlist` — watched tickers with optional alerts
