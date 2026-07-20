import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";

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

type SmtpConfig = {
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
  secure: boolean;
};

async function getSmtpConfig(supabase: any): Promise<SmtpConfig | null> {
  const { data, error } = await supabase
    .from("smtp_config")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) return null;
  if (!data.host || !data.from_email || !data.username) return null;
  return data as SmtpConfig;
}

async function sendEmail(supabase: any, args: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const cfg = await getSmtpConfig(supabase);
  if (!cfg) return { ok: false, error: "SMTP not configured" };
  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.username, pass: cfg.password },
    });
    await transporter.sendMail({
      from: `${cfg.from_name} <${cfg.from_email}>`,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.html.replace(/<[^>]+>/g, " "),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

function formatMoney(n: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
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
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  const siteName = settings?.site_name || "VoltStore";
  const currency = settings?.currency || "BDT";

  const rowsHtml = (items || [])
    .map(
      (i: any) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">${i.product_name}<br><span style="color:#64748b;font-size:12px;">${i.variant_label} × ${i.quantity}</span></td>
        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;text-align:right;">${formatMoney(Number(i.price) * i.quantity, currency)}</td>
      </tr>`,
    )
    .join("");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a;">
      <h2 style="color:#10b981;margin:0 0 8px;">${siteName}</h2>
      <p style="font-size:16px;">Hi ${order.customer_name || "Customer"},</p>
      <p style="font-size:16px;line-height:1.5;">Thanks for your order! We've received your order and it's now being processed.</p>
      <div style="background:#f1f5f9;padding:16px;border-radius:12px;margin:16px 0;">
        <p style="margin:0 0 4px;font-size:13px;color:#475569;">Order number</p>
        <p style="margin:0;font-size:18px;font-weight:bold;font-family:monospace;">${order.order_number}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr><th style="text-align:left;padding:8px 0;border-bottom:2px solid #e2e8f0;">Item</th><th style="text-align:right;padding:8px 0;border-bottom:2px solid #e2e8f0;">Total</th></tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr>
            <td style="padding:12px 0;font-weight:bold;">Total</td>
            <td style="padding:12px 0;text-align:right;font-weight:bold;">${formatMoney(Number(order.total), currency)}</td>
          </tr>
        </tbody>
      </table>
      <p style="font-size:14px;color:#475569;margin-top:24px;">Once your payment is confirmed, your digital products will be delivered to this email.</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
      <p style="font-size:12px;color:#94a3b8;">If you didn't place this order, please reply to this email.</p>
    </div>
  `;

  const result = await sendEmail(supabase, {
    to: order.customer_email,
    subject: `Order confirmed — ${order.order_number}`,
    html,
  });
  if (!result.ok) return json({ ok: false, message: result.error || "Email failed" }, 500);
  return json({ ok: true });
});
