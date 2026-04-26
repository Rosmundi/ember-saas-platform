// src/components/prospects/ProspectCard.tsx
// Card singolo prospect dalla lista harvest. Tre azioni: apri LinkedIn,
// scrivi outreach (passa il prospect alla skill outreach-drafter via router state),
// aggiungi alla watchlist (insert su Supabase).

import { useState } from "react";
import { ExternalLink, MessageSquarePlus, Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProspectShortData {
  id?: string | null;
  publicIdentifier?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  headline?: string | null;
  location?: { linkedinText?: string } | string | null;
  currentPosition?: unknown[];
  about?: string;
  profilePicture?: string | null;
  connectionDegree?: string | null;
}

export interface Prospect {
  id?: string; // uuid DB (presente solo dopo commit-prospects)
  linkedin_url: string;
  short_data: ProspectShortData;
  source_search_at?: string;
}

interface Props {
  prospect: Prospect;
  watchlistMaxItems?: number;
}

function locationText(loc: ProspectShortData["location"]): string {
  if (!loc) return "";
  if (typeof loc === "string") return loc;
  return loc.linkedinText || "";
}

function fullName(s: ProspectShortData): string {
  return [s.firstName, s.lastName].filter(Boolean).join(" ") || "Profilo senza nome";
}

function initials(s: ProspectShortData): string {
  return [s.firstName?.[0], s.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";
}

// Estrae azienda corrente dal currentPosition (formato harvestapi).
function extractCompany(s: ProspectShortData): string {
  const cp = (s.currentPosition || []) as Array<Record<string, any>>;
  if (!cp.length) return "";
  return cp[0]?.companyName || cp[0]?.company?.name || cp[0]?.company || "";
}

export function ProspectCard({ prospect }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [savingWatchlist, setSavingWatchlist] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);

  const s = prospect.short_data || {};
  const name = fullName(s);
  const loc = locationText(s.location);
  const aboutPreview = (s.about || "").slice(0, 220).trim();

  const openLinkedin = () => {
    window.open(prospect.linkedin_url, "_blank", "noopener,noreferrer");
  };

  const writeOutreach = () => {
    // Passa il prospect alla skill outreach-drafter via router state.
    // SkillPage legge location.state.prefilledProspect e popola il form.
    navigate("/skill/outreach-drafter", {
      state: {
        prefilledProspect: {
          prospect_id: prospect.id || null,
          linkedin_url: prospect.linkedin_url,
          name,
          headline: s.headline || "",
          about: s.about || "",
        },
      },
    });
  };

  const addToWatchlist = async () => {
    if (!user) {
      toast.error("Devi essere loggato.");
      return;
    }
    setSavingWatchlist(true);
    // Schema watchlist: {user_id, linkedin_url, nome, headline, azienda, last_snapshot, ...}
    // (denormalizzato — nessun foreign key a prospects, dedup via UNIQUE user_id+linkedin_url).
    const insertRow = {
      user_id: user.id,
      linkedin_url: prospect.linkedin_url,
      nome: name,
      headline: s.headline || "",
      azienda: extractCompany(s),
      last_snapshot: prospect.short_data as unknown as Record<string, unknown>,
    };
    const { error } = await supabase.from("watchlist").insert(insertRow as any);
    setSavingWatchlist(false);
    if (error) {
      // Duplicato → graceful.
      if (error.code === "23505") {
        setInWatchlist(true);
        toast.info("Già in watchlist.");
        return;
      }
      toast.error("Errore watchlist", { description: error.message });
      return;
    }
    setInWatchlist(true);
    toast.success("Aggiunto alla watchlist.");
  };

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-4 flex gap-4">
      {/* Avatar */}
      <div className="shrink-0">
        {s.profilePicture ? (
          <img
            src={s.profilePicture}
            alt={name}
            className="w-14 h-14 rounded-full object-cover border border-white/10"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-orange-500/20 text-orange-300 grid place-items-center font-semibold text-lg border border-white/10">
            {initials(s)}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-semibold text-white truncate">{name}</div>
            {s.headline && <div className="text-sm text-white/70 truncate">{s.headline}</div>}
            {loc && <div className="text-xs text-white/50 mt-0.5">{loc}</div>}
          </div>
        </div>

        {aboutPreview && (
          <p className="text-sm text-white/60 mt-2 line-clamp-3">
            {aboutPreview}
            {s.about && s.about.length > 220 ? "…" : ""}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={openLinkedin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Apri su LinkedIn
          </button>

          <button
            onClick={writeOutreach}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/30 transition"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            Scrivi outreach
          </button>

          <button
            onClick={addToWatchlist}
            disabled={savingWatchlist || inWatchlist}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingWatchlist ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : inWatchlist ? (
              <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Bookmark className="w-3.5 h-3.5" />
            )}
            {inWatchlist ? "In watchlist" : "Watchlist"}
          </button>
        </div>
      </div>
    </div>
  );
}
