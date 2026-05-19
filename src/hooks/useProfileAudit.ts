// src/hooks/useProfileAudit.ts — v3.8.7
// Hook centralizzato per audit profilo. runQuickAudit legge il flag
// business_profile_updated dal response n8n e salva atomicamente il nuovo
// business_profile su Supabase se il feedback ha effettivamente cambiato il
// posizionamento. runFullAudit rifa lo scrape via auto-profile-setup.

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "./useProfile";
import { toast } from "sonner";

export function useProfileAudit() {
  const { user } = useAuth();
  const { profile, updateProfile, fetchProfile } = useProfile();
  const [running, setRunning] = useState(false);

  async function runQuickAudit(opts?: { feedback_utente?: string; obiettivo?: string }) {
    if (!user || !profile) return null;
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("run-skill", {
        body: {
          skillId: "profile-optimizer",
          payload: {
            profilo_business: profile.business_profile ?? {},
            raw_profile_data: profile.raw_profile_data ?? {},
            obiettivo:
              opts?.obiettivo ||
              profile.business_profile?.value_proposition ||
              "",
            brand_kit: profile.brand_kit ?? { tone: "corporate" },
            feedback_utente: opts?.feedback_utente || undefined,
          },
        },
      });
      if (error) {
        toast.error("Audit fallito", { description: error.message });
        return null;
      }

      const auditData = (data as any)?.data;
      if (!auditData) {
        toast.error("Audit fallito", { description: "Risposta vuota" });
        return null;
      }

      const updates: Record<string, unknown> = {
        raw_profile_data: {
          ...(profile.raw_profile_data || {}),
          audit: auditData,
          audit_at: new Date().toISOString(),
        },
      };
      if (auditData.business_profile_updated && auditData.business_profile) {
        updates.business_profile = auditData.business_profile;
        toast.success("Profilo aggiornato secondo il tuo feedback", {
          description:
            "Anche headline, settore e value proposition sono stati riscritti.",
        });
      } else {
        toast.success("Audit aggiornato");
      }

      await updateProfile(updates as any);
      await fetchProfile();
      return auditData;
    } finally {
      setRunning(false);
    }
  }

  async function runFullAudit() {
    if (!user || !profile?.linkedin_url) return null;
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("run-skill", {
        body: {
          skillId: "auto-profile-setup",
          payload: {
            user_id: user.id,
            linkedin_url: profile.linkedin_url,
            scrape_count: 1,
          },
        },
      });
      if (error) {
        toast.error("Audit completo fallito", { description: error.message });
        return null;
      }
      toast.success("Audit completo aggiornato");
      await fetchProfile();
      return (data as any)?.data;
    } finally {
      setRunning(false);
    }
  }

  return { runQuickAudit, runFullAudit, running };
}
