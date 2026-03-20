import { useGetRecommendations } from "@/hooks/use-app-queries";
import { formatCurrency } from "@/lib/utils";
import { TierBadge, SignalBadge } from "@/components/ui/Badges";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function Recommendations() {
  const { data, isLoading } = useGetRecommendations({ limit: 50 });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading recommendations...</div>;

  const items = data?.items || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Systematic Recommendations</h1>
          <p className="text-muted-foreground text-sm mt-1">Top rated stocks from historical analyses.</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-border/50">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-muted/30 border-b border-border/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-semibold">Asset</th>
              <th className="px-6 py-4 font-semibold text-center">Score</th>
              <th className="px-6 py-4 font-semibold">Tier</th>
              <th className="px-6 py-4 font-semibold">Signal</th>
              <th className="px-6 py-4 font-semibold text-right">Last Price</th>
              <th className="px-6 py-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {items.map((item, i) => (
              <motion.tr 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={item.ticker} 
                className="hover:bg-muted/20 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="font-mono font-bold text-base text-foreground">{item.ticker}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[150px]">{item.companyName || "—"}</div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-background border border-border font-mono font-bold text-primary shadow-inner">
                    {item.overallScore.toFixed(0)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <TierBadge tier={item.tier} />
                </td>
                <td className="px-6 py-4">
                  <SignalBadge signal={item.entrySignal} />
                </td>
                <td className="px-6 py-4 text-right font-mono text-muted-foreground">
                  {formatCurrency(item.currentPrice)}
                </td>
                <td className="px-6 py-4 text-right">
                   <Link href={`/analyze?ticker=${item.ticker}`} className="text-primary hover:text-primary/80 font-medium text-sm transition-colors hover:underline">
                     Re-analyze
                   </Link>
                </td>
              </motion.tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  No recommendations found. Analyze more stocks.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
