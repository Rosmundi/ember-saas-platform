import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ScoreBadge({ score, size = 'md', className }: ScoreBadgeProps) {
  const colorClass = score > 70 ? 'bg-success/15 text-success border-success/30 shadow-[0_0_12px_hsl(160_84%_39%/0.15)]'
    : score >= 40 ? 'bg-warning/15 text-warning border-warning/30 shadow-[0_0_12px_hsl(38_92%_50%/0.15)]'
    : 'bg-destructive/15 text-destructive border-destructive/30 shadow-[0_0_12px_hsl(0_84%_60%/0.15)]';

  const sizeClass = size === 'lg' ? 'w-24 h-24 text-3xl'
    : size === 'md' ? 'w-12 h-12 text-base'
    : 'w-8 h-8 text-xs';

  return (
    <div className={cn(
      "rounded-full border-2 flex items-center justify-center font-bold transition-all duration-500 animate-in",
      colorClass, sizeClass, className
    )}>
      {score}
    </div>
  );
}
