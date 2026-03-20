import { useGetPortfolio, useGetRecommendations } from "@/hooks/use-app-queries";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Activity, Target, AlertTriangle } from "lucide-react";
import { TierBadge, SignalBadge } from "@/components/ui/Badges";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: portfolioRes, isLoading: pLoading } = useGetPortfolio();
  const { data: recsRes, isLoading: rLoading } = useGetRecommendations({ limit: 5 });

  const summary = portfolioRes?.summary;
  const positions = portfolioRes?.positions || [];
  const topRecs = recsRes?.items || [];

  if (pLoading || rLoading) {
    return <div className="h-full flex items-center justify-center text-muted-foreground">Loading dashboard data...</div>;
  }

  const isProfitable = summary && summary.totalUnrealizedPnl >= 0;

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={item} className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Total Value</h3>
          <p className="text-3xl font-mono font-bold text-foreground">{formatCurrency(summary?.totalValue || 0)}</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Cost: {formatCurrency(summary?.totalCost || 0)}</span>
          </div>
        </motion.div>

        <motion.div variants={item} className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className={`absolute inset-0 bg-gradient-to-br ${isProfitable ? 'from-success/10' : 'from-destructive/10'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Unrealized P&L</h3>
          <div className="flex items-end gap-3">
            <p className={`text-3xl font-mono font-bold ${isProfitable ? 'text-success glow-success' : 'text-destructive glow-danger'}`}>
              {summary && summary.totalUnrealizedPnl > 0 ? '+' : ''}{formatCurrency(summary?.totalUnrealizedPnl || 0)}
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1.5">
            {isProfitable ? <ArrowUpRight className="w-4 h-4 text-success" /> : <ArrowDownRight className="w-4 h-4 text-destructive" />}
            <span className={`text-sm font-bold ${isProfitable ? 'text-success' : 'text-destructive'}`}>
              {formatPercent(summary?.totalUnrealizedPnlPct || 0)}
            </span>
            <span className="text-xs text-muted-foreground ml-1">all time</span>
          </div>
        </motion.div>

        <motion.div variants={item} className="glass-panel p-6 rounded-2xl">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Realized P&L</h3>
          <p className="text-3xl font-mono font-bold text-foreground">{formatCurrency(summary?.totalRealizedPnl || 0)}</p>
          <div className="mt-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Closed pos: {summary?.closedPositions || 0}</span>
          </div>
        </motion.div>

        <motion.div variants={item} className="glass-panel p-6 rounded-2xl">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Win Rate</h3>
          <p className="text-3xl font-mono font-bold text-primary">{formatPercent(summary?.winRate || 0)}</p>
          <div className="mt-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Active pos: {summary?.openPositions || 0}</span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Active Positions Preview */}
        <motion.div variants={item} className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Active Positions</h2>
            <Link href="/portfolio" className="text-sm text-primary hover:text-primary/80 transition-colors font-medium flex items-center gap-1">
              View all <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="glass-panel rounded-2xl overflow-hidden border border-border/50">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/30 border-b border-border/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-semibold">Asset</th>
                  <th className="px-6 py-4 font-semibold">Tier</th>
                  <th className="px-6 py-4 font-semibold text-right">Current</th>
                  <th className="px-6 py-4 font-semibold text-right">Return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {positions.filter(p => p.status === 'open').slice(0, 5).map((pos) => {
                  const isPos = (pos.unrealizedPnl || 0) >= 0;
                  return (
                    <tr key={pos.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-base text-foreground group-hover:text-primary transition-colors">{pos.ticker}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[120px]">{pos.companyName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <TierBadge tier={pos.tier} />
                      </td>
                      <td className="px-6 py-4 text-right font-mono">
                        {formatCurrency(pos.currentPrice)}
                      </td>
                      <td className={`px-6 py-4 text-right font-mono font-bold ${isPos ? 'text-success' : 'text-destructive'}`}>
                        {isPos ? '+' : ''}{formatPercent(pos.unrealizedPnlPct)}
                      </td>
                    </tr>
                  );
                })}
                {positions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      No active positions in portfolio.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Top Recommendations */}
        <motion.div variants={item} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Top Signals</h2>
            <Link href="/recommendations" className="text-sm text-primary hover:text-primary/80 transition-colors font-medium">
              Explore
            </Link>
          </div>

          <div className="space-y-3">
            {topRecs.map((rec) => (
              <div key={rec.ticker} className="glass-panel p-4 rounded-xl flex items-center justify-between group hover:border-primary/50 transition-all cursor-pointer">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono font-bold text-lg text-foreground group-hover:text-primary transition-colors">{rec.ticker}</span>
                    <TierBadge tier={rec.tier} className="scale-90 origin-left" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground">{formatCurrency(rec.currentPrice)}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Activity className="w-3 h-3" /> {rec.overallScore.toFixed(0)} score
                    </span>
                  </div>
                </div>
                <SignalBadge signal={rec.entrySignal} />
              </div>
            ))}
            {topRecs.length === 0 && (
              <div className="glass-panel p-8 rounded-xl text-center text-muted-foreground">
                Run analysis to generate signals.
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
