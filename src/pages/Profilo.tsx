// src/pages/Profilo.tsx — v3.8.7 Consolidate (Opzione B)
// 2 sezioni vere (Stato + Audit). Tutto il resto è chrome: header, brand widget,
// footer azioni, modal raw LinkedIn.
import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverTrigger, PopoverContent,
} from "@/components/ui/popover";
import { RefreshCw, Palette, ImagePlus, FileText, Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { OnboardingEmptyState } from "@/components/profile/OnboardingEmptyState";
import { StatoSection } from "@/components/profile/StatoSection";
import { AuditSection } from "@/components/profile/AuditSection";
import { ProfileHeaderCard } from "@/components/profile/ProfileHeaderCard";
import { BrandVoiceWidget } from "@/components/profile/BrandVoiceWidget";
import { UpdateAuditDialog } from "@/components/profile/dialogs/UpdateAuditDialog";
import { BannerBriefDialog } from "@/components/profile/dialogs/BannerBriefDialog";
import { RawLinkedInDialog } from "@/components/profile/dialogs/RawLinkedInDialog";

export default function Profilo() {
  const { profile, loading, onboardingCompleted } = useProfile();
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);
  const [rawDialogOpen, setRawDialogOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Compat redirect legacy: ?action=reaudit / ?action=rescan
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "reaudit" || action === "rescan") {
      setAuditDialogOpen(true);
    }
    if (action) {
      const next = new URLSearchParams(searchParams);
      next.delete("action");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hash scroll
  useEffect(() => {
    if (!location.hash) return;
    requestAnimationFrame(() => {
      const el = document.getElementById(location.hash.slice(1));
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location.hash, loading]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!profile || !onboardingCompleted || !profile.business_profile) {
    return (
      <AppLayout>
        <OnboardingEmptyState />
      </AppLayout>
    );
  }

  // v3.8.7: audit data ora vive in raw_profile_data.audit (snapshot ultimo audit).
  // Fallback su shape legacy (raw_profile_data root) per audit pre-v3.8.7.
  const raw = (profile.raw_profile_data || {}) as Record<string, any>;
  const audit = raw.audit ?? {
    score_complessivo: raw.score_totale || raw.score_complessivo,
    score_breakdown: raw.score_breakdown,
    sezioni: raw.sezioni,
    priorita_top_3: raw.priorita_top_3 || raw.azioni_prioritarie,
    sintesi: raw.sintesi,
    next_actions: raw.next_actions,
  };
  const hasAudit = audit && (audit.score_complessivo || audit.score_totale || (audit.sezioni && audit.sezioni.length));

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Il mio profilo</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tutto quello che Ember sa di te + le 3 cose da sistemare adesso.
            </p>
          </div>
          <div className="flex items-center gap-2" id="brand-voice" style={{ scrollMarginTop: 16 }}>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-border/50">
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-border/50"
                    style={{ backgroundColor: profile.brand_kit?.color || "#FF6A1C" }}
                  />
                  <span className="text-xs">{profile.brand_kit?.tone || "corporate"}</span>
                  <Palette className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="end">
                <BrandVoiceWidget />
              </PopoverContent>
            </Popover>
            <Button
              onClick={() => setAuditDialogOpen(true)}
              className="gap-2 bg-primary hover:bg-primary-hover text-primary-foreground"
            >
              <RefreshCw className="h-4 w-4" />
              Aggiorna audit
            </Button>
          </div>
        </div>

        {/* SEZIONE 1: STATO */}
        <div id="stato" style={{ scrollMarginTop: 16 }}>
          <StatoSection audit={hasAudit ? audit : null} />
        </div>

        {/* SEZIONE 2: AUDIT (header LinkedIn-like + 7 card sezione) */}
        <div className="space-y-4">
          <div id="chi-sei" style={{ scrollMarginTop: 16 }}>
            <ProfileHeaderCard
              businessProfile={profile.business_profile}
              profilePictureUrl={audit?.profile_picture_url ?? null}
              coverPictureUrl={audit?.cover_picture_url ?? null}
            />
          </div>
          <div id="audit" style={{ scrollMarginTop: 16 }}>
            <AuditSection sezioni={audit?.sezioni || []} />
          </div>
        </div>

        {/* FOOTER */}
        <Card className="border-dashed border-border/50">
          <CardContent className="p-5 flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-muted-foreground">Altre azioni sul profilo</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                id="banner"
                style={{ scrollMarginTop: 16 }}
                variant="outline"
                size="sm"
                onClick={() => setBannerDialogOpen(true)}
                className="gap-2 border-border/50"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                Crea brief banner
              </Button>
              <Button
                id="dati-linkedin"
                style={{ scrollMarginTop: 16 }}
                variant="ghost"
                size="sm"
                onClick={() => setRawDialogOpen(true)}
                className="gap-2"
              >
                <FileText className="h-3.5 w-3.5" />
                Vedi profilo grezzo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* DIALOGS */}
        <UpdateAuditDialog open={auditDialogOpen} onOpenChange={setAuditDialogOpen} />
        <BannerBriefDialog open={bannerDialogOpen} onOpenChange={setBannerDialogOpen} />
        <RawLinkedInDialog open={rawDialogOpen} onOpenChange={setRawDialogOpen} />
      </div>
    </AppLayout>
  );
}
