import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer@6.9.16";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

export async function sendEmail(supabase: any, args: {
  to: string;
  subject: string;
  html: string;
  text?: string;
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
      text: args.text || args.html.replace(/<[^>]+>/g, " "),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  return new Response(
    JSON.stringify({ ok: false, message: "Use internal helpers" }),
    { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
