// src/components/profile/ProfileHeaderCard.tsx — v3.8.9
// Header LinkedIn-like con banner + foto profilo reali (pass-through da audit).
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageOff } from "lucide-react";
import type { BusinessProfile } from "@/lib/ember-types";

interface ProfileHeaderCardProps {
  businessProfile: BusinessProfile;
  // v3.8.9: URL pass-through da auto-profile-setup
  profilePictureUrl?: string | null;
  coverPictureUrl?: string | null;
}

export function ProfileHeaderCard({
  businessProfile,
  profilePictureUrl,
  coverPictureUrl,
}: ProfileHeaderCardProps) {
  return (
    <Card className="border-border/50 overflow-visible">
      {/* Banner */}
      <div className="relative h-32 sm:h-40 bg-muted/30 rounded-t-lg overflow-hidden">
        {coverPictureUrl ? (
          <img
            src={coverPictureUrl}
            alt="Banner LinkedIn"
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ImageOff className="h-6 w-6" />
            <span className="ml-2 text-xs">Nessun banner</span>
          </div>
        )}
        {/* Foto profilo sovrapposta */}
        <div className="absolute -bottom-16 left-6">
          {profilePictureUrl ? (
            <img
              src={profilePictureUrl}
              alt="Foto profilo LinkedIn"
              className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border-4 border-card object-cover bg-card shadow-lg"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border-4 border-card bg-muted flex items-center justify-center shadow-lg">
              <span className="text-4xl text-muted-foreground">?</span>
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-6 pt-20 space-y-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">
            Come ti vede Ember adesso
          </p>
          <h2 className="text-xl font-bold leading-tight">{businessProfile.nome}</h2>
        </div>
        <p className="text-base leading-relaxed">{businessProfile.headline}</p>
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
        {businessProfile.tags && businessProfile.tags.length > 0 && (
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
