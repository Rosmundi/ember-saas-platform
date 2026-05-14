// src/components/SkillIcon.tsx
// v3.8.2 (Tranche 2): aggiunti ImagePlus (visual-brief) + Layers (carousel-brief) + Flag (profile-banner-brief).
// v3.8.1: aggiunti Wand2 (post-improver) + Zap (hook-generator) + Sparkles, Lightbulb (riserva).
import {
  UserCheck, Award, PenTool, Image, BarChart3,
  Target, Search, Send, MessageSquare, Radar,
  Wand2, Zap, Sparkles, Lightbulb,
  ImagePlus, Layers, Flag,
  LucideProps,
} from "lucide-react";

const iconMap: Record<string, React.FC<LucideProps>> = {
  UserCheck, Award, PenTool, Image, BarChart3,
  Target, Search, Send, MessageSquare, Radar,
  Wand2, Zap, Sparkles, Lightbulb,
  ImagePlus, Layers, Flag,
};

interface SkillIconProps extends LucideProps {
  name: string;
}

export function SkillIcon({ name, ...props }: SkillIconProps) {
  const Icon = iconMap[name];
  if (!Icon) return null;
  return <Icon {...props} />;
}
