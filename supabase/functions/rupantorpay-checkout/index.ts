import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RUPANTORPAY_CHECKOUT_URL = "https://payment.rupantorpay.com/api/payment/checkout";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function getApiKey(): Promise<string | null> {
  // 1) Try edge function secret
  const envKey = Deno.env.get("RUPANTORPAY_API_KEY");
  if (envKey) return envKey;
  // 2) Fall back to database config (admin-editable)
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data } = await supabase
      .from("rupantorpay_config")
      .select("api_key, enabled")
      .eq("id", 1)
      .maybeSingle();
    if (data?.enabled && data.api_key) return data.api_key as string;
  } catch {
    // ignore
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ status: false, message: "Method not allowed" }, 405);
  }

  const apiKey = await getApiKey();
  if (!apiKey) {
    return json({ status: false, message: "Payment gateway not configured on server" }, 500);
  }

  let payload: {
    fullname: string;
    email: string;
    amount: string | number;
    order_id?: string;
    success_url?: string;
    cancel_url?: string;
    webhook_url?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return json({ status: false, message: "Invalid JSON body" }, 400);
  }

  const { fullname, email, amount, order_id } = payload;
  if (!fullname || !email || !amount) {
    return json({ status: false, message: "fullname, email, amount are required" }, 400);
  }

  const origin = new URL(req.url).searchParams.get("origin") || `https://${new URL(req.url).hostname}`;
  const successUrl = payload.success_url || `${origin}/?payment=success`;
  const cancelUrl = payload.cancel_url || `${origin}/?payment=cancel`;
  const webhookUrl = payload.webhook_url || `${origin}/?payment=webhook`;

  const body = {
    fullname,
    email,
    amount: String(amount),
    success_url: successUrl,
    cancel_url: cancelUrl,
    webhook_url: webhookUrl,
    meta_data: { order_id: order_id || "" },
  };

  try {
    const res = await fetch(RUPANTORPAY_CHECKOUT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
        "X-CLIENT": new URL(req.url).hostname,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return json(data, res.status);
  } catch (err) {
    return json({ status: false, message: "Failed to reach payment gateway", error: String(err) }, 502);
  }
});
