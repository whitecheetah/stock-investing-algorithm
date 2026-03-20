import { useGetWatchlist, useAppRemoveFromWatchlist } from "@/hooks/use-app-queries";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { TierBadge, SignalBadge } from "@/components/ui/Badges";
import { Trash2, ExternalLink, Activity } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Watchlist() {
  const { data, isLoading } = useGetWatchlist();
  const removeMut = useAppRemoveFromWatchlist();
  const { toast } = useToast();

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading watchlist...</div>;

  const items = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Watchlist</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="glass-panel rounded-2xl p-5 flex flex-col group hover:border-primary/30 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-mono font-bold text-foreground group-hover:text-primary transition-colors">{item.ticker}</h3>
                <p className="text-sm text-muted-foreground truncate max-w-[180px]">{item.companyName || "Unknown"}</p>
              </div>
              <button 
                onClick={() => removeMut.mutate(item.id, { onSuccess: () => toast({ title: "Removed from watchlist" }) })}
                className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {item.lastAnalysis ? (
              <div className="space-y-4 flex-1">
                <div className="flex justify-between items-end">
                  <div className="text-2xl font-mono text-foreground">{formatCurrency(item.lastAnalysis.currentPrice)}</div>
                  <TierBadge tier={item.lastAnalysis.tier} />
                </div>
                
                <div className="bg-muted/30 rounded-xl p-3 border border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Score: <span className="font-mono">{item.lastAnalysis.overallScore.toFixed(0)}</span></span>
                  </div>
                  <SignalBadge signal={item.lastAnalysis.entrySignal} className="scale-90" />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-muted-foreground border-2 border-dashed border-border/50 rounded-xl bg-background/50">
                <p className="text-sm mb-2">No analysis yet</p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-border/50">
              <Link href={`/analyze?ticker=${item.ticker}`} className="w-full py-2.5 bg-background border border-border hover:border-primary hover:text-primary rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all">
                Run Analysis <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="col-span-full py-20 text-center glass-panel rounded-3xl border border-dashed border-border text-muted-foreground">
            <Eye className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Your watchlist is empty.</p>
            <p className="text-sm mt-1 mb-4">Run analysis on stocks to track them here.</p>
            <Link href="/analyze" className="text-primary hover:underline font-medium">Go to Analysis</Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Eye(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
}
