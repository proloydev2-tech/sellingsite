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

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

  // Test 1: Query admin_users with service role key directly
  let dbStatus = 0;
  let dbBody = "";
  let dbError = "";
  try {
    const apiUrl = `${supabaseUrl}/rest/v1/admin_users?select=username,password&username=eq.praloy&password=eq.praloy`;
    const res = await fetch(apiUrl, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
    });
    dbStatus = res.status;
    dbBody = await res.text();
  } catch (e) {
    dbError = String(e);
  }

  // Test 2: Call the admin-login edge function internally
  let fnStatus = 0;
  let fnBody = "";
  let fnError = "";
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/admin-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey || serviceKey}`,
        apikey: anonKey || serviceKey,
      },
      body: JSON.stringify({ username: "praloy", password: "praloy" }),
    });
    fnStatus = res.status;
    fnBody = await res.text();
  } catch (e) {
    fnError = String(e);
  }

  return new Response(JSON.stringify({
    supabase_url: supabaseUrl,
    has_service_key: Boolean(serviceKey),
    has_anon_key: Boolean(anonKey),
    db_query: {
      status: dbStatus,
      body: dbBody,
      error: dbError,
    },
    admin_login_function: {
      status: fnStatus,
      body: fnBody,
      error: fnError,
    },
  }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
