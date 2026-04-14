import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface QuotaBarProps {
  label: string;
  used: number;
  total: number;
  className?: string;
}

export function QuotaBar({ label, used, total, className }: QuotaBarProps) {
  const pct = total > 0 ? (used / total) * 100 : 0;
  const isOver90 = pct > 90;

  return (
    <div className={cn(
      "p-4 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-border",
      className
    )}>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className={cn(
          "font-bold tabular-nums transition-colors",
          isOver90 ? "text-destructive" : "text-foreground"
        )}>
          {used}<span className="text-muted-foreground font-normal">/{total}</span>
        </span>
      </div>
      <Progress
        value={pct}
        className={cn(
          "h-2 bg-surface-hover/50",
          isOver90 && "[&>div]:bg-destructive"
        )}
      />
      {isOver90 && (
        <p className="text-[11px] text-destructive mt-1.5 animate-in">
          ⚠ Quasi esaurito
        </p>
      )}
    </div>
  );
}
