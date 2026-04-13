import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ScoreBadge({ score, size = 'md', className }: ScoreBadgeProps) {
  const colorClass = score > 70 ? 'bg-success/20 text-success border-success/30' 
    : score >= 40 ? 'bg-warning/20 text-warning border-warning/30' 
    : 'bg-destructive/20 text-destructive border-destructive/30';

  const sizeClass = size === 'lg' ? 'w-20 h-20 text-2xl' 
    : size === 'md' ? 'w-12 h-12 text-base' 
    : 'w-8 h-8 text-xs';

  return (
    <div className={cn("rounded-full border-2 flex items-center justify-center font-bold", colorClass, sizeClass, className)}>
      {score}
    </div>
  );
}
