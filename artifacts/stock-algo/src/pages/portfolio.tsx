import { useState } from "react";
import { useGetPortfolio, useAppAddPosition, useAppUpdatePosition, useAppDeletePosition } from "@/hooks/use-app-queries";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { TierBadge, SignalBadge } from "@/components/ui/Badges";
import { Plus, MoreHorizontal, Check, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

const addSchema = z.object({
  ticker: z.string().min(1).toUpperCase(),
  shares: z.coerce.number().min(0.01),
  entryPrice: z.coerce.number().min(0.01),
  notes: z.string().optional(),
});

export default function Portfolio() {
  const { data, isLoading } = useGetPortfolio();
  const [showAdd, setShowAdd] = useState(false);
  
  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading portfolio...</div>;

  const positions = data?.positions || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Holdings</h1>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> Add Position
        </button>
      </div>

      {showAdd && <AddPositionModal onClose={() => setShowAdd(false)} />}

      <div className="glass-panel rounded-2xl overflow-hidden border border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-muted/30 border-b border-border/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Asset</th>
                <th className="px-6 py-4 font-semibold">Shares</th>
                <th className="px-6 py-4 font-semibold">Avg Cost</th>
                <th className="px-6 py-4 font-semibold">Current</th>
                <th className="px-6 py-4 font-semibold text-right">Total Return</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {positions.map((pos) => {
                const isPos = (pos.unrealizedPnl || 0) >= 0;
                const isClosed = pos.status === 'closed';
                return (
                  <tr key={pos.id} className={`hover:bg-muted/20 transition-colors ${isClosed ? 'opacity-50 grayscale' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-base text-foreground">{pos.ticker}</span>
                        <TierBadge tier={pos.tier} className="scale-90" />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono">{pos.shares}</td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">{formatCurrency(pos.entryPrice)}</td>
                    <td className="px-6 py-4 font-mono">{isClosed ? formatCurrency(pos.exitPrice) : formatCurrency(pos.currentPrice)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className={`font-mono font-bold ${isClosed ? 'text-foreground' : isPos ? 'text-success' : 'text-destructive'}`}>
                        {isClosed ? formatCurrency(pos.realizedPnl) : formatCurrency(pos.unrealizedPnl)}
                      </div>
                      {!isClosed && (
                        <div className={`text-xs font-mono mt-0.5 ${isPos ? 'text-success/80' : 'text-destructive/80'}`}>
                          {isPos ? '+' : ''}{formatPercent(pos.unrealizedPnlPct)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${isClosed ? 'bg-muted text-muted-foreground' : 'bg-primary/20 text-primary'}`}>
                        {pos.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <PositionActions pos={pos} />
                    </td>
                  </tr>
                );
              })}
              {positions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Briefcase className="w-12 h-12 opacity-20 mb-2" />
                      <p>Your portfolio is empty.</p>
                      <button onClick={() => setShowAdd(true)} className="text-primary font-medium hover:underline mt-2">Add your first position</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Briefcase(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
}

function PositionActions({ pos }: { pos: any }) {
  const [open, setOpen] = useState(false);
  const updateMut = useAppUpdatePosition();
  const deleteMut = useAppDeletePosition();
  const { toast } = useToast();

  const handleClose = () => {
    const price = prompt("Enter exit price:");
    if (!price || isNaN(Number(price))) return;
    
    updateMut.mutate({ id: pos.id, data: { status: 'closed', exitPrice: Number(price) } }, {
      onSuccess: () => toast({ title: "Position closed" })
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this record?")) {
      deleteMut.mutate(pos.id, {
        onSuccess: () => toast({ title: "Position deleted" })
      });
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-2 rounded hover:bg-muted text-muted-foreground transition-colors">
        <MoreHorizontal className="w-4 h-4" />
      </button>
      
      {open && (
        <div className="absolute right-0 top-full mt-1 w-32 glass-panel border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in duration-150">
          {pos.status === 'open' && (
            <button onClick={handleClose} className="w-full text-left px-4 py-2 text-sm hover:bg-muted/50 transition-colors">
              Close Position
            </button>
          )}
          <button onClick={handleDelete} className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors">
            Delete Record
          </button>
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}

function AddPositionModal({ onClose }: { onClose: () => void }) {
  const addMut = useAppAddPosition();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof addSchema>>({
    resolver: zodResolver(addSchema),
    defaultValues: { ticker: "", shares: 0, entryPrice: 0, notes: "" }
  });

  const onSubmit = (values: z.infer<typeof addSchema>) => {
    addMut.mutate(values, {
      onSuccess: () => {
        toast({ title: "Position added" });
        onClose();
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md glass-panel border border-border/50 rounded-2xl shadow-2xl p-6 relative"
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-bold mb-6">Add Manual Position</h2>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Ticker Symbol</label>
            <input {...form.register("ticker")} className="w-full p-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono uppercase" placeholder="AAPL" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Shares</label>
              <input type="number" step="any" {...form.register("shares")} className="w-full p-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono" placeholder="100" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Avg Cost</label>
              <input type="number" step="any" {...form.register("entryPrice")} className="w-full p-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono" placeholder="150.00" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Notes (Optional)</label>
            <textarea {...form.register("notes")} className="w-full p-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[80px]" placeholder="Reason for entering..." />
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-border hover:bg-muted font-semibold transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={addMut.isPending} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
              {addMut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Save</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
