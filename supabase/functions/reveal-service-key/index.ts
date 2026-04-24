import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(() => {
  return new Response(
    JSON.stringify({
      ok: true,
      supabase_url: Deno.env.get("SUPABASE_URL"),
      service_role_key: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    }),
    { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
  );
});
