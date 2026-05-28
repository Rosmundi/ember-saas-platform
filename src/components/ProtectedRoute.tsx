import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Cache module-level: l'onboarding viene controllato UNA SOLA VOLTA per sessione utente.
// Evita flash "Caricamento..." ad ogni cambio rotta.
let onboardingCache: { userId: string; done: boolean } | null = null;

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const cached = user && onboardingCache?.userId === user.id ? onboardingCache.done : null;
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(cached);
  const fetchedRef = useRef<string | null>(cached !== null && user ? user.id : null);

  useEffect(() => {
    if (!user) {
      setOnboardingDone(null);
      fetchedRef.current = null;
      return;
    }
    if (fetchedRef.current === user.id) return;
    fetchedRef.current = user.id;

    supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        const done = data?.onboarding_completed ?? false;
        onboardingCache = { userId: user.id, done };
        setOnboardingDone(done);
      });
  }, [user]);

  // Solo l'initial auth load mostra lo splash. Le successive nav non bloccano.
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-hover" />
          <p className="text-muted-foreground text-sm font-medium">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Onboarding non ancora verificato (prima fetch in corso): renderizza comunque i children.
  // Il redirect a /profilo avviene appena la verifica torna `false`.
  if (onboardingDone === false && location.pathname !== "/profilo") {
    return <Navigate to="/profilo" replace />;
  }

  return <>{children}</>;
}
