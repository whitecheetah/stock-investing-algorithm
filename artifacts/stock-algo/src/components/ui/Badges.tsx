import { cn } from "@/lib/utils";

export function TierBadge({ tier, className }: { tier?: string | null, className?: string }) {
  if (!tier) return <span className="text-muted-foreground">—</span>;
  
  const styles: Record<string, string> = {
    "A+": "bg-success/15 text-success border-success/30 glow-success shadow-success/20",
    "A": "bg-primary/15 text-primary border-primary/30 glow-primary shadow-primary/20",
    "B": "bg-warning/15 text-warning border-warning/30 shadow-warning/10",
    "C": "bg-destructive/15 text-destructive border-destructive/30 glow-danger shadow-destructive/20",
  };

  return (
    <span className={cn(
      "px-2.5 py-0.5 rounded-md border font-mono font-bold text-xs inline-flex items-center justify-center shadow-sm",
      styles[tier] || "bg-muted text-muted-foreground border-border",
      className
    )}>
      {tier}
    </span>
  );
}

export function SignalBadge({ signal, className }: { signal?: string | null, className?: string }) {
  if (!signal) return <span className="text-muted-foreground">—</span>;

  const styles: Record<string, string> = {
    "Strong Buy": "bg-success text-success-foreground border-success glow-success animate-pulse",
    "Buy": "bg-success/20 text-success border-success/30",
    "Hold": "bg-warning/20 text-warning border-warning/30",
    "Wait": "bg-destructive/20 text-destructive border-destructive/30",
  };

  return (
    <span className={cn(
      "px-2.5 py-1 rounded-md border font-sans font-semibold text-xs inline-flex items-center justify-center tracking-wide uppercase",
      styles[signal] || "bg-muted text-muted-foreground border-border",
      className
    )}>
      {signal}
    </span>
  );
}

export function ValueBadge({ label, value, isPositive }: { label: string, value: string, isPositive?: boolean }) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-xl bg-muted/30 border border-border/50">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className={cn(
        "font-mono font-bold text-lg",
        isPositive === true && "text-success",
        isPositive === false && "text-destructive",
        isPositive === undefined && "text-foreground"
      )}>
        {value}
      </span>
    </div>
  );
}
