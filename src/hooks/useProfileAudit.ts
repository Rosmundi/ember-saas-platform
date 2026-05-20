// src/hooks/useProfileAudit.ts — v3.8.8 One Audit
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "./useProfile";
import { toast } from "sonner";

/**
 * Hook unificato per l'audit profilo (v3.8.8).
 * Esiste UN SOLO workflow: auto-profile-setup.
 * Apify scrappa SEMPRE il profilo LinkedIn (1 scrape + 1 skill_run).
 * Il feedback è opzionale: se presente, influenza riscritture e profilo_business,
 * MA stato_attuale resta sempre il dato LinkedIn reale.
 */
export function useProfileAudit() {
  const { user } = useAuth();
  const { profile, updateProfile, fetchProfile } = useProfile();
  const [running, setRunning] = useState(false);

  async function runAudit(opts?: { feedback_utente?: string }) {
    if (!user) return null;
    if (!profile?.linkedin_url) {
      toast.error("Manca l'URL LinkedIn", {
        description: "Imposta prima il tuo profilo LinkedIn nell'onboarding.",
      });
      return null;
    }

    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("run-skill", {
        body: {
          skillId: "auto-profile-setup",
          payload: {
            linkedin_url: profile.linkedin_url,
            scrape_count: 1,
            feedback_utente: opts?.feedback_utente?.trim() || undefined,
          },
        },
      });

      if (error) {
        toast.error("Audit fallito", { description: error.message });
        return null;
      }

      const auditData = (data as any)?.data;
      if (!auditData) {
        toast.error("Audit fallito", { description: "Risposta vuota dal workflow" });
        return null;
      }

      const updates: Record<string, unknown> = {
        business_profile: auditData.profilo_business || profile.business_profile,
        raw_profile_data: {
          ...(profile.raw_profile_data || {}),
          audit: auditData,
          audit_at: new Date().toISOString(),
        },
      };

      await updateProfile(updates as any);
      await fetchProfile();

      if (auditData.feedback_applicato) {
        toast.success("Profilo riposizionato secondo il tuo feedback", {
          description:
            "Headline, About e profilo sono stati riscritti. Lo stato attuale del profilo LinkedIn resta visibile per confronto.",
        });
      } else {
        toast.success("Audit aggiornato");
      }

      return auditData;
    } finally {
      setRunning(false);
    }
  }

  return { runAudit, running };
}
