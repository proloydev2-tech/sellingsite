import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type AdminCreds = { username: string; password: string };

async function verifyAdmin(supabase: any, creds: AdminCreds): Promise<boolean> {
  if (!creds?.username || !creds?.password) return false;
  const { data, error } = await supabase
    .from("admin_users")
    .select("username")
    .eq("username", creds.username)
    .eq("password", creds.password)
    .maybeSingle();
  if (error || !data) return false;
  return true;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const body = await req.json();
    const { action, admin, payload } = body;

    if (!await verifyAdmin(supabase, admin || {})) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_settings") {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_settings") {
      const allowed = [
        "site_name", "tagline", "hero_title", "hero_subtitle", "hero_badge",
        "hero_cta_label", "footer_tagline", "footer_copyright", "currency",
        "contact_email", "contact_whatsapp", "social_twitter", "social_instagram", "social_github",
      ];
      const updates: Record<string, any> = {};
      for (const k of allowed) {
        if (k in (payload || {})) updates[k] = payload[k];
      }
      updates.updated_at = new Date().toISOString();
      const { error } = await supabase
        .from("site_settings")
        .update(updates)
        .eq("id", 1);
      if (error) throw new Error(error.message);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list_content") {
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .order("section")
        .order("sort_order");
      if (error) throw new Error(error.message);
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "upsert_content") {
      const row = payload || {};
      const record: Record<string, any> = {
        section: row.section,
        sort_order: Number(row.sort_order) || 0,
        title: row.title,
        body: row.body ?? null,
        meta: row.meta ?? null,
      };
      let result;
      if (row.id) {
        result = await supabase.from("site_content").update(record).eq("id", row.id).select("id").maybeSingle();
      } else {
        result = await supabase.from("site_content").insert(record).select("id").maybeSingle();
      }
      if (result.error) throw new Error(result.error.message);
      return new Response(JSON.stringify({ ok: true, id: result.data?.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete_content") {
      const { error } = await supabase.from("site_content").delete().eq("id", payload?.id);
      if (error) throw new Error(error.message);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
