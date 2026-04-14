import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    if (isSignUp) {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) {
        setError(authError.message);
      } else {
        navigate("/onboarding");
      }
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        setError(authError.message);
      } else {
        navigate("/dashboard");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md bg-card/80 border-border/50 backdrop-blur-sm shadow-2xl shadow-background/50 animate-in relative z-10">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex w-12 h-12 rounded-xl bg-primary/10 items-center justify-center mb-4">
              <span className="text-primary font-extrabold text-lg">E</span>
            </div>
            <h1 className="text-2xl font-bold mt-2">
              {isSignUp ? "Crea il tuo account" : "Accedi a Ember"}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {isSignUp
                ? "Inserisci email e password per registrarti."
                : "Inserisci le tue credenziali per accedere."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 animate-in animate-in-delay-1">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-surface border-border/50 focus:border-primary h-12 text-base pl-10"
                required
                disabled={loading}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-surface border-border/50 focus:border-primary h-12 text-base pl-10"
                required
                disabled={loading}
                minLength={6}
              />
            </div>

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
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? "Registrati" : "Accedi"}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isSignUp
                ? "Hai già un account? Accedi"
                : "Non hai un account? Registrati"}
            </button>
            <div>
              <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                ← Torna alla home
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
