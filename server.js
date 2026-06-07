import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import Razorpay from "razorpay";
import rateLimit from "express-rate-limit";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ─────────────────────────────────────────────────────────────
   Supabase Admin Client (service-role key — server-side only,
   bypasses Row Level Security).
   Requires env vars:
     VITE_SUPABASE_URL         → your Supabase project URL
     SUPABASE_SERVICE_ROLE_KEY → service role secret (never expose to client)
   If not set, payment persistence is disabled but checkout still works.
   ───────────────────────────────────────────────────────────── */
let supabaseAdmin = null;
if (process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    supabaseAdmin = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    console.log("Supabase admin client initialised.");
  } catch (e) {
    console.error("Supabase admin init failed:", e.message);
  }
} else {
  console.warn(
    "SUPABASE_SERVICE_ROLE_KEY not set — payment persistence disabled."
  );
}

/* ───────────────────────── Razorpay client ───────────────────────── */
const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

/* Pricing plans (server-authoritative; never trust client amounts) */
const PLANS = {
  pro_monthly: { amount: 9900, label: "Pro Monthly", days: 30 },  // ₹99
  pro_yearly:  { amount: 79900, label: "Pro Yearly",  days: 365 }, // ₹799
};

const app = express();
app.set("trust proxy", 1);

/* ───────────────────────── CORS allowlist ───────────────────────── */
const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  "http://localhost:5173,http://localhost:3000,https://ugcnettra.up.railway.app"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

/* ───────────────────────── Rate limiting ───────────────────────── */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please slow down." },
});
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many payment attempts, please try again shortly." },
});

/* ─────────────────────────────────────────────────────────────
   Razorpay WEBHOOK — must read RAW body for HMAC verification,
   mounted BEFORE express.json().
   ───────────────────────────────────────────────────────────── */
app.post(
  "/api/razorpay/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (!secret) return res.status(503).json({ error: "Webhook not configured" });

      const signature = req.headers["x-razorpay-signature"];
      const expected = crypto
        .createHmac("sha256", secret)
        .update(req.body)
        .digest("hex");

      if (
        !signature ||
        !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
      ) {
        return res.status(401).json({ error: "Invalid signature" });
      }

      const event = JSON.parse(req.body.toString());

      if (event.event === "payment.captured" || event.event === "order.paid") {
        const entity =
          event.payload?.payment?.entity || event.payload?.order?.entity || {};
        const notes = entity.notes || {};
        await grantPro({
          uid:       notes.uid,
          planId:    notes.planId || "pro_monthly",
          paymentId: entity.id,
          orderId:   entity.order_id || entity.id,
          amount:    entity.amount,
          source:    "webhook",
        });
      }

      res.json({ received: true });
    } catch (err) {
      console.error("Webhook error:", err.message);
      res.status(500).json({ error: "Webhook handler failed" });
    }
  }
);

app.use(express.json({ limit: "50mb" }));

/* ───────────────────────── grantPro (Supabase) ───────────────────────── */
async function grantPro({ uid, planId, paymentId, orderId, amount, source }) {
  if (!supabaseAdmin || !uid) return;

  const plan     = PLANS[planId] || PLANS.pro_monthly;
  const now      = new Date().toISOString();
  const nowMs    = Date.now();
  const expiresAt = nowMs + plan.days * 24 * 60 * 60 * 1000;

  /* 1. Record the immutable payment */
  await supabaseAdmin.from("payments").upsert({
    id:         paymentId || `pay_${nowMs}`,
    uid,
    plan_id:    planId,
    payment_id: paymentId || null,
    order_id:   orderId   || null,
    amount:     amount    || plan.amount,
    currency:   "INR",
    status:     "captured",
    source,
    created_at: now,
  });

  /* 2. Upsert subscription row (uid is the Supabase Auth user UUID) */
  await supabaseAdmin.from("subscriptions").upsert({
    uid,
    is_pro:           true,
    plan_id:          planId,
    plan:             plan.label,
    started_at:       nowMs,
    expires_at:       expiresAt,
    last_payment_id:  paymentId || null,
    updated_at:       now,
  });

  /* 3. Mirror isPro flag onto the users table for fast client checks */
  await supabaseAdmin
    .from("users")
    .update({ is_pro: true, pro_expires_at: expiresAt })
    .eq("uid", uid);
}

/* ─────────────────── Apply rate limiter to all /api/* ─────────────────── */
app.use("/api", apiLimiter);

/* ───────────────────────── Health ───────────────────────── */
app.get("/api", (req, res) => {
  res.json({
    status:       "UGC-NET API running",
    razorpay:     !!razorpay,
    supabaseAdmin: !!supabaseAdmin,
  });
});

/* ───────────────────────── Create order ───────────────────────── */
app.post("/api/razorpay/order", paymentLimiter, async (req, res) => {
  try {
    if (!razorpay) return res.status(503).json({ error: "Payments not configured" });
    const { planId, uid } = req.body || {};
    const plan = PLANS[planId];
    if (!plan) return res.status(400).json({ error: "Invalid plan" });
    if (!uid)  return res.status(400).json({ error: "Missing user id" });

    const order = await razorpay.orders.create({
      amount:   plan.amount,
      currency: "INR",
      receipt:  `rcpt_${Date.now()}`,
      notes:    { uid, planId },
    });

    res.json({
      orderId:   order.id,
      amount:    order.amount,
      currency:  order.currency,
      keyId:     process.env.RAZORPAY_KEY_ID,
      planLabel: plan.label,
    });
  } catch (err) {
    console.error("Order error:", err.message);
    res.status(500).json({ error: "Could not create order" });
  }
});

/* ───────────────── Verify payment (client callback) ───────────────── */
app.post("/api/razorpay/verify", paymentLimiter, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      uid,
    } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing payment fields" });
    }

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(razorpay_signature),
        Buffer.from(expected)
      )
    ) {
      return res.status(400).json({ verified: false, error: "Invalid signature" });
    }

    await grantPro({
      uid,
      planId,
      paymentId: razorpay_payment_id,
      orderId:   razorpay_order_id,
      source:    "verify",
    });

    res.json({ verified: true });
  } catch (err) {
    console.error("Verify error:", err.message);
    res.status(500).json({ error: "Verification failed" });
  }
});

/* ───────────────────────── Gemini OCR ───────────────────────── */
app.post("/api/gemini-ocr", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ success: false, error: "No image provided" });

    const cleanBase64 = image.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
    const prompt = `You are an advanced OCR and MCQ extraction AI.
Extract ALL MCQ questions accurately.
Rules:
- Preserve exact wording
- Preserve Odia and English text
- Extract all options correctly
- Do not skip questions
- Return ONLY valid JSON
- No markdown
- No extra explanation
Format:
[{"question":"","options":["","","",""],"correctAnswer":0,"difficulty":"easy","language":"english","explanation":""}]`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: cleanBase64 } }] },
          ],
        }),
      }
    );

    const data = await response.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    let parsed = [];
    try { parsed = JSON.parse(text); } catch { parsed = []; }
    res.json({ success: true, questions: parsed });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ───────────────────────── Serve React build ───────────────────────── */
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
