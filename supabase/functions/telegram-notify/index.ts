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

type TgConfig = {
  bot_token: string;
  chat_id: string;
  enabled: boolean;
};

async function getConfig(supabase: any): Promise<TgConfig | null> {
  const { data, error } = await supabase
    .from("telegram_config")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) return null;
  if (!data.enabled || !data.bot_token || !data.chat_id) return null;
  return data as TgConfig;
}

function escapeMd(text: string): string {
  return String(text || "").replace(/([_*`\[])/g, "\\$1");
}

function formatMoney(n: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(n) || 0);
  } catch {
    return `${currency} ${(Number(n) || 0).toFixed(2)}`;
  }
}

async function sendTelegram(cfg: TgConfig, text: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const url = `https://api.telegram.org/bot${cfg.bot_token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: cfg.chat_id,
        text,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });
    const data = await res.json();
    if (!data.ok) return { ok: false, error: data.description || "Telegram API error" };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
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

  const { order_id } = body;
  if (!order_id) return json({ ok: false, message: "order_id required" }, 400);

  const cfg = await getConfig(supabase);
  if (!cfg) return json({ ok: false, message: "Telegram not configured or disabled" }, 500);

  const { data: order, error: oerr } = await supabase
    .from("orders")
    .select("*")
    .eq("id", order_id)
    .maybeSingle();
  if (oerr || !order) return json({ ok: false, message: "Order not found" }, 404);

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order_id);

  const { data: settings } = await supabase
    .from("site_settings")
    .select("site_name, currency")
    .eq("id", 1)
    .maybeSingle();

  const siteName = settings?.site_name || "VoltStore";
  const currency = settings?.currency || "BDT";

  const itemLines = (items || [])
    .map((i: any, idx: number) =>
      `${idx + 1}\. ${escapeMd(i.product_name)} — ${escapeMd(i.variant_label)} x${i.quantity} = ${escapeMd(formatMoney(Number(i.price) * i.quantity, currency))}`,
    )
    .join("\n");

  const text = [
    `*${escapeMd(siteName)} — New Order*`,
    "",
    `*Order:* \`${escapeMd(order.order_number)}\``,
    `*Customer:* ${escapeMd(order.customer_name)}`,
    `*Email:* ${escapeMd(order.customer_email)}`,
    order.customer_whatsapp ? `*WhatsApp:* ${escapeMd(order.customer_whatsapp)}` : "",
    `*Total:* ${escapeMd(formatMoney(Number(order.total), currency))}`,
    `*Status:* ${escapeMd(order.status)}`,
    `*Payment:* ${escapeMd(order.payment_method || "rupantorpay")}`,
    "",
    "*Items:*",
    itemLines || "_No items_",
    "",
    `_Placed ${new Date(order.created_at).toLocaleString()}_`,
  ].filter(Boolean).join("\n");

  const result = await sendTelegram(cfg, text);
  if (!result.ok) return json({ ok: false, message: result.error || "Telegram send failed" }, 500);
  return json({ ok: true });
});
