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

function genCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
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

  const { action } = body;

  // -------- send_code: send a 6-digit code for signup/login/reset --------
  if (action === "send_code") {
    const { email, purpose } = body;
    if (!email || !purpose) return json({ ok: false, message: "email and purpose required" }, 400);
    if (!["signup", "login", "reset"].includes(purpose)) {
      return json({ ok: false, message: "invalid purpose" }, 400);
    }

    // For login/reset, ensure user exists in auth.users
    if (purpose === "login" || purpose === "reset") {
      const { data: u } = await supabase.auth.admin.listUsers();
      const exists = (u?.users || []).some((x: any) => x.email?.toLowerCase() === email.toLowerCase());
      if (!exists) {
        return json({ ok: false, message: "No account found with that email. Please sign up first." }, 404);
      }
    }

    // Invalidate previous unused codes for this email/purpose
    await supabase
      .from("email_codes")
      .update({ consumed: true })
      .eq("email", email.toLowerCase())
      .eq("purpose", purpose)
      .eq("consumed", false);

    const code = genCode();
    const { error: insErr } = await supabase.from("email_codes").insert({
      email: email.toLowerCase(),
      code,
      purpose,
      consumed: false,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
    if (insErr) return json({ ok: false, message: insErr.message }, 500);

    const subjectMap: Record<string, string> = {
      signup: "Your VoltStore signup code",
      login: "Your VoltStore login code",
      reset: "Your VoltStore password reset code",
    };
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a;">
        <h2 style="color:#10b981;margin:0 0 12px;">VoltStore</h2>
        <p style="font-size:16px;line-height:1.5;">Your verification code is:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:6px;background:#f1f5f9;padding:16px 24px;border-radius:12px;text-align:center;margin:16px 0;color:#0f172a;">${code}</div>
        <p style="font-size:14px;color:#475569;">This code expires in 15 minutes. If you didn't request this, you can ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
        <p style="font-size:12px;color:#94a3b8;">VoltStore — Digital Goods</p>
      </div>
    `;
    const result = await sendEmail(supabase, { to: email, subject: subjectMap[purpose], html });
    if (!result.ok) {
      return json({ ok: false, message: result.error || "Failed to send email" }, 500);
    }
    return json({ ok: true, message: "Code sent" });
  }

  // -------- verify_code: validate code (does NOT create user) --------
  if (action === "verify_code") {
    const { email, code, purpose } = body;
    if (!email || !code || !purpose) return json({ ok: false, message: "email, code, purpose required" }, 400);

    const { data: rows, error } = await supabase
      .from("email_codes")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("purpose", purpose)
      .eq("consumed", false)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) return json({ ok: false, message: error.message }, 500);
    if (!rows || rows.length === 0) {
      return json({ ok: false, message: "No code found. Please request a new code." }, 404);
    }
    const row = rows[0];
    if (row.code !== String(code).trim()) {
      return json({ ok: false, message: "Invalid code" }, 400);
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return json({ ok: false, message: "Code expired. Please request a new one." }, 400);
    }
    await supabase.from("email_codes").update({ consumed: true }).eq("id", row.id);
    return json({ ok: true, message: "Verified" });
  }

  // -------- signup: create user (after code verified) --------
  if (action === "signup") {
    const { email, password, full_name, phone, code } = body;
    if (!email || !password || !code) return json({ ok: false, message: "email, password, code required" }, 400);

    // Verify code is valid + not consumed
    const { data: rows } = await supabase
      .from("email_codes")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("purpose", "signup")
      .eq("consumed", false)
      .order("created_at", { ascending: false })
      .limit(1);
    if (!rows || rows.length === 0 || rows[0].code !== String(code).trim()) {
      return json({ ok: false, message: "Invalid or expired code" }, 400);
    }
    if (new Date(rows[0].expires_at).getTime() < Date.now()) {
      return json({ ok: false, message: "Code expired" }, 400);
    }
    await supabase.from("email_codes").update({ consumed: true }).eq("id", rows[0].id);

    // Create user via admin API (no email confirmation needed)
    const { data: created, error: cerr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, phone },
    });
    if (cerr) return json({ ok: false, message: cerr.message }, 500);

    // Create profile row
    if (created?.user) {
      await supabase.from("profiles").upsert({
        id: created.user.id,
        full_name: full_name || null,
      });
    }
    return json({ ok: true, message: "Account created. You can now sign in." });
  }

  // -------- reset_password: reset password (after code verified) --------
  if (action === "reset_password") {
    const { email, password, code } = body;
    if (!email || !password || !code) return json({ ok: false, message: "email, password, code required" }, 400);

    const { data: rows } = await supabase
      .from("email_codes")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("purpose", "reset")
      .eq("consumed", false)
      .order("created_at", { ascending: false })
      .limit(1);
    if (!rows || rows.length === 0 || rows[0].code !== String(code).trim()) {
      return json({ ok: false, message: "Invalid or expired code" }, 400);
    }
    if (new Date(rows[0].expires_at).getTime() < Date.now()) {
      return json({ ok: false, message: "Code expired" }, 400);
    }
    await supabase.from("email_codes").update({ consumed: true }).eq("id", rows[0].id);

    // Find user
    const { data: ul } = await supabase.auth.admin.listUsers();
    const user = (ul?.users || []).find((x: any) => x.email?.toLowerCase() === email.toLowerCase());
    if (!user) return json({ ok: false, message: "User not found" }, 404);

    const { error: uerr } = await supabase.auth.admin.updateUserById(user.id, { password });
    if (uerr) return json({ ok: false, message: uerr.message }, 500);

    return json({ ok: true, message: "Password reset. You can now sign in." });
  }

  return json({ ok: false, message: "Unknown action" }, 400);
});
