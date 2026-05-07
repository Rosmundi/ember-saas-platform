// src/components/content/ContentRail.tsx
// ============================================================================
// Right rail "Le tue generazioni recenti" riutilizzabile per le skill di
// content writing. Mostra ultimi N asset di un certo type, click → riapri.
// ============================================================================

import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History as HistoryIcon, Star } from "lucide-react";
import {
  useRecentContentAssets,
  contentTypeLabel,
  contentTypeColor,
  contentTypeToSkillId,
  type ContentAssetType,
  type ContentAssetRow,
} from "@/hooks/useContentAssets";

function formatRelative(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000; // sec
    if (diff < 60) return "ora";
    if (diff < 3600) return `${Math.floor(diff / 60)} min fa`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h fa`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} g fa`;
    return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
  } catch {
    return "";
  }
}

interface Props {
  type: ContentAssetType;
  /** label personalizzato per il titolo. Default: "Le tue {type} recenti" */
  title?: string;
  /** N. max items da mostrare. Default 8 */
  limit?: number;
}

export function ContentRail({ type, title, limit = 8 }: Props) {
  const { assets, loading } = useRecentContentAssets(type, limit);
  const skillId = contentTypeToSkillId(type);
  const heading = title || `${contentTypeLabel(type)} recenti`;

  return (
    <aside className="space-y-3 animate-in lg:sticky lg:top-20 lg:self-start">
      <Card className="bg-card/80 border-border/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <HistoryIcon className="h-4 w-4 text-primary" />
              {heading}
            </h3>
            {assets.length > 0 && (
              <Link
                to={`/content?type=${type}`}
                className="text-[11px] text-muted-foreground hover:text-primary"
              >
                Vedi tutti
              </Link>
            )}
          </div>

          {loading && <p className="text-xs text-muted-foreground py-2">Caricamento…</p>}

          {!loading && assets.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">
              Nessuna generazione ancora. Falla qui sopra.
            </p>
          )}

          {!loading && assets.length > 0 && (
            <ul className="space-y-1">
              {assets.map((a: ContentAssetRow) => (
                <li key={a.id}>
                  <Link
                    to={`/skill/${skillId}?assetId=${a.id}`}
                    className="block p-2 rounded-lg hover:bg-accent/60 transition-colors group"
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      {a.starred && <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />}
                      <span className="text-[10px] text-muted-foreground">{formatRelative(a.created_at)}</span>
                    </div>
                    <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                      {a.title}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}
