import type { CompanyOverview, QuoteData, TechnicalData } from "./marketData.js";

export interface AlgorithmResult {
  ticker: string;
  companyName: string | null;
  currentPrice: number | null;
  overallScore: number;
  tier: "A+" | "A" | "B" | "C";
  entrySignal: "Strong Buy" | "Buy" | "Hold" | "Wait";
  stopLoss: number | null;
  target1: number | null;
  target2: number | null;
  target3: number | null;
  sector: string | null;
  marketCap: number | null;
  fundamental: {
    peRatio: number | null;
    pbRatio: number | null;
    debtToEquity: number | null;
    currentRatio: number | null;
    revenueGrowth: number | null;
    epsGrowth: number | null;
    profitMargin: number | null;
    roe: number | null;
    dividendYield: number | null;
    score: number;
  };
  technical: {
    rsi: number | null;
    macdSignal: string | null;
    sma50Above200: boolean | null;
    volumeTrend: string | null;
    priceVs52WeekHigh: number | null;
    score: number;
  };
}

function scorePE(pe: number | null): number {
  if (pe === null || pe <= 0) return 5;
  if (pe < 15) return 11;
  if (pe < 20) return 9;
  if (pe < 25) return 7;
  if (pe < 35) return 5;
  return 2;
}

function scorePB(pb: number | null): number {
  if (pb === null || pb <= 0) return 5;
  if (pb < 1) return 11;
  if (pb < 2) return 9;
  if (pb < 3) return 7;
  if (pb < 5) return 5;
  return 2;
}

function scoreDebtToEquity(de: number | null): number {
  if (de === null) return 5;
  if (de < 0.3) return 11;
  if (de < 0.5) return 9;
  if (de < 1.0) return 7;
  if (de < 2.0) return 5;
  return 2;
}

function scoreCurrentRatio(cr: number | null): number {
  if (cr === null) return 5;
  if (cr > 2) return 11;
  if (cr > 1.5) return 9;
  if (cr > 1.0) return 7;
  if (cr > 0.8) return 5;
  return 2;
}

function scoreRevenueGrowth(rg: number | null): number {
  if (rg === null) return 5;
  if (rg > 0.25) return 11;
  if (rg > 0.15) return 9;
  if (rg > 0.08) return 7;
  if (rg > 0) return 5;
  return 2;
}

function scoreEpsGrowth(eg: number | null): number {
  if (eg === null) return 5;
  if (eg > 0.25) return 11;
  if (eg > 0.15) return 9;
  if (eg > 0.05) return 7;
  if (eg > 0) return 5;
  return 2;
}

function scoreProfitMargin(pm: number | null): number {
  if (pm === null) return 5;
  if (pm > 0.25) return 11;
  if (pm > 0.15) return 9;
  if (pm > 0.08) return 7;
  if (pm > 0.03) return 5;
  return 2;
}

function scoreROE(roe: number | null): number {
  if (roe === null) return 5;
  if (roe > 0.20) return 11;
  if (roe > 0.15) return 9;
  if (roe > 0.10) return 7;
  if (roe > 0.05) return 5;
  return 2;
}

function scoreDividend(dy: number | null): number {
  if (dy === null || dy === 0) return 5;
  if (dy > 0.04) return 9;
  if (dy > 0.02) return 8;
  if (dy > 0.01) return 6;
  return 4;
}

function computeFundamentalScore(overview: CompanyOverview): number {
  const maxPossible = 11 * 9;
  const raw =
    scorePE(overview.peRatio) +
    scorePB(overview.pbRatio) +
    scoreDebtToEquity(overview.debtToEquity) +
    scoreCurrentRatio(overview.currentRatio) +
    scoreRevenueGrowth(overview.revenueGrowthQoQ) +
    scoreEpsGrowth(overview.epsGrowthQoQ) +
    scoreProfitMargin(overview.profitMargin) +
    scoreROE(overview.roe) +
    scoreDividend(overview.dividendYield);
  return Math.round((raw / maxPossible) * 100);
}

function computeTechnicalScore(
  tech: TechnicalData,
  currentPrice: number | null,
  week52High: number | null
): { score: number; sma50Above200: boolean | null; priceVs52WeekHigh: number | null } {
  let score = 0;

  const { rsi, macdSignal, sma50, sma200 } = tech;

  if (rsi !== null) {
    if (rsi < 30) score += 1;
    else if (rsi >= 30 && rsi <= 70) score += 1;
  }

  if (macdSignal === "bullish") score += 1;

  const sma50Above200 = sma50 !== null && sma200 !== null ? sma50 > sma200 : null;
  if (sma50Above200 === true) score += 1;

  let priceVs52WeekHigh: number | null = null;
  if (currentPrice !== null && week52High !== null && week52High > 0) {
    priceVs52WeekHigh = currentPrice / week52High;
    if (priceVs52WeekHigh < 0.75) score += 1;
    else if (priceVs52WeekHigh < 0.90) score += 1;
  }

  if (tech.volumeTrend === "increasing") score += 1;

  return { score: Math.min(score, 5), sma50Above200, priceVs52WeekHigh };
}

function classifyTier(overallScore: number): "A+" | "A" | "B" | "C" {
  if (overallScore >= 85) return "A+";
  if (overallScore >= 70) return "A";
  if (overallScore >= 55) return "B";
  return "C";
}

function classifySignal(overallScore: number): "Strong Buy" | "Buy" | "Hold" | "Wait" {
  if (overallScore >= 85) return "Strong Buy";
  if (overallScore >= 70) return "Buy";
  if (overallScore >= 55) return "Hold";
  return "Wait";
}

export function runAlgorithm(
  overview: CompanyOverview,
  quote: QuoteData,
  tech: TechnicalData
): AlgorithmResult {
  const fundamentalScore = computeFundamentalScore(overview);
  const { score: technicalScore, sma50Above200, priceVs52WeekHigh } = computeTechnicalScore(
    tech,
    quote.price,
    overview.week52High
  );

  const overallScore = Math.round(
    fundamentalScore * 0.7 + (technicalScore / 5) * 100 * 0.3
  );

  const tier = classifyTier(overallScore);
  const entrySignal = classifySignal(overallScore);

  const price = quote.price;
  const stopLoss = price !== null ? Math.round(price * 0.92 * 100) / 100 : null;
  const target1 = price !== null ? Math.round(price * 1.20 * 100) / 100 : null;
  const target2 = price !== null ? Math.round(price * 1.35 * 100) / 100 : null;
  const target3 = price !== null ? Math.round(price * 1.50 * 100) / 100 : null;

  return {
    ticker: overview.ticker,
    companyName: overview.companyName || null,
    currentPrice: price,
    overallScore,
    tier,
    entrySignal,
    stopLoss,
    target1,
    target2,
    target3,
    sector: overview.sector || null,
    marketCap: overview.marketCap,
    fundamental: {
      peRatio: overview.peRatio,
      pbRatio: overview.pbRatio,
      debtToEquity: overview.debtToEquity,
      currentRatio: overview.currentRatio,
      revenueGrowth: overview.revenueGrowthQoQ,
      epsGrowth: overview.epsGrowthQoQ,
      profitMargin: overview.profitMargin,
      roe: overview.roe,
      dividendYield: overview.dividendYield,
      score: fundamentalScore,
    },
    technical: {
      rsi: tech.rsi,
      macdSignal: tech.macdSignal,
      sma50Above200,
      volumeTrend: tech.volumeTrend,
      priceVs52WeekHigh,
      score: technicalScore,
    },
  };
}
