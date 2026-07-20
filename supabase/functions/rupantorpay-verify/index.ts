import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RUPANTORPAY_VERIFY_URL = "https://payment.rupantorpay.com/api/payment/verify-payment";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ status: false, message: "Method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("RUPANTORPAY_API_KEY");
  if (!apiKey) {
    return json({ status: false, message: "Payment gateway not configured on server" }, 500);
  }

  let payload: { transaction_id: string };
  try {
    payload = await req.json();
  } catch {
    return json({ status: false, message: "Invalid JSON body" }, 400);
  }

  const { transaction_id } = payload;
  if (!transaction_id) {
    return json({ status: false, message: "transaction_id is required" }, 400);
  }

  try {
    const res = await fetch(RUPANTORPAY_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ transaction_id }),
    });
    const data = await res.json();
    return json(data, res.status);
  } catch (err) {
    return json({ status: false, message: "Failed to reach payment gateway", error: String(err) }, 502);
  }
});
