import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiCheck, FiZap, FiArrowLeft } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { usePro } from "../hooks/usePro";
import { startCheckout } from "../services/paymentService";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    period: "forever",
    cta: "Current plan",
    highlight: false,
    features: [
      "5 mock tests / month",
      "UGC NET Odia (free exam)",
      "Basic result analytics",
      "Leaderboard access",
    ],
  },
  {
    id: "pro_monthly",
    name: "Pro Monthly",
    price: "₹99",
    period: "/ month",
    cta: "Go Pro",
    highlight: true,
    features: [
      "Unlimited mock tests",
      "All exams (OPSC, B.Ed CET, OTET…)",
      "Full PYQ bank by year",
      "Detailed per-topic analytics",
      "Revision mode & bookmarks",
      "Priority new content",
    ],
  },
  {
    id: "pro_yearly",
    name: "Pro Yearly",
    price: "₹799",
    period: "/ year",
    cta: "Best value",
    highlight: false,
    features: [
      "Everything in Pro Monthly",
      "2 months free vs monthly",
      "Early access to new exams",
    ],
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPro, plan } = usePro();
  const [busy, setBusy] = useState(null);

  async function handleBuy(planId) {
    if (planId === "free") return;
    if (!user) {
      toast.error("Please sign in to upgrade");
      navigate("/login");
      return;
    }
    setBusy(planId);
    try {
      const res = await startCheckout({ planId, uid: user.id, user });
      if (res.success) {
        toast.success("Welcome to Pro! 🎉");
        navigate("/dashboard");
      } else if (res.error && res.error !== "Checkout cancelled") {
        toast.error(res.error);
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="pricing-page">
      <div className="pricing-inner">
        <button onClick={() => navigate(-1)} className="pricing-back-btn">
          <FiArrowLeft /> Back
        </button>

        <div className="pricing-header">
          <h1 className="pricing-title">Simple, honest pricing</h1>
          <p className="pricing-sub">
            Start free. Upgrade to Pro for every exam, the full PYQ bank, and deep analytics.
          </p>
          {isPro && (
            <div className="pricing-pro-badge">
              <FiZap /> You are on {plan || "Pro"}
            </div>
          )}
        </div>

        <div className="pricing-grid">
          {PLANS.map((p) => (
            <div key={p.id} className={p.highlight ? "pricing-card highlight" : "pricing-card"}>
              {p.highlight && <span className="pricing-badge">MOST POPULAR</span>}
              <h3 className="pricing-plan-name">{p.name}</h3>
              <div className="pricing-price-row">
                <span className="pricing-amount">{p.price}</span>
                <span className="pricing-period">{p.period}</span>
              </div>
              <ul className="pricing-features">
                {p.features.map((f) => (
                  <li key={f} className="pricing-feature-item">
                    <FiCheck className="pricing-feature-icon" /> {f}
                  </li>
                ))}
              </ul>
              <button
                disabled={p.id === "free" || (isPro && p.id !== "free") || busy === p.id}
                onClick={() => handleBuy(p.id)}
                className={`pricing-cta-btn ${p.highlight ? "primary" : p.id === "free" ? "inactive" : "secondary"}`}
              >
                {busy === p.id ? "Opening checkout…" : isPro && p.id !== "free" ? "Active" : p.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="pricing-footer-note">
          Secure payments by Razorpay · UPI, cards &amp; netbanking · Cancel anytime
        </p>
      </div>
    </div>
  );
}
