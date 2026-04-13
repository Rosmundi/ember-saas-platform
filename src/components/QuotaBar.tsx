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
    <div className={cn("space-y-1.5", className)}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-medium", isOver90 ? "text-destructive" : "text-foreground")}>
          {used}/{total}
        </span>
      </div>
      <Progress 
        value={pct} 
        className={cn("h-2", isOver90 && "[&>div]:bg-destructive")} 
      />
    </div>
  );
}
