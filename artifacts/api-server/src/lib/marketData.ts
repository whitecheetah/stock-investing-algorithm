import YahooFinanceImport from "yahoo-finance2";
import { logger } from "./logger.js";

// yahoo-finance2's package "exports" map is missing a "types" condition under
// moduleResolution: bundler, so the default export resolves to `never`. Cast
// to a loose shape since our wrapper functions provide the typed surface.
type YFClient = {
  quote: (symbol: string) => Promise<Record<string, unknown>>;
  quoteSummary: (
    symbol: string,
    opts: { modules: string[] },
  ) => Promise<Record<string, Record<string, unknown> | undefined>>;
  chart: (
    symbol: string,
    opts: { period1: Date; period2: Date; interval: string },
  ) => Promise<{ quotes?: Array<{ date: Date; close: number | null; volume: number | null }> }>;
};

// CJS/ESM interop: under tsx (dev) the default import resolves to the class,
// but when esbuild bundles to CJS the require() returns the namespace object
// with the class on `.default`. Handle both shapes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const YahooFinanceAny = YahooFinanceImport as any;
const YahooCtor = (YahooFinanceAny?.default ?? YahooFinanceAny) as new () => YFClient;
const yahooFinance: YFClient = new YahooCtor();

export interface CompanyOverview {
  ticker: string;
  companyName: string;
  sector: string;
  marketCap: number | null;
  peRatio: number | null;
  pbRatio: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  revenueGrowthQoQ: number | null;
  epsGrowthQoQ: number | null;
  profitMargin: number | null;
  roe: number | null;
  dividendYield: number | null;
  eps: number | null;
  bookValue: number | null;
  week52High: number | null;
  week52Low: number | null;
}

export interface QuoteData {
  price: number | null;
  volume: number | null;
  changePercent: number | null;
}

export interface TechnicalData {
  rsi: number | null;
  macdSignal: string | null;
  sma50: number | null;
  sma200: number | null;
  volumeTrend: string | null;
}

function num(val: unknown): number | null {
  if (val === undefined || val === null) return null;
  const n = typeof val === "number" ? val : parseFloat(String(val));
  return isNaN(n) || !isFinite(n) ? null : n;
}

export async function getCompanyOverview(ticker: string): Promise<CompanyOverview> {
  const symbol = ticker.toUpperCase();
  const summary = await yahooFinance.quoteSummary(symbol, {
    modules: ["price", "summaryDetail", "defaultKeyStatistics", "financialData", "assetProfile"],
  });

  const price = summary.price ?? {};
  const detail = summary.summaryDetail ?? {};
  const stats = summary.defaultKeyStatistics ?? {};
  const fin = summary.financialData ?? {};
  const profile = summary.assetProfile ?? {};

  return {
    ticker: symbol,
    companyName: String(price.longName ?? price.shortName ?? symbol),
    sector: String(profile.sector ?? ""),
    marketCap: num(price.marketCap ?? detail.marketCap),
    peRatio: num(detail.trailingPE ?? stats.trailingEps),
    pbRatio: num(stats.priceToBook),
    debtToEquity: num(fin.debtToEquity),
    currentRatio: num(fin.currentRatio),
    revenueGrowthQoQ: num(fin.revenueGrowth),
    epsGrowthQoQ: num(fin.earningsGrowth ?? stats.earningsQuarterlyGrowth),
    profitMargin: num(fin.profitMargins),
    roe: num(fin.returnOnEquity),
    dividendYield: num(detail.dividendYield ?? detail.trailingAnnualDividendYield),
    eps: num(stats.trailingEps),
    bookValue: num(stats.bookValue),
    week52High: num(detail.fiftyTwoWeekHigh),
    week52Low: num(detail.fiftyTwoWeekLow),
  };
}

export async function getQuote(ticker: string): Promise<QuoteData> {
  const symbol = ticker.toUpperCase();
  const q = await yahooFinance.quote(symbol);
  return {
    price: num(q.regularMarketPrice),
    volume: num(q.regularMarketVolume),
    changePercent: num(q.regularMarketChangePercent),
  };
}

function sma(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function ema(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const out: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    out.push(values[i] * k + out[i - 1] * (1 - k));
  }
  return out;
}

function rsi(values: number[], period: number): number | null {
  if (values.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = values.length - period; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function toWeeklyCloses(daily: { date: Date; close: number }[]): number[] {
  const byWeek = new Map<string, { date: Date; close: number }>();
  for (const bar of daily) {
    const d = new Date(bar.date);
    const day = d.getUTCDay();
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    const existing = byWeek.get(key);
    if (!existing || bar.date > existing.date) byWeek.set(key, bar);
  }
  return Array.from(byWeek.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v.close);
}

export async function getTechnicals(ticker: string): Promise<TechnicalData> {
  const symbol = ticker.toUpperCase();
  const period2 = new Date();
  const period1 = new Date();
  period1.setFullYear(period1.getFullYear() - 2);

  let bars: { date: Date; close: number; volume: number }[] = [];
  try {
    const chart = await yahooFinance.chart(symbol, {
      period1,
      period2,
      interval: "1d",
    });
    bars = (chart.quotes ?? [])
      .filter((b: { close: number | null; volume: number | null }) => b.close != null && b.volume != null)
      .map((b: { date: Date; close: number | null; volume: number | null }) => ({
        date: b.date,
        close: b.close as number,
        volume: b.volume as number,
      }));
  } catch (err) {
    logger.error({ err, ticker }, "Yahoo chart fetch failed");
    return { rsi: null, macdSignal: null, sma50: null, sma200: null, volumeTrend: null };
  }

  const closes = bars.map((b) => b.close);
  const volumes = bars.map((b) => b.volume);

  const sma50 = sma(closes, 50);
  const sma200 = sma(closes, 200);

  const weeklyCloses = toWeeklyCloses(bars);
  const rsiValue = rsi(weeklyCloses, 14);

  let macdSignal: string | null = null;
  if (closes.length >= 35) {
    const ema12 = ema(closes, 12);
    const ema26 = ema(closes, 26);
    const macdLine: number[] = [];
    for (let i = 0; i < closes.length; i++) {
      macdLine.push(ema12[i] - ema26[i]);
    }
    const signalLine = ema(macdLine.slice(-50), 9);
    const macd = macdLine[macdLine.length - 1];
    const signal = signalLine[signalLine.length - 1];
    macdSignal = macd > signal ? "bullish" : "bearish";
  }

  let volumeTrend: string | null = null;
  if (volumes.length >= 25) {
    const recent5 = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const prior20 = volumes.slice(-25, -5).reduce((a, b) => a + b, 0) / 20;
    if (prior20 > 0) {
      const ratio = recent5 / prior20;
      volumeTrend = ratio > 1.2 ? "increasing" : ratio < 0.8 ? "decreasing" : "stable";
    }
  }

  return { rsi: rsiValue, macdSignal, sma50, sma200, volumeTrend };
}
