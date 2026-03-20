import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { stockAnalysesTable } from "@workspace/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/recommendations", async (req, res) => {
  const { tier, signal, limit: limitStr } = req.query as Record<string, string>;
  const limit = Math.min(parseInt(limitStr ?? "20", 10) || 20, 100);

  try {
    const conditions = [];
    if (tier && ["A+", "A", "B", "C"].includes(tier)) {
      conditions.push(eq(stockAnalysesTable.tier, tier));
    }
    if (signal && ["Strong Buy", "Buy", "Hold", "Wait"].includes(signal)) {
      conditions.push(eq(stockAnalysesTable.entrySignal, signal));
    }

    const subquery = db
      .selectDistinctOn([stockAnalysesTable.ticker], {
        id: stockAnalysesTable.id,
        ticker: stockAnalysesTable.ticker,
        analyzedAt: stockAnalysesTable.analyzedAt,
      })
      .from(stockAnalysesTable)
      .orderBy(stockAnalysesTable.ticker, desc(stockAnalysesTable.analyzedAt))
      .as("latest");

    const rows = await db
      .select()
      .from(stockAnalysesTable)
      .innerJoin(subquery, eq(stockAnalysesTable.id, subquery.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(stockAnalysesTable.overallScore))
      .limit(limit);

    const items = rows.map(({ stock_analyses }) => ({
      ticker: stock_analyses.ticker,
      companyName: stock_analyses.companyName,
      currentPrice: stock_analyses.currentPrice,
      overallScore: stock_analyses.overallScore,
      tier: stock_analyses.tier,
      entrySignal: stock_analyses.entrySignal,
      stopLoss: stock_analyses.stopLoss,
      target1: stock_analyses.target1,
      target2: stock_analyses.target2,
      target3: stock_analyses.target3,
      sector: stock_analyses.sector,
      marketCap: stock_analyses.marketCap,
      fundamental: {
        peRatio: stock_analyses.peRatio,
        pbRatio: stock_analyses.pbRatio,
        debtToEquity: stock_analyses.debtToEquity,
        currentRatio: stock_analyses.currentRatio,
        revenueGrowth: stock_analyses.revenueGrowth,
        epsGrowth: stock_analyses.epsGrowth,
        profitMargin: stock_analyses.profitMargin,
        roe: stock_analyses.roe,
        dividendYield: stock_analyses.dividendYield,
        score: stock_analyses.fundamentalScore,
      },
      technical: {
        rsi: stock_analyses.rsi,
        macdSignal: stock_analyses.macdSignal,
        sma50Above200: stock_analyses.sma50Above200,
        volumeTrend: stock_analyses.volumeTrend,
        priceVs52WeekHigh: stock_analyses.priceVs52WeekHigh,
        score: stock_analyses.technicalScore,
      },
      analyzedAt: stock_analyses.analyzedAt.toISOString(),
    }));

    res.json({ items, total: items.length });
  } catch (err) {
    req.log.error({ err }, "Failed to get recommendations");
    res.status(500).json({ error: "Failed to get recommendations" });
  }
});

export default router;
