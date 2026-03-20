import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { watchlistTable, stockAnalysesTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/watchlist", async (req, res) => {
  try {
    const items = await db
      .select()
      .from(watchlistTable)
      .orderBy(desc(watchlistTable.addedAt));

    const enriched = await Promise.all(
      items.map(async (item) => {
        let lastAnalysis = null;
        if (item.lastAnalysisId) {
          const [analysis] = await db
            .select()
            .from(stockAnalysesTable)
            .where(eq(stockAnalysesTable.id, item.lastAnalysisId))
            .limit(1);
          if (analysis) {
            lastAnalysis = {
              ticker: analysis.ticker,
              companyName: analysis.companyName,
              currentPrice: analysis.currentPrice,
              overallScore: analysis.overallScore,
              tier: analysis.tier,
              entrySignal: analysis.entrySignal,
              stopLoss: analysis.stopLoss,
              target1: analysis.target1,
              target2: analysis.target2,
              target3: analysis.target3,
              sector: analysis.sector,
              marketCap: analysis.marketCap,
              fundamental: {
                peRatio: analysis.peRatio,
                pbRatio: analysis.pbRatio,
                debtToEquity: analysis.debtToEquity,
                currentRatio: analysis.currentRatio,
                revenueGrowth: analysis.revenueGrowth,
                epsGrowth: analysis.epsGrowth,
                profitMargin: analysis.profitMargin,
                roe: analysis.roe,
                dividendYield: analysis.dividendYield,
                score: analysis.fundamentalScore,
              },
              technical: {
                rsi: analysis.rsi,
                macdSignal: analysis.macdSignal,
                sma50Above200: analysis.sma50Above200,
                volumeTrend: analysis.volumeTrend,
                priceVs52WeekHigh: analysis.priceVs52WeekHigh,
                score: analysis.technicalScore,
              },
              analyzedAt: analysis.analyzedAt.toISOString(),
            };
          }
        } else {
          const [latestAnalysis] = await db
            .select()
            .from(stockAnalysesTable)
            .where(eq(stockAnalysesTable.ticker, item.ticker))
            .orderBy(desc(stockAnalysesTable.analyzedAt))
            .limit(1);
          if (latestAnalysis) {
            lastAnalysis = {
              ticker: latestAnalysis.ticker,
              companyName: latestAnalysis.companyName,
              currentPrice: latestAnalysis.currentPrice,
              overallScore: latestAnalysis.overallScore,
              tier: latestAnalysis.tier,
              entrySignal: latestAnalysis.entrySignal,
              stopLoss: latestAnalysis.stopLoss,
              target1: latestAnalysis.target1,
              target2: latestAnalysis.target2,
              target3: latestAnalysis.target3,
              sector: latestAnalysis.sector,
              marketCap: latestAnalysis.marketCap,
              fundamental: {
                peRatio: latestAnalysis.peRatio,
                pbRatio: latestAnalysis.pbRatio,
                debtToEquity: latestAnalysis.debtToEquity,
                currentRatio: latestAnalysis.currentRatio,
                revenueGrowth: latestAnalysis.revenueGrowth,
                epsGrowth: latestAnalysis.epsGrowth,
                profitMargin: latestAnalysis.profitMargin,
                roe: latestAnalysis.roe,
                dividendYield: latestAnalysis.dividendYield,
                score: latestAnalysis.fundamentalScore,
              },
              technical: {
                rsi: latestAnalysis.rsi,
                macdSignal: latestAnalysis.macdSignal,
                sma50Above200: latestAnalysis.sma50Above200,
                volumeTrend: latestAnalysis.volumeTrend,
                priceVs52WeekHigh: latestAnalysis.priceVs52WeekHigh,
                score: latestAnalysis.technicalScore,
              },
              analyzedAt: latestAnalysis.analyzedAt.toISOString(),
            };
          }
        }

        return {
          id: item.id,
          ticker: item.ticker,
          companyName: item.companyName,
          notes: item.notes,
          alertPrice: item.alertPrice,
          addedAt: item.addedAt.toISOString(),
          lastAnalysis,
        };
      })
    );

    res.json({ items: enriched, total: enriched.length });
  } catch (err) {
    req.log.error({ err }, "Failed to get watchlist");
    res.status(500).json({ error: "Failed to get watchlist" });
  }
});

router.post("/watchlist", async (req, res) => {
  const body = req.body as {
    ticker?: string;
    companyName?: string;
    notes?: string;
    alertPrice?: number;
  };

  if (!body.ticker) {
    res.status(400).json({ error: "Bad request", message: "ticker is required" });
    return;
  }

  try {
    const [item] = await db
      .insert(watchlistTable)
      .values({
        ticker: body.ticker.trim().toUpperCase(),
        companyName: body.companyName ?? null,
        notes: body.notes ?? null,
        alertPrice: body.alertPrice ?? null,
      })
      .returning();

    res.status(201).json({
      id: item.id,
      ticker: item.ticker,
      companyName: item.companyName,
      notes: item.notes,
      alertPrice: item.alertPrice,
      addedAt: item.addedAt.toISOString(),
      lastAnalysis: null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to add to watchlist");
    res.status(500).json({ error: "Failed to add to watchlist" });
  }
});

router.delete("/watchlist/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    await db.delete(watchlistTable).where(eq(watchlistTable.id, id));
    res.json({ success: true, message: "Removed from watchlist" });
  } catch (err) {
    req.log.error({ err }, "Failed to remove from watchlist");
    res.status(500).json({ error: "Failed to remove from watchlist" });
  }
});

export default router;
