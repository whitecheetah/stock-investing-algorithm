import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ScoreRing({ score, size = 120, strokeWidth = 8, className }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  let colorClass = "text-destructive stroke-destructive";
  if (score >= 80) colorClass = "text-success stroke-success";
  else if (score >= 60) colorClass = "text-primary stroke-primary";
  else if (score >= 40) colorClass = "text-warning stroke-warning";

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      {/* Background track */}
      <svg className="absolute inset-0 w-full h-full -rotate-90 transform">
        <circle
          className="stroke-muted/30"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress ring */}
        <circle
          className={cn("transition-all duration-1000 ease-out", colorClass)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ filter: `drop-shadow(0 0 6px var(--tw-shadow-color))` }}
        />
      </svg>
      <div className="flex flex-col items-center justify-center">
        <span className={cn("text-3xl font-mono font-bold tracking-tighter", colorClass.split(' ')[0])}>
          {Math.round(score)}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mt-0.5">
          Score
        </span>
      </div>
    </div>
  );
}
