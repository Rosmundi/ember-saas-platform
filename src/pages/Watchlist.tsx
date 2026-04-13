import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { mockWatchlist } from "@/lib/mock-data";
import { mockProfile } from "@/lib/mock-data";
import { PLAN_LIMITS } from "@/lib/ember-types";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const signalColors: Record<string, string> = {
  promozione: 'bg-layer-profilo/20 text-layer-profilo',
  post_virale: 'bg-primary/20 text-primary',
  nuovo_ruolo: 'bg-success/20 text-success',
};

export default function Watchlist() {
  const [items, setItems] = useState(mockWatchlist);
  const [newUrl, setNewUrl] = useState("");
  const [open, setOpen] = useState(false);
  const maxItems = PLAN_LIMITS[mockProfile.plan].watchlist;

  const handleAdd = () => {
    if (!newUrl.startsWith("https://www.linkedin.com/in/") && !newUrl.startsWith("https://linkedin.com/in/")) {
      toast.error("URL LinkedIn non valido");
      return;
    }
    if (items.length >= maxItems) {
      toast.error("Hai raggiunto il limite di profili in watchlist per il tuo piano.");
      return;
    }
    setItems([...items, { id: String(Date.now()), linkedin_url: newUrl, nome: 'Nuovo profilo', headline: '—', azienda: '—', last_scraped_at: null }]);
    setNewUrl("");
    setOpen(false);
    toast.success("Profilo aggiunto alla watchlist");
  };

  const handleRemove = (id: string) => {
    setItems(items.filter(i => i.id !== id));
    toast.success("Profilo rimosso");
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">La tua watchlist</h1>
            <p className="text-muted-foreground text-sm mt-1">{items.length}/{maxItems} profili</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
                <Plus className="h-4 w-4 mr-1" /> Aggiungi profilo
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle>Aggiungi profilo alla watchlist</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <Input placeholder="https://www.linkedin.com/in/profilo" value={newUrl} onChange={e => setNewUrl(e.target.value)} className="bg-surface border-border" />
                <Button onClick={handleAdd} className="w-full bg-primary hover:bg-primary-hover text-primary-foreground">Aggiungi</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">Nessun profilo nella watchlist. Aggiungi profili da monitorare.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <Card key={item.id} className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm">{item.nome}</h3>
                    <p className="text-xs text-muted-foreground truncate">{item.headline}</p>
                    <p className="text-xs text-muted-foreground">{item.azienda}</p>
                    <div className="mt-1">
                      {item.last_signal ? (
                        <div className="flex items-center gap-2">
                          <Badge className={`text-[10px] ${signalColors[item.last_signal.type] || 'bg-muted'}`}>
                            {item.last_signal.type.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{item.last_signal.detail}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted">Nessun segnale</span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(item.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
