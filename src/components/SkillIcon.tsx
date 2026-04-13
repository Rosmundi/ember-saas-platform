import {
  UserCheck, Award, PenTool, Image, BarChart3,
  Target, Search, Send, MessageSquare, Radar,
  LucideProps,
} from "lucide-react";

const iconMap: Record<string, React.FC<LucideProps>> = {
  UserCheck, Award, PenTool, Image, BarChart3,
  Target, Search, Send, MessageSquare, Radar,
};

interface SkillIconProps extends LucideProps {
  name: string;
}

export function SkillIcon({ name, ...props }: SkillIconProps) {
  const Icon = iconMap[name];
  if (!Icon) return null;
  return <Icon {...props} />;
}
