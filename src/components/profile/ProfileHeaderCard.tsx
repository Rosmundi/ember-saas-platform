// src/components/profile/ProfileHeaderCard.tsx — v3.8.7
// Header LinkedIn-like read-only del business_profile. Sostituisce ChiSeiSection (form).
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BusinessProfile } from "@/lib/ember-types";

export function ProfileHeaderCard({ businessProfile }: { businessProfile: BusinessProfile }) {
  return (
    <Card className="bg-card border-border/50 overflow-hidden">
      <CardContent className="p-6 space-y-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">
            Come ti vede Ember adesso
          </p>
          <h2 className="text-xl font-bold leading-tight">{businessProfile.nome}</h2>
        </div>
        {businessProfile.headline && (
          <p className="text-base leading-relaxed">{businessProfile.headline}</p>
        )}
        {businessProfile.settore && (
          <p className="text-sm text-muted-foreground">{businessProfile.settore}</p>
        )}
        {businessProfile.value_proposition && (
          <div className="pt-2 border-t border-border/30">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">
              Value proposition
            </p>
            <p className="text-sm leading-relaxed">{businessProfile.value_proposition}</p>
          </div>
        )}
        {businessProfile.tags?.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2">
            {businessProfile.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground pt-2 italic">
          Per modificare cosa scrive Ember su di te, usa "Aggiorna audit" in alto e descrivi cosa vuoi cambiare.
        </p>
      </CardContent>
    </Card>
  );
}
