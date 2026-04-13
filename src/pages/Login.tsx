import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, CheckCircle } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSent(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <span className="text-primary font-bold text-2xl tracking-tight">EMBER</span>
            <h1 className="text-2xl font-bold mt-4">Accedi a Ember</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Inserisci la tua email per ricevere il magic link.
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-surface border-border focus:border-primary"
                required
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary-hover text-primary-foreground">
                <Mail className="mr-2 h-4 w-4" />
                Invia magic link
              </Button>
            </form>
          ) : (
            <div className="text-center py-6">
              <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
              <p className="text-foreground font-medium">
                Controlla la tua email.
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Abbiamo inviato un link di accesso.
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
              ← Torna alla home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
