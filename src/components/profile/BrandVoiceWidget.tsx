// src/components/profile/BrandVoiceWidget.tsx — v3.8.7
// Versione compatta della BrandVoiceSection, da usare in popover.
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import type { BrandKit } from "@/lib/ember-types";

function isValidHex(v: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v.trim());
}

export function BrandVoiceWidget() {
  const { profile, updateProfile } = useProfile();
  const [color, setColor] = useState<string>(profile?.brand_kit?.color || "#FF6A1C");
  const [tone, setTone] = useState<BrandKit["tone"]>(profile?.brand_kit?.tone || "corporate");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setColor(profile?.brand_kit?.color || "#FF6A1C");
    setTone(profile?.brand_kit?.tone || "corporate");
  }, [profile?.brand_kit]);

  const handleSave = async () => {
    if (!isValidHex(color)) {
      toast.error("Colore non valido");
      return;
    }
    setSaving(true);
    await updateProfile({ brand_kit: { color: color.toUpperCase(), tone } } as any);
    setSaving(false);
    toast.success("Brand voice salvata");
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">Brand voice</p>
      <div className="space-y-1.5">
        <Label htmlFor="bw-color" className="text-xs">Colore primario</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={isValidHex(color) ? color : "#FF6A1C"}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-12 rounded border border-border/50 cursor-pointer bg-surface"
          />
          <Input
            id="bw-color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 text-xs font-mono uppercase bg-surface border-border/50"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Tono di voce</Label>
        <Select value={tone} onValueChange={(v) => setTone(v as BrandKit["tone"])}>
          <SelectTrigger className="h-9 text-sm bg-surface border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="corporate">Corporate — autorevole, dati</SelectItem>
            <SelectItem value="playful">Playful — caldo, narrativo</SelectItem>
            <SelectItem value="minimal">Minimal — asciutto, secco</SelectItem>
            <SelectItem value="bold">Bold — contrarian, opinionato</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        size="sm"
        onClick={handleSave}
        disabled={saving}
        className="w-full gap-2 bg-primary hover:bg-primary-hover text-primary-foreground"
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        Salva
      </Button>
    </div>
  );
}
