import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const u = url.searchParams.get("username") || "";
  const p = url.searchParams.get("password") || "";

  // Use the caller's anon key (from Authorization header) to replicate client behavior exactly
  const callerKey = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";

  if (!callerKey) {
    return new Response(JSON.stringify({ error: "No Authorization header provided" }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Decode the JWT payload to inspect exp
  let jwtInfo: Record<string, unknown> = {};
  try {
    const parts = callerKey.split(".");
    if (parts.length >= 2) {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      jwtInfo = payload;
      if (payload.exp) {
        jwtInfo.exp_date = new Date(payload.exp * 1000).toISOString();
      }
      if (payload.iat) {
        jwtInfo.iat_date = new Date(payload.iat * 1000).toISOString();
      }
      jwtInfo.now = new Date().toISOString();
      jwtInfo.expired = payload.exp ? (Date.now() > payload.exp * 1000) : false;
    }
  } catch (e) {
    jwtInfo = { decode_error: String(e) };
  }

  // Replicate the exact client-side query using the caller's anon key
  const apiUrl = `${supabaseUrl}/rest/v1/admin_users?select=username&username=eq.${encodeURIComponent(u)}&password=eq.${encodeURIComponent(p)}`;
  let status = 0;
  let body = "";
  let headers: Record<string, string> = {};
  try {
    const res = await fetch(apiUrl, {
      headers: {
        apikey: callerKey,
        Authorization: `Bearer ${callerKey}`,
        "Content-Type": "application/json",
      },
    });
    status = res.status;
    body = await res.text();
    res.headers.forEach((v, k) => { headers[k] = v; });
  } catch (e) {
    body = `fetch error: ${String(e)}`;
  }

  return new Response(JSON.stringify({
    query: apiUrl,
    jwt: jwtInfo,
    response_status: status,
    response_body: body,
    response_headers: headers,
  }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
