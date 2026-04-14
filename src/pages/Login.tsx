import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md bg-card/80 border-border/50 backdrop-blur-sm shadow-2xl shadow-background/50 animate-in relative z-10">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex w-12 h-12 rounded-xl bg-primary/10 items-center justify-center mb-4">
              <span className="text-primary font-extrabold text-lg">E</span>
            </div>
            <h1 className="text-2xl font-bold mt-2">Accedi a Ember</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Inserisci la tua email per ricevere il magic link.
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4 animate-in animate-in-delay-1">
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-surface border-border/50 focus:border-primary h-12 text-base"
                required
                disabled={loading}
              />

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-hover text-primary-foreground h-12 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                {loading ? "Invio in corso..." : "Invia magic link"}
              </Button>
            </form>
          ) : (
            <div className="text-center py-8 animate-in">
              <div className="relative inline-block">
                <CheckCircle className="h-14 w-14 text-success" />
                <div className="absolute inset-0 h-14 w-14 rounded-full animate-ping bg-success/10" />
              </div>
              <p className="text-foreground font-medium mt-4">
                Controlla la tua email.
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Abbiamo inviato un link di accesso a <span className="text-foreground font-medium">{email}</span>.
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              ← Torna alla home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
