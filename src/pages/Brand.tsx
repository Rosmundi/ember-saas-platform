// src/pages/Brand.tsx
// ============================================================================
// Pagina "Il mio Brand" — gestione brand kit (color primario + tone of voice).
// Persisti su profiles.brand_kit JSONB (migration 012).
// I valori vengono usati da: post-writer, post-improver, hook-generator e
// in futuro dai workflow visual-brief / carousel-brief.
//
// UX minimale: 1 colore + 1 dropdown. Niente upload logo, niente font (rimandati).
// ============================================================================

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Palette, Loader2, Save, RotateCcw } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import type { BrandKit } from "@/lib/ember-types";

const DEFAULT_BRAND: BrandKit = { color: "#FF6A1C", tone: "corporate" };

const TONE_OPTIONS: Array<{ value: BrandKit["tone"]; label: string; description: string }> = [
  {
    value: "corporate",
    label: "Corporate",
    description: "Professionale, autorevole, dati e numeri.",
  },
  {
    value: "playful",
    label: "Playful",
    description: "Caldo, ironico, narrativo, accessibile.",
  },
  {
    value: "minimal",
    label: "Minimal",
    description: "Asciutto, secco, frasi corte, niente fronzoli.",
  },
  {
    value: "bold",
    label: "Bold",
    description: "Contrarian, opinionato, polarizzante con argomenti.",
  },
];

function isValidHex(v: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v.trim());
}

export default function Brand() {
  const { profile, loading, updateProfile } = useProfile();
  const [color, setColor] = useState<string>(DEFAULT_BRAND.color);
  const [tone, setTone] = useState<BrandKit["tone"]>(DEFAULT_BRAND.tone);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const bk = ((profile as any).brand_kit ?? {}) as Partial<BrandKit>;
    setColor(bk.color || DEFAULT_BRAND.color);
    setTone(bk.tone || DEFAULT_BRAND.tone);
    setDirty(false);
  }, [profile]);

  const handleColorChange = (v: string) => {
    setColor(v);
    setDirty(true);
  };
  const handleToneChange = (v: BrandKit["tone"]) => {
    setTone(v);
    setDirty(true);
  };

  const handleSave = async () => {
    if (!isValidHex(color)) {
      toast.error("Colore non valido", {
        description: "Usa formato esadecimale, es. #FF6A1C",
      });
      return;
    }
    setSaving(true);
    const newKit: BrandKit = { color: color.toUpperCase(), tone };
    await updateProfile({ brand_kit: newKit as any });
    setSaving(false);
    setDirty(false);
    toast.success("Brand kit salvato");
  };

  const handleReset = () => {
    setColor(DEFAULT_BRAND.color);
    setTone(DEFAULT_BRAND.tone);
    setDirty(true);
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4 animate-in">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Palette className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Il mio brand</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Personalizza colore primario e tone of voice. Le skill di scrittura (post, hook, miglioramento)
              li useranno automaticamente per produrre contenuti coerenti.
            </p>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8 text-muted-foreground animate-in">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm">Caricamento brand…</p>
          </div>
        )}

        {!loading && profile && (
          <>
            {/* Colore primario */}
            <Card className="bg-card border-border/50 animate-in">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h2 className="font-semibold text-base">Colore primario</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Usato come riferimento nei brief visivi. Esadecimale (es. #FF6A1C).
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div
                    className="w-16 h-16 rounded-xl border-2 border-border/30 shrink-0"
                    style={{ backgroundColor: isValidHex(color) ? color : "#888" }}
                  />
                  <input
                    type="color"
                    value={isValidHex(color) ? color : "#FF6A1C"}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="h-10 w-16 rounded-md border border-border/50 cursor-pointer bg-surface"
                  />
                  <Input
                    value={color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    placeholder="#FF6A1C"
                    className="bg-surface border-border/50 focus:border-primary h-10 max-w-[160px] font-mono uppercase"
                  />
                  {!isValidHex(color) && (
                    <span className="text-xs text-destructive">Hex non valido</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tone of voice */}
            <Card className="bg-card border-border/50 animate-in">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h2 className="font-semibold text-base">Tone of voice</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Influenza il modo in cui Ember scrive i tuoi post.
                  </p>
                </div>
                <Select value={tone} onValueChange={(v) => handleToneChange(v as BrandKit["tone"])}>
                  <SelectTrigger className="bg-surface border-border/50 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{t.label}</span>
                          <span className="text-[11px] text-muted-foreground">{t.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TONE_OPTIONS.map((t) => {
                    const active = tone === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => handleToneChange(t.value)}
                        className={`text-xs px-3 py-2 rounded-lg border transition-colors text-left ${
                          active
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-surface border-border/50 hover:border-primary/50 text-muted-foreground"
                        }`}
                      >
                        <span className="font-medium block">{t.label}</span>
                        <span className="text-[10px] opacity-80 line-clamp-1">{t.description}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Anteprima */}
            <Card className="bg-card border-border/50 animate-in">
              <CardContent className="p-6 space-y-3">
                <h2 className="font-semibold text-base">Anteprima</h2>
                <div
                  className="p-5 rounded-xl border-2 border-border/30"
                  style={{
                    background: `linear-gradient(135deg, ${color}15, ${color}05)`,
                    borderColor: `${color}40`,
                  }}
                >
                  <Badge
                    className="mb-2 border-0"
                    style={{ backgroundColor: `${color}20`, color: color }}
                  >
                    {TONE_OPTIONS.find((t) => t.value === tone)?.label}
                  </Badge>
                  <p className="text-sm">
                    I tuoi post saranno scritti in tone <strong>{tone}</strong>, e
                    i visual brief consiglieranno palette coerenti con il tuo colore primario.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Azioni */}
            <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
              <Button
                variant="ghost"
                onClick={handleReset}
                disabled={saving}
                className="text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4 mr-1.5" />
                Ripristina default
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !dirty || !isValidHex(color)}
                className="bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg shadow-primary/20"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salva brand kit
              </Button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
