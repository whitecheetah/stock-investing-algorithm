import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { portfolioPositionsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

function computePnl(position: typeof portfolioPositionsTable.$inferSelect) {
  const { shares, entryPrice, currentPrice, exitPrice, status } = position;
  let unrealizedPnl: number | null = null;
  let unrealizedPnlPct: number | null = null;
  let realizedPnl: number | null = null;

  const cost = shares * entryPrice;

  if (status === "open" && currentPrice !== null) {
    const value = shares * currentPrice;
    unrealizedPnl = Math.round((value - cost) * 100) / 100;
    unrealizedPnlPct = Math.round(((value - cost) / cost) * 10000) / 100;
  }

  if (status === "closed" && exitPrice !== null) {
    realizedPnl = Math.round((shares * exitPrice - cost) * 100) / 100;
  }

  return { unrealizedPnl, unrealizedPnlPct, realizedPnl };
}

function formatPosition(p: typeof portfolioPositionsTable.$inferSelect) {
  const pnl = computePnl(p);
  return {
    id: p.id,
    ticker: p.ticker,
    companyName: p.companyName,
    shares: p.shares,
    entryPrice: p.entryPrice,
    currentPrice: p.currentPrice,
    status: p.status,
    exitPrice: p.exitPrice,
    tier: p.tier,
    entrySignal: p.entrySignal,
    stopLoss: p.stopLoss,
    target1: p.target1,
    target2: p.target2,
    target3: p.target3,
    notes: p.notes,
    openedAt: p.openedAt.toISOString(),
    closedAt: p.closedAt?.toISOString() ?? null,
    ...pnl,
  };
}

router.get("/portfolio", async (req, res) => {
  try {
    const positions = await db
      .select()
      .from(portfolioPositionsTable)
      .orderBy(desc(portfolioPositionsTable.openedAt));

    const formatted = positions.map(formatPosition);

    const open = formatted.filter((p) => p.status === "open");
    const closed = formatted.filter((p) => p.status === "closed");

    const totalCost = open.reduce((sum, p) => sum + p.shares * p.entryPrice, 0);
    const totalValue = open.reduce(
      (sum, p) => sum + p.shares * (p.currentPrice ?? p.entryPrice),
      0
    );
    const totalUnrealizedPnl = totalValue - totalCost;
    const totalUnrealizedPnlPct =
      totalCost > 0 ? Math.round((totalUnrealizedPnl / totalCost) * 10000) / 100 : 0;

    const totalRealizedPnl = closed.reduce((sum, p) => sum + (p.realizedPnl ?? 0), 0);

    const winners = closed.filter((p) => (p.realizedPnl ?? 0) > 0).length;
    const winRate = closed.length > 0 ? Math.round((winners / closed.length) * 100) : null;

    res.json({
      positions: formatted,
      summary: {
        totalValue: Math.round(totalValue * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        totalUnrealizedPnl: Math.round(totalUnrealizedPnl * 100) / 100,
        totalUnrealizedPnlPct,
        totalRealizedPnl: Math.round(totalRealizedPnl * 100) / 100,
        openPositions: open.length,
        closedPositions: closed.length,
        winRate,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get portfolio");
    res.status(500).json({ error: "Failed to get portfolio" });
  }
});

router.post("/portfolio", async (req, res) => {
  const body = req.body as {
    ticker?: string;
    companyName?: string;
    shares?: number;
    entryPrice?: number;
    tier?: string;
    entrySignal?: string;
    stopLoss?: number;
    target1?: number;
    target2?: number;
    target3?: number;
    notes?: string;
  };

  if (!body.ticker || typeof body.shares !== "number" || typeof body.entryPrice !== "number") {
    res.status(400).json({ error: "Bad request", message: "ticker, shares, entryPrice are required" });
    return;
  }

  try {
    const [position] = await db
      .insert(portfolioPositionsTable)
      .values({
        ticker: body.ticker.trim().toUpperCase(),
        companyName: body.companyName ?? null,
        shares: body.shares,
        entryPrice: body.entryPrice,
        tier: body.tier ?? null,
        entrySignal: body.entrySignal ?? null,
        stopLoss: body.stopLoss ?? null,
        target1: body.target1 ?? null,
        target2: body.target2 ?? null,
        target3: body.target3 ?? null,
        notes: body.notes ?? null,
        status: "open",
      })
      .returning();

    res.status(201).json(formatPosition(position));
  } catch (err) {
    req.log.error({ err }, "Failed to add position");
    res.status(500).json({ error: "Failed to add position" });
  }
});

router.patch("/portfolio/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const body = req.body as {
    currentPrice?: number;
    shares?: number;
    status?: "open" | "closed";
    exitPrice?: number;
    notes?: string;
  };

  try {
    const updates: Partial<typeof portfolioPositionsTable.$inferInsert> = {};
    if (body.currentPrice !== undefined) updates.currentPrice = body.currentPrice;
    if (body.shares !== undefined) updates.shares = body.shares;
    if (body.status !== undefined) updates.status = body.status;
    if (body.exitPrice !== undefined) updates.exitPrice = body.exitPrice;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.status === "closed") updates.closedAt = new Date();

    const [updated] = await db
      .update(portfolioPositionsTable)
      .set(updates)
      .where(eq(portfolioPositionsTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Position not found" });
      return;
    }

    res.json(formatPosition(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update position");
    res.status(500).json({ error: "Failed to update position" });
  }
});

router.delete("/portfolio/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    await db.delete(portfolioPositionsTable).where(eq(portfolioPositionsTable.id, id));
    res.json({ success: true, message: "Position deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete position");
    res.status(500).json({ error: "Failed to delete position" });
  }
});

export default router;
