import { useState } from "react";
import { useAppAnalyzeStock, useAppAddPosition, useAppAddToWatchlist } from "@/hooks/use-app-queries";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Search, Loader2, ArrowRight, Save, Eye, TrendingUp, AlertOctagon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { TierBadge, SignalBadge, ValueBadge } from "@/components/ui/Badges";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  ticker: z.string().min(1, "Ticker is required").max(10).toUpperCase(),
});

export default function Analyze() {
  const { toast } = useToast();
  const analyzeMutation = useAppAnalyzeStock();
  const addWatchlistMutation = useAppAddToWatchlist();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { ticker: "" },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    analyzeMutation.mutate(values, {
      onError: (err: any) => {
        toast({
          title: "Analysis Failed",
          description: err?.message || "Could not analyze ticker",
          variant: "destructive",
        });
      }
    });
  };

  const result = analyzeMutation.data;

  const handleWatchlist = () => {
    if (!result) return;
    addWatchlistMutation.mutate({
      ticker: result.ticker,
      companyName: result.companyName,
    }, {
      onSuccess: () => {
        toast({ title: "Added to Watchlist", description: `${result.ticker} is now tracked.` });
      }
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Search Header */}
      <div className="glass-panel p-8 rounded-3xl text-center space-y-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight mb-2">QuantCore Algorithm</h1>
          <p className="text-muted-foreground mb-8">Enter a ticker to run the 5-phase systematic analysis.</p>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="relative flex items-center">
            <div className="absolute left-4 text-muted-foreground">
              <Search className="w-6 h-6" />
            </div>
            <input
              {...form.register("ticker")}
              placeholder="e.g. AAPL, MSFT, TSLA"
              className="w-full h-16 pl-14 pr-32 bg-background/50 border-2 border-border/80 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl text-2xl font-mono uppercase tracking-wider placeholder:text-muted-foreground/50 transition-all outline-none"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={analyzeMutation.isPending}
              className="absolute right-2 h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {analyzeMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Analyze"}
            </button>
          </form>
          {form.formState.errors.ticker && (
            <p className="text-destructive text-sm mt-2 text-left">{form.formState.errors.ticker.message}</p>
          )}
        </div>
      </div>

      {/* Results Area */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="space-y-8"
          >
            {/* Top Overview Card */}
            <div className="glass-panel p-8 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-8 items-center border-l-4" style={{ borderLeftColor: `hsl(var(--${result.tier === 'A+' ? 'success' : result.tier === 'A' ? 'primary' : result.tier === 'B' ? 'warning' : 'destructive'}))` }}>
              
              <div className="col-span-1 flex flex-col md:border-r border-border/50 md:pr-8">
                <div className="flex items-center gap-4 mb-2">
                  <h2 className="text-5xl font-mono font-bold tracking-tighter">{result.ticker}</h2>
                  <TierBadge tier={result.tier} className="text-lg px-3 py-1" />
                </div>
                <p className="text-muted-foreground text-lg mb-6 truncate">{result.companyName || "Unknown Company"}</p>
                <div className="text-4xl font-mono font-medium text-foreground mb-4">
                  {formatCurrency(result.currentPrice)}
                </div>
                <div className="flex gap-3 mt-auto">
                  <button onClick={handleWatchlist} disabled={addWatchlistMutation.isPending} className="flex-1 py-2.5 rounded-lg border border-border/80 hover:bg-muted/50 font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                    <Eye className="w-4 h-4" /> Watch
                  </button>
                  <button className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/20">
                    <Save className="w-4 h-4" /> Position
                  </button>
                </div>
              </div>

              <div className="col-span-1 flex justify-center">
                <ScoreRing score={result.overallScore} size={180} strokeWidth={12} />
              </div>

              <div className="col-span-1 space-y-6">
                <div>
                  <h4 className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Action Signal</h4>
                  <SignalBadge signal={result.entrySignal} className="text-xl px-4 py-2 w-full" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-xl">
                    <div className="flex items-center gap-1.5 text-xs text-destructive uppercase font-bold mb-1">
                      <AlertOctagon className="w-3 h-3" /> Stop Loss
                    </div>
                    <div className="font-mono font-bold text-lg text-foreground">{formatCurrency(result.stopLoss)}</div>
                  </div>
                  <div className="bg-success/10 border border-success/20 p-3 rounded-xl">
                    <div className="flex items-center gap-1.5 text-xs text-success uppercase font-bold mb-1">
                      <TrendingUp className="w-3 h-3" /> Target 1 (20%)
                    </div>
                    <div className="font-mono font-bold text-lg text-foreground">{formatCurrency(result.target1)}</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Deep Dive Grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Fundamentals */}
              <div className="glass-panel p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
                  <h3 className="text-xl font-bold tracking-tight">Fundamentals</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Score</span>
                    <span className="font-mono font-bold text-2xl text-primary">{result.fundamental.score.toFixed(0)}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <ValueBadge label="P/E Ratio" value={formatNumber(result.fundamental.peRatio)} isPositive={result.fundamental.peRatio ? result.fundamental.peRatio < 25 : undefined} />
                  <ValueBadge label="P/B Ratio" value={formatNumber(result.fundamental.pbRatio)} isPositive={result.fundamental.pbRatio ? result.fundamental.pbRatio < 3 : undefined} />
                  <ValueBadge label="Debt/Equity" value={formatNumber(result.fundamental.debtToEquity)} isPositive={result.fundamental.debtToEquity ? result.fundamental.debtToEquity < 1 : undefined} />
                  <ValueBadge label="Current Ratio" value={formatNumber(result.fundamental.currentRatio)} isPositive={result.fundamental.currentRatio ? result.fundamental.currentRatio > 1.5 : undefined} />
                  <ValueBadge label="Rev Growth" value={formatPercent(result.fundamental.revenueGrowth)} isPositive={result.fundamental.revenueGrowth ? result.fundamental.revenueGrowth > 10 : undefined} />
                  <ValueBadge label="EPS Growth" value={formatPercent(result.fundamental.epsGrowth)} isPositive={result.fundamental.epsGrowth ? result.fundamental.epsGrowth > 10 : undefined} />
                  <ValueBadge label="Profit Margin" value={formatPercent(result.fundamental.profitMargin)} isPositive={result.fundamental.profitMargin ? result.fundamental.profitMargin > 15 : undefined} />
                  <ValueBadge label="ROE" value={formatPercent(result.fundamental.roe)} isPositive={result.fundamental.roe ? result.fundamental.roe > 15 : undefined} />
                </div>
              </div>

              {/* Technicals */}
              <div className="glass-panel p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
                  <h3 className="text-xl font-bold tracking-tight">Technicals</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Score</span>
                    <span className="font-mono font-bold text-2xl text-accent-foreground">{result.technical.score.toFixed(1)} <span className="text-sm text-muted-foreground">/ 5</span></span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <ValueBadge label="RSI (14)" value={formatNumber(result.technical.rsi)} isPositive={result.technical.rsi ? (result.technical.rsi > 30 && result.technical.rsi < 70) : undefined} />
                  <div className="flex flex-col gap-1 p-3 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">MACD Signal</span>
                    <span className="font-sans font-bold text-lg">{result.technical.macdSignal || "—"}</span>
                  </div>
                  <div className="flex flex-col gap-1 p-3 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">SMA 50 {">"} 200</span>
                    <span className={cn("font-sans font-bold text-lg", result.technical.sma50Above200 ? "text-success" : "text-destructive")}>
                      {result.technical.sma50Above200 ? "Bullish (Yes)" : "Bearish (No)"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 p-3 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Price vs 52W High</span>
                    <span className="font-mono font-bold text-lg">{formatPercent(result.technical.priceVs52WeekHigh)}</span>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
