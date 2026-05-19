// src/components/profile/dialogs/RawLinkedInDialog.tsx — v3.8.7
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useProfile } from "@/hooks/useProfile";

export function RawLinkedInDialog({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const { profile } = useProfile();
  const raw = profile?.raw_profile_data;

  const displayRaw = raw ? { ...raw } : {};
  delete (displayRaw as any).audit;
  delete (displayRaw as any).audit_at;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profilo LinkedIn grezzo</DialogTitle>
          <DialogDescription>
            Dati estratti da LinkedIn l'ultima volta che hai runnato "Aggiorna audit". Sono i dati che Ember usa per generare audit, post e ricerche.
          </DialogDescription>
        </DialogHeader>
        <pre className="text-xs bg-muted/30 p-4 rounded-md overflow-x-auto whitespace-pre-wrap font-mono">
          {JSON.stringify(displayRaw, null, 2)}
        </pre>
      </DialogContent>
    </Dialog>
  );
}
