import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function verifyAdmin(supabase: any, creds: any): Promise<{ ok: boolean; role?: string; username?: string }> {
  if (!creds?.username || !creds?.password) return { ok: false };
  const { data, error } = await supabase
    .from("admin_users")
    .select("username, role")
    .eq("username", creds.username.trim())
    .eq("password", creds.password)
    .maybeSingle();
  if (error || !data) return { ok: false };
  return { ok: true, role: data.role || "admin", username: data.username };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ ok: false, message: "Method not allowed" }, 405);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, message: "Invalid JSON" }, 400);
  }

  const { action, admin, payload } = body;
  const auth = await verifyAdmin(supabase, admin || {});
  if (!auth.ok) return json({ ok: false, message: "Unauthorized" }, 401);

  // -------- list_admins --------
  if (action === "list_admins") {
    const { data, error } = await supabase
      .from("admin_users")
      .select("id, username, email, role, created_at")
      .order("created_at", { ascending: true });
    if (error) return json({ ok: false, message: error.message }, 500);
    return json({ ok: true, data });
  }

  // -------- create_admin (owner only) --------
  if (action === "create_admin") {
    if (auth.role !== "owner") {
      return json({ ok: false, message: "Only owner can create new admins" }, 403);
    }
    const { username, password, email } = payload || {};
    if (!username || !password) return json({ ok: false, message: "username and password required" }, 400);
    const { data, error } = await supabase
      .from("admin_users")
      .insert({ username: username.trim(), password, email: email || null, role: "admin" })
      .select("id, username, email, role, created_at")
      .maybeSingle();
    if (error) return json({ ok: false, message: error.message }, 500);
    return json({ ok: true, data });
  }

  // -------- delete_admin (owner only, cannot delete self or other owner) --------
  if (action === "delete_admin") {
    if (auth.role !== "owner") {
      return json({ ok: false, message: "Only owner can delete admins" }, 403);
    }
    const { id } = payload || {};
    if (!id) return json({ ok: false, message: "id required" }, 400);
    // Don't allow deleting owner accounts
    const { data: target } = await supabase
      .from("admin_users")
      .select("role, username")
      .eq("id", id)
      .maybeSingle();
    if (!target) return json({ ok: false, message: "Admin not found" }, 404);
    if (target.role === "owner") return json({ ok: false, message: "Cannot delete owner account" }, 400);
    if (target.username === auth.username) return json({ ok: false, message: "Cannot delete yourself" }, 400);
    const { error } = await supabase.from("admin_users").delete().eq("id", id);
    if (error) return json({ ok: false, message: error.message }, 500);
    return json({ ok: true });
  }

  // -------- get_smtp --------
  if (action === "get_smtp") {
    const { data, error } = await supabase
      .from("smtp_config")
      .select("id, host, port, username, from_email, from_name, secure, updated_at")
      .eq("id", 1)
      .maybeSingle();
    if (error) return json({ ok: false, message: error.message }, 500);
    return json({ ok: true, data });
  }

  // -------- update_smtp --------
  if (action === "update_smtp") {
    const allowed = ["host", "port", "username", "password", "from_email", "from_name", "secure"];
    const updates: Record<string, any> = {};
    for (const k of allowed) {
      if (k in (payload || {})) updates[k] = payload[k];
    }
    updates.updated_at = new Date().toISOString();
    const { error } = await supabase.from("smtp_config").update(updates).eq("id", 1);
    if (error) return json({ ok: false, message: error.message }, 500);
    return json({ ok: true });
  }

  // -------- get_google --------
  if (action === "get_google") {
    const { data, error } = await supabase
      .from("google_auth_config")
      .select("id, client_id, client_secret, enabled, updated_at")
      .eq("id", 1)
      .maybeSingle();
    if (error) return json({ ok: false, message: error.message }, 500);
    return json({ ok: true, data });
  }

  // -------- update_google --------
  if (action === "update_google") {
    const allowed = ["client_id", "client_secret", "enabled"];
    const updates: Record<string, any> = {};
    for (const k of allowed) {
      if (k in (payload || {})) updates[k] = payload[k];
    }
    updates.updated_at = new Date().toISOString();
    const { error } = await supabase.from("google_auth_config").update(updates).eq("id", 1);
    if (error) return json({ ok: false, message: error.message }, 500);
    return json({ ok: true });
  }

  // -------- get_rupantorpay --------
  if (action === "get_rupantorpay") {
    const { data, error } = await supabase
      .from("rupantorpay_config")
      .select("id, api_key, enabled, updated_at")
      .eq("id", 1)
      .maybeSingle();
    if (error) return json({ ok: false, message: error.message }, 500);
    return json({ ok: true, data });
  }

  // -------- update_rupantorpay --------
  if (action === "update_rupantorpay") {
    const allowed = ["api_key", "enabled"];
    const updates: Record<string, any> = {};
    for (const k of allowed) {
      if (k in (payload || {})) updates[k] = payload[k];
    }
    updates.updated_at = new Date().toISOString();
    const { error } = await supabase.from("rupantorpay_config").update(updates).eq("id", 1);
    if (error) return json({ ok: false, message: error.message }, 500);

    // Also update the edge function secret so rupantorpay-checkout uses the new key
    const newKey = updates.api_key;
    if (newKey) {
      try {
        await fetch(`https://api.supabase.com/v1/projects/${Deno.env.get("SUPABASE_PROJECT_REF")}/secrets`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_ACCESS_TOKEN") || ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([{ name: "RUPANTORPAY_API_KEY", value: String(newKey) }]),
        });
      } catch {
        // best-effort — admin can also set it manually in Supabase dashboard
      }
    }
    return json({ ok: true });
  }

  // -------- get_telegram --------
  if (action === "get_telegram") {
    const { data, error } = await supabase
      .from("telegram_config")
      .select("id, bot_token, chat_id, enabled, updated_at")
      .eq("id", 1)
      .maybeSingle();
    if (error) return json({ ok: false, message: error.message }, 500);
    return json({ ok: true, data });
  }

  // -------- update_telegram --------
  if (action === "update_telegram") {
    const allowed = ["bot_token", "chat_id", "enabled"];
    const updates: Record<string, any> = {};
    for (const k of allowed) {
      if (k in (payload || {})) updates[k] = payload[k];
    }
    updates.updated_at = new Date().toISOString();
    const { error } = await supabase.from("telegram_config").update(updates).eq("id", 1);
    if (error) return json({ ok: false, message: error.message }, 500);
    return json({ ok: true });
  }

  // -------- test_telegram: send a test message --------
  if (action === "test_telegram") {
    const { data, error } = await supabase
      .from("telegram_config")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data) return json({ ok: false, message: error?.message || "Not configured" }, 500);
    if (!data.bot_token || !data.chat_id) {
      return json({ ok: false, message: "Bot token and chat ID are required" }, 400);
    }
    try {
      const url = `https://api.telegram.org/bot${data.bot_token}/sendMessage`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: data.chat_id,
          text: "✅ *VoltStore Telegram test*\nNotifications are working correctly.",
          parse_mode: "Markdown",
        }),
      });
      const result = await res.json();
      if (!result.ok) {
        return json({ ok: false, message: result.description || "Telegram API error" }, 500);
      }
      return json({ ok: true });
    } catch (err) {
      return json({ ok: false, message: String(err) }, 500);
    }
  }

  return json({ ok: false, message: "Unknown action" }, 400);
});
