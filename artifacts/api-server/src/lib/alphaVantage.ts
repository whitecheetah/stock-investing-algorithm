import { logger } from "./logger.js";

const BASE_URL = "https://www.alphavantage.co/query";

function getApiKey(): string {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) throw new Error("ALPHA_VANTAGE_API_KEY not set");
  return key;
}

async function fetchAV(params: Record<string, string>): Promise<Record<string, unknown>> {
  const url = new URL(BASE_URL);
  url.searchParams.set("apikey", getApiKey());
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Alpha Vantage HTTP ${res.status}`);
  const data = (await res.json()) as Record<string, unknown>;
  if ("Note" in data || "Information" in data) {
    throw new Error("Alpha Vantage rate limit reached. Please wait and try again.");
  }
  return data;
}

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

function parseNum(val: unknown): number | null {
  if (val === undefined || val === null || val === "None" || val === "-") return null;
  const n = parseFloat(String(val));
  return isNaN(n) ? null : n;
}

export async function getCompanyOverview(ticker: string): Promise<CompanyOverview> {
  const data = await fetchAV({ function: "OVERVIEW", symbol: ticker });

  return {
    ticker: String(data["Symbol"] ?? ticker),
    companyName: String(data["Name"] ?? ticker),
    sector: String(data["Sector"] ?? ""),
    marketCap: parseNum(data["MarketCapitalization"]),
    peRatio: parseNum(data["PERatio"]),
    pbRatio: parseNum(data["PriceToBookRatio"]),
    debtToEquity: parseNum(data["DebtToEquityRatio"] ?? data["DERatio"]),
    currentRatio: parseNum(data["CurrentRatio"]),
    revenueGrowthQoQ: parseNum(data["QuarterlyRevenueGrowthYOY"]),
    epsGrowthQoQ: parseNum(data["QuarterlyEarningsGrowthYOY"]),
    profitMargin: parseNum(data["ProfitMargin"]),
    roe: parseNum(data["ReturnOnEquityTTM"]),
    dividendYield: parseNum(data["DividendYield"]),
    eps: parseNum(data["EPS"]),
    bookValue: parseNum(data["BookValue"]),
    week52High: parseNum(data["52WeekHigh"]),
    week52Low: parseNum(data["52WeekLow"]),
  };
}

export async function getQuote(ticker: string): Promise<QuoteData> {
  const data = await fetchAV({ function: "GLOBAL_QUOTE", symbol: ticker });
  const q = (data["Global Quote"] ?? {}) as Record<string, unknown>;
  return {
    price: parseNum(q["05. price"]),
    volume: parseNum(q["06. volume"]),
    changePercent: parseNum(String(q["10. change percent"] ?? "").replace("%", "")),
  };
}

export async function getTechnicals(ticker: string): Promise<TechnicalData> {
  const [rsiData, macdData, sma50Data, sma200Data] = await Promise.allSettled([
    fetchAV({ function: "RSI", symbol: ticker, interval: "weekly", time_period: "14", series_type: "close" }),
    fetchAV({ function: "MACD", symbol: ticker, interval: "daily", series_type: "close" }),
    fetchAV({ function: "SMA", symbol: ticker, interval: "daily", time_period: "50", series_type: "close" }),
    fetchAV({ function: "SMA", symbol: ticker, interval: "daily", time_period: "200", series_type: "close" }),
  ]);

  let rsi: number | null = null;
  if (rsiData.status === "fulfilled") {
    const series = (rsiData.value["Technical Analysis: RSI"] ?? {}) as Record<string, Record<string, string>>;
    const latestDate = Object.keys(series).sort().reverse()[0];
    if (latestDate) rsi = parseNum(series[latestDate]["RSI"]);
  }

  let macdSignal: string | null = null;
  if (macdData.status === "fulfilled") {
    const series = (macdData.value["Technical Analysis: MACD"] ?? {}) as Record<string, Record<string, string>>;
    const latestDate = Object.keys(series).sort().reverse()[0];
    if (latestDate) {
      const macd = parseNum(series[latestDate]["MACD"]);
      const signal = parseNum(series[latestDate]["MACD_Signal"]);
      if (macd !== null && signal !== null) {
        macdSignal = macd > signal ? "bullish" : "bearish";
      }
    }
  }

  let sma50: number | null = null;
  if (sma50Data.status === "fulfilled") {
    const series = (sma50Data.value["Technical Analysis: SMA"] ?? {}) as Record<string, Record<string, string>>;
    const latestDate = Object.keys(series).sort().reverse()[0];
    if (latestDate) sma50 = parseNum(series[latestDate]["SMA"]);
  }

  let sma200: number | null = null;
  if (sma200Data.status === "fulfilled") {
    const series = (sma200Data.value["Technical Analysis: SMA"] ?? {}) as Record<string, Record<string, string>>;
    const latestDate = Object.keys(series).sort().reverse()[0];
    if (latestDate) sma200 = parseNum(series[latestDate]["SMA"]);
  }

  return { rsi, macdSignal, sma50, sma200, volumeTrend: null };
}
