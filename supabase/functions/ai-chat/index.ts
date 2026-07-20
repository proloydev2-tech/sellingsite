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

function formatMoney(n: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(n) || 0);
  } catch {
    return `${currency} ${(Number(n) || 0).toFixed(2)}`;
  }
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function normalize(s: string): string {
  return String(s || "").toLowerCase().trim();
}

function hasAny(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

function hasAll(text: string, words: string[]): boolean {
  return words.every((w) => text.includes(w));
}

// Free, rule-based AI assistant. No external API key needed.
// It uses product/order/site data from the database to answer questions.
function generateReply(
  message: string,
  ctx: {
    products: any[];
    categories: any[];
    settings: any;
    support: any;
    userOrders: any[];
    userOrderItems: any[];
  },
): string {
  const msg = normalize(message);
  const { products, categories, settings, support, userOrders, userOrderItems } = ctx;
  const siteName = settings?.site_name || "VoltStore";
  const currency = settings?.currency || "BDT";

  // Greetings
  if (hasAny(msg, ["hi", "hello", "hey", "salam", "assalam", "hola"]) && msg.length < 15) {
    return pick([
      `Hi there! I'm the ${siteName} assistant. I can help with products, pricing, delivery, payments, and your orders. What would you like to know?`,
      `Hello! Welcome to ${siteName}. How can I help you today?`,
      `Hey! Ask me about any product, how to order, payment methods, or your order status.`,
    ]);
  }

  // Thanks
  if (hasAny(msg, ["thanks", "thank you", "thx", "thankyou"])) {
    return pick([
      "You're welcome! Anything else I can help with?",
      "My pleasure! Let me know if you have more questions.",
      "Anytime! Feel free to ask if anything else comes up.",
    ]);
  }

  // Who are you / what can you do
  if (hasAny(msg, ["who are you", "what are you", "your name", "what can you do", "help me", "help"])) {
    return `I'm ${siteName}'s free AI assistant. I can help you with:
• Product info, pricing, and availability
• How to place an order
• Payment methods (bKash, Nagad, Rocket, cards via RupantorPay)
• Delivery times
• Your order status (if you're signed in)
• Refund policy

Just type your question!`;
  }

  // Order status / my orders
  if (hasAny(msg, ["my order", "order status", "where is my order", "track order", "my orders", "order history", "where my order", "order number"])) {
    if (!userOrders || userOrders.length === 0) {
      return "You don't have any orders yet. Once you place an order, I can show its status here. Want me to help you pick a product?";
    }
    const lines = userOrders.slice(0, 5).map((o: any) => {
      const items = userOrderItems.filter((i: any) => i.order_id === o.id);
      const itemSummary = items.map((i: any) => `${i.product_name} (${i.variant_label}) ×${i.quantity}`).join(", ");
      return `• ${o.order_number} — ${formatMoney(Number(o.total), currency)} — ${o.status} — ${itemSummary}`;
    });
    return `Here are your recent orders:\n${lines.join("\n")}\n\nStatus meanings: pending = awaiting payment, paid = payment confirmed, fulfilled = delivered, refunded = money returned.`;
  }

  // Delivery time
  if (hasAny(msg, ["delivery", "how fast", "how long", "when will", "instant", "receive", "get my", "delivered"])) {
    return pick([
      "Most digital products are delivered within 60 seconds of payment confirmation. Some require manual verification and may take up to 10 minutes. You'll receive your product by email.",
      "Delivery is near-instant! After payment, most products arrive in your inbox within a minute. A few may take up to 10 minutes if manual verification is needed.",
    ]);
  }

  // Payment methods
  if (hasAny(msg, ["payment", "pay", "bkash", "nagad", "rocket", "card", "rupantorpay", "how to pay", "how do i pay"])) {
    return "We accept bKash, Nagad, Rocket, and major cards (Visa/Mastercard) via RupantorPay. Just add products to your cart, click Checkout, fill in your name and email, and you'll be redirected to a secure payment page.";
  }

  // Refund
  if (hasAny(msg, ["refund", "money back", "return", "cancel order", "cancel my order"])) {
    return "If a product fails to deliver and we can't resolve the issue within 24 hours, we issue a full refund. Just reply to your order confirmation email or contact support to start a refund request.";
  }

  // Contact / support / human
  if (hasAny(msg, ["human", "agent", "support", "contact", "talk to", "whatsapp", "telegram", "call", "email", "phone"])) {
    const parts: string[] = [];
    if (support?.whatsapp_url) parts.push(`WhatsApp: ${support.whatsapp_url}`);
    if (support?.telegram_url) parts.push(`Telegram: ${support.telegram_url}`);
    if (settings?.contact_email) parts.push(`Email: ${settings.contact_email}`);
    if (parts.length === 0) return "You can reach our team by replying to your order confirmation email. We typically respond within a few hours.";
    return `You can reach our team here:\n${parts.join("\n")}\n\nWe typically respond within a few hours.`;
  }

  // Pricing — find cheapest product match
  if (hasAny(msg, ["price", "cost", "how much", "cheapest", "rate", "rates", "tk", "taka", "dollar"])) {
    // Try to find a product mentioned
    const matched = products.find((p: any) => {
      const name = normalize(p.name);
      const provider = normalize(p.provider || "");
      return msg.split(/\s+/).some((w) => w.length > 3 && (name.includes(w) || provider.includes(w)));
    });
    if (matched) {
      const variants = (products as any[]).filter((v) => v.product_id === matched.id);
      // We don't have variants here, so just mention the product
      return `${matched.name}${matched.provider ? ` (${matched.provider})` : ""} is available on ${siteName}. Tap the product to see all variants and prices. ${matched.description || ""}`;
    }
    return `Prices vary by product and variant. Browse the catalog on the homepage — each product shows its starting price. Most products range from a few hundred to several thousand ${currency}. Want a recommendation? Tell me what you're looking for.`;
  }

  // Product search / recommendation
  if (hasAny(msg, ["recommend", "suggest", "best", "popular", "which product", "what should i buy", "looking for", "want", "need"])) {
    if (products.length === 0) return "We have no products listed right now. Please check back soon!";
    const featured = products.filter((p: any) => p.featured);
    const list = (featured.length ? featured : products).slice(0, 4);
    const names = list.map((p: any) => `• ${p.name}${p.provider ? ` (${p.provider})` : ""}`).join("\n");
    return `Here are some popular picks from ${siteName}:\n${names}\n\nTell me what kind of product you're looking for (game top-up, streaming, software, gift card) and I'll narrow it down.`;
  }

  // Category info
  if (hasAny(msg, ["category", "categories", "what do you sell", "what kind", "types of"])) {
    if (categories.length === 0) return "We sell digital products like game top-ups, streaming subscriptions, software licenses, and gift cards. Browse the homepage to see all categories.";
    const names = categories.map((c: any) => `• ${c.name}${c.description ? ` — ${c.description}` : ""}`).join("\n");
    return `We offer these categories:\n${names}`;
  }

  // How to order
  if (hasAny(msg, ["how to order", "how do i order", "how to buy", "how to purchase", "place order", "how order"])) {
    return "Ordering is easy:\n1. Browse the catalog and tap a product\n2. Pick a variant and quantity, then Add to cart\n3. Open the cart and tap Checkout\n4. Fill in your name and email\n5. Pay via bKash/Nagad/Rocket/card\n6. Receive your product by email instantly!";
  }

  // Account / signup
  if (hasAny(msg, ["account", "sign up", "signup", "register", "login", "log in", "sign in", "profile"])) {
    return "You can create a free account by tapping the profile icon and choosing Sign up. You'll need your name, email, phone, and a password. We'll send a 6-digit verification code to your email to confirm. With an account you can track orders, save favorites, and checkout faster.";
  }

  // Forgot password
  if (hasAny(msg, ["forgot password", "reset password", "forgot my password", "password reset", "lost password"])) {
    return "On the sign-in page, tap 'Forgot?' below the password field. Enter your email and we'll send a 6-digit reset code. Use it with a new password to reset your account.";
  }

  // Default fallback — try product match, otherwise generic help
  const words = msg.split(/\s+/).filter((w) => w.length > 3);
  const matched = products.find((p: any) => {
    const name = normalize(p.name);
    return words.some((w) => name.includes(w));
  });
  if (matched) {
    return `${matched.name}${matched.provider ? ` (${matched.provider})` : ""} — ${matched.description || "a popular digital product on " + siteName}. Tap it on the homepage to see variants and prices. Anything specific you'd like to know?`;
  }

  return pick([
    `I'm not sure I got that. I can help with products, pricing, delivery, payments, refunds, and your orders. Try asking "how fast is delivery?" or "what payment methods do you accept?"`,
    `Hmm, I didn't quite catch that. Ask me about a product, how to order, payment options, or your order status. For example: "where is my order?"`,
    `I'm a free rule-based assistant, so I work best with questions about ${siteName} — products, prices, delivery, payments, refunds, and your orders. What would you like to know?`,
  ]);
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

  const { message, user_email } = body;
  if (!message || typeof message !== "string") {
    return json({ ok: false, message: "message (string) is required" }, 400);
  }

  // Load config + catalog in parallel
  const [settingsRes, supportRes, catsRes, prodsRes] = await Promise.all([
    supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("support_config").select("*").eq("id", 1).maybeSingle(),
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("products").select("*").order("sort_order"),
  ]);

  const settings = settingsRes.data;
  const support = supportRes.data;
  const categories = catsRes.data || [];
  const products = prodsRes.data || [];

  // If AI is disabled, return a polite redirect
  if (support?.ai_enabled === false) {
    const parts: string[] = [];
    if (support?.whatsapp_url) parts.push(`WhatsApp: ${support.whatsapp_url}`);
    if (support?.telegram_url) parts.push(`Telegram: ${support.telegram_url}`);
    return json({
      ok: true,
      reply: `The AI assistant is currently turned off by the store admin. Please reach us via:\n${parts.join("\n") || "your order confirmation email."}`,
    });
  }

  // Load user's orders if they provided an email
  let userOrders: any[] = [];
  let userOrderItems: any[] = [];
  if (user_email) {
    const { data: orders } = await supabase
      .from("orders")
      .select("*")
      .ilike("customer_email", user_email)
      .order("created_at", { ascending: false })
      .limit(10);
    userOrders = orders || [];
    if (userOrders.length) {
      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", userOrders.map((o: any) => o.id));
      userOrderItems = items || [];
    }
  }

  const reply = generateReply(message, {
    products,
    categories,
    settings,
    support,
    userOrders,
    userOrderItems,
  });

  return json({ ok: true, reply });
});
