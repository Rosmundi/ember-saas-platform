import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PLAN_LIMITS } from "@/lib/ember-types";
import { Plus, Trash2, Radar, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface WatchlistItem {
  id: string;
  linkedin_url: string;
  nome: string | null;
  headline: string | null;
  azienda: string | null;
  last_scraped_at: string | null;
  last_snapshot: any;
}

export default function Watchlist() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState("");
  const [open, setOpen] = useState(false);

  const plan = profile?.plan || 'trial';
  const maxItems = PLAN_LIMITS[plan]?.watchlist || 3;

  const fetchItems = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleAdd = async () => {
    if (!user) return;
    if (!newUrl.startsWith("https://www.linkedin.com/in/") && !newUrl.startsWith("https://linkedin.com/in/")) {
      toast.error("URL LinkedIn non valido");
      return;
    }
    if (items.length >= maxItems) {
      toast.error("Hai raggiunto il limite di profili in watchlist per il tuo piano.");
      return;
    }
    await supabase.from('watchlist').insert({ user_id: user.id, linkedin_url: newUrl });
    setNewUrl("");
    setOpen(false);
    toast.success("Profilo aggiunto alla watchlist");
    fetchItems();
  };

  const handleRemove = async (id: string) => {
    await supabase.from('watchlist').delete().eq('id', id);
    setItems(items.filter(i => i.id !== id));
    toast.success("Profilo rimosso");
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between animate-in">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Radar className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">Watchlist</span>
            </div>
            <h1 className="text-2xl font-bold">La tua watchlist</h1>
            <div className="flex items-center gap-2 mt-1">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                <span className="font-medium text-foreground">{items.length}</span>/{maxItems} profili
              </p>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                <Plus className="h-4 w-4 mr-1" /> Aggiungi profilo
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/50 backdrop-blur-md">
              <DialogHeader><DialogTitle>Aggiungi profilo alla watchlist</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <Input placeholder="https://www.linkedin.com/in/profilo" value={newUrl} onChange={e => setNewUrl(e.target.value)} className="bg-surface border-border/50 focus:border-primary h-11" />
                <Button onClick={handleAdd} className="w-full bg-primary hover:bg-primary-hover text-primary-foreground h-11 shadow-lg shadow-primary/20">Aggiungi</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-card/30 rounded-xl border border-dashed border-border/50 animate-in">
            <Radar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nessun profilo in watchlist.</p>
            <p className="text-muted-foreground text-xs mt-1">Aggiungi profili per monitorare segnali su cambi ruolo, promozioni e post virali.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, i) => (
              <Card key={item.id}
                className="bg-card/60 border-border/50 hover:bg-card hover:border-border transition-all duration-200 group"
                style={{ animationDelay: `${i * 60}ms` }}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-muted-foreground text-sm font-bold shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {(item.nome || 'P').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm group-hover:text-primary transition-colors">{item.nome || 'Profilo'}</h3>
                    <p className="text-xs text-muted-foreground truncate">{item.headline || item.linkedin_url}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-muted-foreground">{item.azienda || '—'}</span>
                      <span className="text-muted-foreground/30">·</span>
                      <span className="text-xs text-muted-foreground/50">Nessun segnale</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(item.id)}
                    className="text-muted-foreground/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all shrink-0">
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