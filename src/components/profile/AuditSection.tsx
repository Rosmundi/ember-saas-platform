// src/components/profile/AuditSection.tsx — v3.8.7
import { SezioneCard } from "./SezioneCard";
import { Sparkles } from "lucide-react";

export function AuditSection({ sezioni }: { sezioni: any[] }) {
  if (!sezioni || sezioni.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Audit per sezione</h2>
      </div>
      <div className="space-y-2">
        {sezioni.map((s, i) => (
          <SezioneCard
            key={s.nome || s.sezione || i}
            {...s}
            defaultExpanded={i < 2}
          />
        ))}
      </div>
    </div>
  );
}
