import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { stockAnalysesTable } from "@workspace/db/schema";
import { getCompanyOverview, getQuote, getTechnicals } from "../lib/alphaVantage.js";
import { runAlgorithm } from "../lib/algorithm.js";
import { desc, eq } from "drizzle-orm";

const router: IRouter = Router();

router.post("/analyze", async (req, res) => {
  const { ticker } = req.body as { ticker?: string };
  if (!ticker || typeof ticker !== "string") {
    res.status(400).json({ error: "Bad request", message: "ticker is required" });
    return;
  }

  const symbol = ticker.trim().toUpperCase();

  try {
    const [overview, quote, tech] = await Promise.all([
      getCompanyOverview(symbol),
      getQuote(symbol),
      getTechnicals(symbol),
    ]);

    const result = runAlgorithm(overview, quote, tech);

    const [saved] = await db.insert(stockAnalysesTable).values({
      ticker: result.ticker,
      companyName: result.companyName,
      currentPrice: result.currentPrice,
      overallScore: result.overallScore,
      tier: result.tier,
      entrySignal: result.entrySignal,
      stopLoss: result.stopLoss,
      target1: result.target1,
      target2: result.target2,
      target3: result.target3,
      sector: result.sector,
      marketCap: result.marketCap,
      peRatio: result.fundamental.peRatio,
      pbRatio: result.fundamental.pbRatio,
      debtToEquity: result.fundamental.debtToEquity,
      currentRatio: result.fundamental.currentRatio,
      revenueGrowth: result.fundamental.revenueGrowth,
      epsGrowth: result.fundamental.epsGrowth,
      profitMargin: result.fundamental.profitMargin,
      roe: result.fundamental.roe,
      dividendYield: result.fundamental.dividendYield,
      fundamentalScore: result.fundamental.score,
      rsi: result.technical.rsi,
      macdSignal: result.technical.macdSignal,
      sma50Above200: result.technical.sma50Above200,
      volumeTrend: result.technical.volumeTrend,
      priceVs52WeekHigh: result.technical.priceVs52WeekHigh,
      technicalScore: result.technical.score,
    }).returning();

    res.json({
      ...result,
      analyzedAt: saved.analyzedAt.toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("rate limit")) {
      res.status(429).json({ error: "Rate limit", message: msg });
    } else {
      req.log.error({ err }, "Failed to analyze stock");
      res.status(500).json({ error: "Analysis failed", message: msg });
    }
  }
});

export default router;
