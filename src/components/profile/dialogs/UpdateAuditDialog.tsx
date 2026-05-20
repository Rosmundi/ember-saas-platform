// src/components/profile/dialogs/UpdateAuditDialog.tsx — v3.8.8
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { useProfileAudit } from "@/hooks/useProfileAudit";

interface UpdateAuditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpdateAuditDialog({ open, onOpenChange }: UpdateAuditDialogProps) {
  const [feedback, setFeedback] = useState("");
  const { runAudit, running } = useProfileAudit();

  const onSubmit = async () => {
    const res = await runAudit({ feedback_utente: feedback.trim() || undefined });
    if (res) {
      setFeedback("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Aggiorna l'audit del profilo</DialogTitle>
          <DialogDescription>
            Ember riscarica il tuo profilo LinkedIn da Apify e rigenera l'audit completo.
            Lo stato attuale del profilo resta sempre fedele a LinkedIn — il feedback
            influenza solo le riscritture proposte.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="audit-feedback">
            Cosa vuoi cambiare? <span className="text-muted-foreground">(opzionale)</span>
          </Label>
          <Textarea
            id="audit-feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Es: 'Ha esagerato col CRM, vorrei meno monodirezionale. Sono un consulente sviluppo commerciale che usa CRM come strumento, non come identità.'"
            rows={5}
            className="resize-none"
            disabled={running}
          />
          <p className="text-xs text-muted-foreground">
            Se lasci vuoto, Ember rifà l'audit così com'è. Se scrivi un feedback,
            riscrive Headline, About e posizionamento nella direzione che indichi.
          </p>
        </div>

        <div className="flex items-start gap-2 rounded-md bg-amber-500/10 border border-amber-500/30 p-3">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-200 leading-relaxed">
            Consuma <strong>1 scrape Apify</strong> + 1 skill-run.
            Lo scrape garantisce che l'audit lavori su dati LinkedIn freschi, non su cache interne.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={running}
          >
            Annulla
          </Button>
          <Button onClick={onSubmit} disabled={running} className="gap-2">
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Aggiorna audit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
