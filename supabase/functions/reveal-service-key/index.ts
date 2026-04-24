// ============================================================================
// Edge Function: reveal-service-key (TEMPORANEA — DA CANCELLARE DOPO L'USO)
// ============================================================================
// Restituisce la SUPABASE_SERVICE_ROLE_KEY solo se viene fornita la
// EMBER_INTERNAL_KEY corretta nell'header X-Ember-Key.
//
// Uso (una volta sola):
//   curl -X POST https://zgnonhxmdudaaiczfplh.supabase.co/functions/v1/reveal-service-key \
//     -H "X-Ember-Key: <la-tua-EMBER_INTERNAL_KEY>"
//
// DOPO AVER COPIATO LA CHIAVE: chiedi di cancellare questa funzione.
// ============================================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ember-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve((req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const internalKey = Deno.env.get("EMBER_INTERNAL_KEY");
  const requestKey = req.headers.get("x-ember-key");

  if (!internalKey || requestKey !== internalKey) {
    return new Response(JSON.stringify({ ok: false, code: "UNAUTHORIZED" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");

  return new Response(
    JSON.stringify({
      ok: true,
      supabase_url: supabaseUrl,
      service_role_key: serviceKey,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    },
  );
});
