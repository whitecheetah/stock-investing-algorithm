# Stock Investing Algorithm — QuantCore

  A professional stock analysis platform implementing a **5-phase systematic investing algorithm**.

  ## Algorithm

  | Phase | Component | Weight |
  |-------|-----------|--------|
  | Fundamental | 9 criteria → 0-100 score | 70% |
  | Technical | 5 indicators → 0-5 score | 30% |

  ### Fundamental Criteria (9)
  P/E Ratio · P/B Ratio · Debt-to-Equity · Current Ratio · Revenue Growth · EPS Growth · Profit Margin · ROE · Dividend Yield

  ### Technical Indicators (5)
  RSI · MACD Signal · SMA50 vs SMA200 · Volume Trend · Price vs 52-Week High

  ### Tier Classification
  | Tier | Overall Score | Entry Signal |
  |------|--------------|--------------|
  | A+   | ≥ 85         | Strong Buy   |
  | A    | ≥ 70         | Buy          |
  | B    | ≥ 55         | Hold         |
  | C    | < 55         | Wait         |

  ### Risk Management
  - **Stop-loss**: automatic 8% below entry
  - **Target 1**: +20% profit
  - **Target 2**: +35% profit
  - **Target 3**: +50% profit

  ## Stack

  - **Frontend**: React + Vite + Tailwind CSS + Shadcn/UI + Recharts
  - **Backend**: Node.js + Express 5
  - **Database**: PostgreSQL + Drizzle ORM
  - **Data**: Alpha Vantage API
  - **Monorepo**: pnpm workspaces + TypeScript

  ## Features

  1. **Dashboard** — Portfolio summary, active positions, top signals
  2. **Algorithm** — Analyze any ticker with full score breakdown
  3. **Portfolio** — Track open/closed positions with P&L
  4. **Watchlist** — Monitor tickers with last analysis results
  5. **Signals** — Browse all analyzed stocks filtered by tier/signal

  ## Setup

  ```bash
  # Install dependencies
  pnpm install

  # Set environment variables
  ALPHA_VANTAGE_API_KEY=your_key
  DATABASE_URL=your_postgres_url

  # Push database schema
  pnpm --filter @workspace/db run push

  # Start API server
  pnpm --filter @workspace/api-server run dev

  # Start frontend
  pnpm --filter @workspace/stock-algo run dev
  ```

  ## Environment Variables

  | Variable | Description |
  |----------|-------------|
  | `ALPHA_VANTAGE_API_KEY` | Free key from [alphavantage.co](https://alphavantage.co) |
  | `DATABASE_URL` | PostgreSQL connection string |
  