import { pgTable, serial, text, real, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const stockAnalysesTable = pgTable("stock_analyses", {
  id: serial("id").primaryKey(),
  ticker: text("ticker").notNull(),
  companyName: text("company_name"),
  currentPrice: real("current_price"),
  overallScore: real("overall_score").notNull(),
  tier: text("tier").notNull(),
  entrySignal: text("entry_signal").notNull(),
  stopLoss: real("stop_loss"),
  target1: real("target1"),
  target2: real("target2"),
  target3: real("target3"),
  sector: text("sector"),
  marketCap: real("market_cap"),
  peRatio: real("pe_ratio"),
  pbRatio: real("pb_ratio"),
  debtToEquity: real("debt_to_equity"),
  currentRatio: real("current_ratio"),
  revenueGrowth: real("revenue_growth"),
  epsGrowth: real("eps_growth"),
  profitMargin: real("profit_margin"),
  roe: real("roe"),
  dividendYield: real("dividend_yield"),
  fundamentalScore: real("fundamental_score").notNull(),
  rsi: real("rsi"),
  macdSignal: text("macd_signal"),
  sma50Above200: boolean("sma50_above200"),
  volumeTrend: text("volume_trend"),
  priceVs52WeekHigh: real("price_vs_52week_high"),
  technicalScore: real("technical_score").notNull(),
  analyzedAt: timestamp("analyzed_at").defaultNow().notNull(),
});

export const portfolioPositionsTable = pgTable("portfolio_positions", {
  id: serial("id").primaryKey(),
  ticker: text("ticker").notNull(),
  companyName: text("company_name"),
  shares: real("shares").notNull(),
  entryPrice: real("entry_price").notNull(),
  currentPrice: real("current_price"),
  status: text("status").notNull().default("open"),
  exitPrice: real("exit_price"),
  tier: text("tier"),
  entrySignal: text("entry_signal"),
  stopLoss: real("stop_loss"),
  target1: real("target1"),
  target2: real("target2"),
  target3: real("target3"),
  notes: text("notes"),
  openedAt: timestamp("opened_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
});

export const watchlistTable = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  ticker: text("ticker").notNull(),
  companyName: text("company_name"),
  notes: text("notes"),
  alertPrice: real("alert_price"),
  addedAt: timestamp("added_at").defaultNow().notNull(),
  lastAnalysisId: integer("last_analysis_id"),
});

export const insertStockAnalysisSchema = createInsertSchema(stockAnalysesTable).omit({ id: true, analyzedAt: true });
export const insertPortfolioPositionSchema = createInsertSchema(portfolioPositionsTable).omit({ id: true, openedAt: true });
export const insertWatchlistSchema = createInsertSchema(watchlistTable).omit({ id: true, addedAt: true });

export type StockAnalysis = typeof stockAnalysesTable.$inferSelect;
export type InsertStockAnalysis = z.infer<typeof insertStockAnalysisSchema>;
export type PortfolioPosition = typeof portfolioPositionsTable.$inferSelect;
export type InsertPortfolioPosition = z.infer<typeof insertPortfolioPositionSchema>;
export type WatchlistItem = typeof watchlistTable.$inferSelect;
export type InsertWatchlistItem = z.infer<typeof insertWatchlistSchema>;
