// src/components/profile/dialogs/UpdateAuditDialog.tsx — v3.8.7
// Usa useProfileAudit. Permette feedback opzionale → re-audit completo con
// rigenerazione di business_profile se il flag arriva dal n8n.
import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";
import { useProfileAudit } from "@/hooks/useProfileAudit";

export function UpdateAuditDialog({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const { runQuickAudit, running } = useProfileAudit();
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!open) setFeedback("");
  }, [open]);

  const handleRun = async () => {
    const trimmed = feedback.trim();
    const res = await runQuickAudit({ feedback_utente: trimmed || undefined });
    if (res) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aggiorna audit</DialogTitle>
          <DialogDescription>
            Ricalcola score e riscritture. ~15s. Costa 1 skill-run.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="audit-feedback" className="text-xs">
            Cosa vuoi cambiare? (opzionale)
          </Label>
          <Textarea
            id="audit-feedback"
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Es. 'Ha esagerato col CRM, vorrei un posizionamento più ampio da consulente commerciale.'"
            className="bg-surface border-border/50 resize-none"
          />
          <p className="text-[11px] text-muted-foreground">
            Se compilato, l'audit viene rifatto da zero secondo le tue indicazioni
            (headline, about, priorità, business profile).
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={running}>
            Annulla
          </Button>
          <Button
            onClick={handleRun}
            disabled={running}
            className="bg-primary hover:bg-primary-hover text-primary-foreground"
          >
            {running ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Lancia audit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
