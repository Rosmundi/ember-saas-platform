// src/components/profile/dialogs/BannerBriefDialog.tsx — v3.8.7
// Estratto da Profilo.tsx v3.8.6. Identico, solo extract.
import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useSkillRuns } from "@/hooks/useSkillRuns";
import { callSkill, emberErrorMessage } from "@/lib/ember-api";

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setDone(true);
        toast.success("Copiato!");
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? (
        <CheckCircle className="h-3 w-3 mr-1 text-emerald-400" />
      ) : (
        <Copy className="h-3 w-3 mr-1" />
      )}
      {done ? "Copiato" : "Copia"}
    </Button>
  );
}

export function BannerBriefDialog({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const { user } = useAuth();
  const { profile, consumeSkillRun } = useProfile();
  const { logRun } = useSkillRuns();
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<any>(null);

  const generate = async () => {
    if (!user || !profile) return;
    setLoading(true);
    const start = Date.now();
    const result = await callSkill("profile-banner-brief", {
      user_id: user.id,
      profilo_business: profile.business_profile,
      brand_kit: (profile as any).brand_kit || {},
    });
    if (!result.ok) {
      setLoading(false);
      const err = (result as { ok: false; error: any }).error;
      toast.error(emberErrorMessage(err));
      await logRun({
        skill: "profile-banner-brief",
        input: {},
        output: null,
        status: "error",
        is_scrape: false,
        error_message: err.message,
      });
      return;
    }
    setOutput(result.data);
    await logRun({
      skill: "profile-banner-brief",
      input: {},
      output: result.data,
      status: "completed",
      is_scrape: false,
      duration_ms: Date.now() - start,
    });
    await consumeSkillRun(false);
    setLoading(false);
  };

  useEffect(() => {
    if (open && !output && !loading) generate();
    if (!open) setOutput(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Brief banner LinkedIn (1584×396)</DialogTitle>
          <DialogDescription>
            Concept + palette + 3 prompt da incollare su Midjourney/Flux/DALL·E.
          </DialogDescription>
        </DialogHeader>
        {loading && (
          <div className="py-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          </div>
        )}
        {output && (
          <div className="space-y-4 text-sm">
            {output.concept && (
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Concept</p>
                <p>{output.concept}</p>
              </div>
            )}
            {output.palette && (
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Palette</p>
                <div className="flex gap-2">
                  {(Array.isArray(output.palette) ? output.palette : Object.values(output.palette)).map(
                    (c: any, i: number) => (
                      <div
                        key={i}
                        className="w-12 h-12 rounded-lg border border-border/30"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ),
                  )}
                </div>
              </div>
            )}
            {output.prompts && Array.isArray(output.prompts) && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Prompt</p>
                {output.prompts.map((p: any, i: number) => (
                  <div key={i} className="bg-surface/50 p-3 rounded-lg border border-border/30">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-xs whitespace-pre-wrap flex-1 font-mono">
                        {typeof p === "string" ? p : p.prompt || JSON.stringify(p)}
                      </p>
                      <CopyBtn text={typeof p === "string" ? p : p.prompt || ""} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {output.safe_zone && (
              <div className="text-xs text-muted-foreground">
                <strong>Safe zone:</strong> {output.safe_zone}
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          {output && (
            <Button
              variant="outline"
              onClick={() => {
                setOutput(null);
                generate();
              }}
              disabled={loading}
              className="border-border/50"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Rigenera
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Chiudi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
