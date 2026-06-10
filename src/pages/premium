/**
 * premium.jsx — Premium redesign of LandingPage
 * Drops into src/pages/premium.jsx
 * Route: <Route path="/premium" element={<PremiumLandingPage />} />
 *
 * Stack: framer-motion (already in package.json), react-icons, react-router-dom
 * Styles: appended to src/styles/globals.css  (lp-pm-* classes, --pm-* tokens)
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  FiBookOpen, FiBarChart2, FiAward, FiArrowRight, FiStar, FiZap,
  FiTarget, FiClock, FiTrendingUp, FiShield, FiSmartphone,
  FiCheckCircle, FiChevronDown, FiUsers,
} from "react-icons/fi";

/* ── Animation variants ─────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = (delay = 0) => ({
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, delay, ease: "easeOut" } },
});
const wordReveal = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
};
const word = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

/* ── Scroll-triggered section ───────────────────────────────── */
function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={stagger(delay)}
    >
      {children}
    </motion.div>
  );
}

/* ── Animated counter ───────────────────────────────────────── */
function Counter({ target, suffix = "", duration = 1800 }) {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let v = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      v = Math.min(v + step, target);
      setN(Math.floor(v));
      if (v >= target) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [inView, target, duration]);
  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>;
}

/* ── FAQ row ────────────────────────────────────────────────── */
function FAQ({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lp-pm-faq-item">
      <button className="lp-pm-faq-q" onClick={() => setOpen(!open)}>
        <span className="lp-pm-faq-q-text">{q}</span>
        <FiChevronDown
          size={16}
          color="#4f6aff"
          style={{ flexShrink: 0, transition: "transform 0.25s", transform: open ? "rotate(180deg)" : "rotate(0)" }}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.p
            className="lp-pm-faq-a"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            {a}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════ */
export default function PremiumLandingPage() {
  const navigate = useNavigate();

  /* ── DATA ─────────────────────────────────────────────────── */
  const stats = [
    { value: 12500, suffix: "+", label: "Practice Questions" },
    { value: 4800,  suffix: "+", label: "Registered Students" },
    { value: 320,   suffix: "+", label: "Mock Tests" },
    { value: 98,    suffix: "%", label: "Syllabus Coverage" },
  ];

  const features = [
    { icon: <FiBookOpen size={22} />, title: "Full-Length Mock Tests",   desc: "Timed mocks covering Paper I & II with negative marking and detailed solutions that mirror the real UGC NET pattern." },
    { icon: <FiTarget size={22} />,   title: "Topic-Wise Practice",      desc: "Drill any chapter — Medieval Odia Poetry, Linguistics, Folk Literature — until mastery before moving on." },
    { icon: <FiBarChart2 size={22} />,title: "Deep Analytics",           desc: "Track accuracy, time per question, and weak topics. See trends across every test you've taken." },
    { icon: <FiAward size={22} />,    title: "Live Leaderboard",         desc: "Rank prediction and percentile scoring after every mock. See where you stand against other aspirants." },
    { icon: <FiZap size={22} />,      title: "PYQ Bank",                 desc: "Previous year questions tagged by year so you can spot recurring patterns and exam-setter habits." },
    { icon: <FiSmartphone size={22} />,title: "Mobile-First Design",     desc: "Start a test on desktop, finish on phone. The exam interface adapts to any screen without friction." },
  ];

  const syllabus = [
    { paper: "Paper I — Teaching & Research Aptitude", tag: "P1", units: ["Teaching Aptitude","Research Aptitude","Reading Comprehension","Communication","Reasoning & Logical Deduction","Data Interpretation","ICT","People & Environment","Higher Education"] },
    { paper: "Paper II — Odia Literature",             tag: "P2", units: ["Ancient & Medieval Odia Poetry","Modern Odia Poetry","Odia Prose & Fiction","Odia Drama","Literary Criticism","Linguistics","Folk Literature","Comparative Literature","Journalism & Translation"] },
  ];

  const plans = [
    { name: "Free",       price: "₹0",     period: "forever",      highlight: false, features: ["5 mock tests per month","Topic-wise practice","Basic score report","Leaderboard access"] },
    { name: "Pro",        price: "₹299",   period: "per month",    highlight: true,  badge: "Most Popular", features: ["Unlimited mock tests","Full PYQ bank","Deep analytics & trends","Rank prediction & percentile","Bookmarks & revision mode","Priority support"] },
    { name: "Annual Pro", price: "₹1,999", period: "per year",     highlight: false, save: "Save ₹1,589",   features: ["Everything in Pro","Study streak tracking","Achievement badges","Discussion forum","Exam notification alerts"] },
  ];

  const testimonials = [
    { name: "Priya Mohanty",  score: "JRF — AIR 12",        text: "The mock tests here are the closest to the actual NET pattern. After 3 months I scored in the top 1% nationally." },
    { name: "Subhash Panda",  score: "NET Qualified",        text: "Topic-wise analytics showed exactly where I was losing marks. Odia Prose accuracy went from 52% to 81% in 6 weeks." },
    { name: "Sasmita Dash",   score: "NET + Lecturer Exam",  text: "The PYQ bank and negative marking practice were the real difference-makers. Nothing else comes close for Odia NET." },
  ];

  const faqs = [
    { q: "Who is this platform designed for?",          a: "Students preparing for UGC NET Odia Literature (Paper I + II), Odisha SET, and lecturer recruitment. The question bank covers the complete UGC NET syllabus." },
    { q: "Is content available in Odia medium?",         a: "Yes. Questions come in Odia, English, and bilingual formats. Filter by language in practice mode. Full Odia-medium support is a core priority." },
    { q: "How is mock test scoring calculated?",          a: "+1 per correct answer, −0.25 per incorrect, 0 for unattempted — exactly matching the official UGC NET scheme." },
    { q: "Can I attempt tests on mobile?",               a: "Fully optimised for mobile and tablet. Start on desktop, continue on phone — no restrictions on device switching." },
    { q: "What is the refund policy for Pro?",           a: "7-day full refund, no questions asked. Contact support within 7 days of purchase." },
    { q: "How often are new mocks added?",               a: "New full-length mocks weekly. Topic-wise tests continuously. Pro users get immediate access to all new content." },
  ];

  const analyticsPoints = [
    { icon: <FiTrendingUp size={15} />, text: "Accuracy trends over time" },
    { icon: <FiClock size={15} />,      text: "Time-per-question heatmap" },
    { icon: <FiTarget size={15} />,     text: "Weak topic identification" },
    { icon: <FiAward size={15} />,      text: "Rank & percentile prediction" },
  ];

  const topicBars = [
    { topic: "Medieval Poetry", pct: 91, color: "#22d3a0" },
    { topic: "Modern Prose",    pct: 74, color: "#4f6aff" },
    { topic: "Linguistics",     pct: 52, color: "#f87171" },
    { topic: "Folk Literature", pct: 68, color: "#fbbf24" },
  ];

  /* ── HEADLINE WORDS for staggered reveal ─────────────────── */
  const headline1 = "Crack UGC NET Odia".split(" ");
  const headline2 = "with Confidence".split(" ");

  /* ── RENDER ───────────────────────────────────────────────── */
  return (
    <div className="lp-pm-root">

      {/* ════ NAV ═══════════════════════════════════════════════ */}
      <nav className="lp-pm-nav">
        <div className="lp-pm-nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className="lp-pm-nav-icon">
            <FiBookOpen size={16} color="#fff" />
          </div>
          <div>
            <div className="lp-pm-nav-brand">OdiaExams</div>
            <div className="lp-pm-nav-sub">UGC NET · OSET · Lecturer</div>
          </div>
        </div>

        <div className="lp-pm-nav-links">
          {["Features", "Syllabus", "Pricing", "FAQ"].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} className="lp-pm-nav-link">{l}</a>
          ))}
        </div>

        <div className="lp-pm-nav-actions">
          <button className="lp-pm-btn-ghost" onClick={() => navigate("/login")}>Sign In</button>
          <button className="lp-pm-btn-primary" onClick={() => navigate("/register")}>Start Free</button>
        </div>
      </nav>

      {/* ════ HERO ══════════════════════════════════════════════ */}
      <div className="lp-pm-hero">
        <div className="lp-pm-hero-orb-1" />
        <div className="lp-pm-hero-orb-2" />

        <div className="lp-pm-hero-inner">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="lp-pm-badge">
              <FiZap size={12} /> India's #1 Platform for UGC NET Odia Literature
            </span>
          </motion.div>

          {/* Word-by-word headline */}
          <motion.h1 className="lp-pm-h1" variants={wordReveal} initial="hidden" animate="show">
            {headline1.map((w, i) => (
              <motion.span key={i} variants={word} style={{ display: "inline-block", marginRight: "0.25em" }}>{w}</motion.span>
            ))}
            <br />
            <motion.span className="lp-pm-h1-accent" variants={wordReveal} initial="hidden" animate="show" style={{ display: "inline-flex", gap: "0.25em", flexWrap: "wrap", justifyContent: "center" }}>
              {headline2.map((w, i) => (
                <motion.span key={i} variants={word} style={{ display: "inline-block" }}>{w}</motion.span>
              ))}
            </motion.span>
          </motion.h1>

          <motion.p className="lp-pm-hero-sub" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45 }}>
            Full-length mock tests · Topic-wise practice · PYQ bank · Deep analytics —
            everything to qualify NET and secure your lectureship.
          </motion.p>

          <motion.div className="lp-pm-hero-actions" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}>
            <button className="lp-pm-hero-cta" onClick={() => navigate("/register")}>
              Start Free Today <FiArrowRight size={17} />
            </button>
            <button className="lp-pm-hero-secondary" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
              Explore Features
            </button>
          </motion.div>

          <motion.p className="lp-pm-hero-note" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
            No credit card required · Free plan available · Cancel anytime
          </motion.p>
        </div>
      </div>

      {/* ════ STATS ══════════════════════════════════════════════ */}
      <div className="lp-pm-stats">
        <div className="lp-pm-stats-inner">
          {stats.map((s, i) => (
            <motion.div key={i} className="lp-pm-stat" variants={stagger(i * 0.08)} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <div className="lp-pm-stat-val"><Counter target={s.value} suffix={s.suffix} /></div>
              <div className="lp-pm-stat-label">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ════ FEATURES ═══════════════════════════════════════════ */}
      <div id="features" className="lp-pm-section">
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 0 }}>
            <p className="lp-pm-eyebrow">Platform Features</p>
            <h2 className="lp-pm-h2">Everything to clear NET<br />in one place</h2>
          </div>
        </Reveal>

        <div className="lp-pm-features-grid">
          {features.map((f, i) => (
            <motion.div key={i} className="lp-pm-feature-card" variants={stagger(i * 0.06)} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <div className="lp-pm-feature-icon">{f.icon}</div>
              <h3 className="lp-pm-feature-title">{f.title}</h3>
              <p className="lp-pm-feature-desc">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ════ ANALYTICS ══════════════════════════════════════════ */}
      <div className="lp-pm-analytics-wrap">
        <div className="lp-pm-analytics-inner">
          <Reveal>
            <p className="lp-pm-eyebrow">Performance Analytics</p>
            <h2 className="lp-pm-h2" style={{ marginBottom: "1rem" }}>Know exactly where<br />you need to improve</h2>
            <p className="lp-pm-section-sub">
              After every test, see your accuracy by subject, time per question,
              comparison with top scorers, and a personalised list of weak areas.
            </p>
            <div className="lp-pm-analytics-list">
              {analyticsPoints.map((item, i) => (
                <div key={i} className="lp-pm-analytics-item">
                  <span className="lp-pm-analytics-icon">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </Reveal>

          {/* Mock card */}
          <Reveal delay={0.1}>
            <div className="lp-pm-mock-card">
              <div className="lp-pm-mock-title">Your Performance — Mock Test #47</div>
              <div className="lp-pm-mock-grid">
                {[
                  { label: "Score",    val: "73 / 100",   color: "#4f6aff" },
                  { label: "Accuracy", val: "78.4%",      color: "#22d3a0" },
                  { label: "Time Used",val: "1h 42m",     color: "#fbbf24" },
                  { label: "Rank",     val: "#124 / 892", color: "#c084fc" },
                ].map((s, i) => (
                  <div key={i} className="lp-pm-mock-stat">
                    <div className="lp-pm-mock-stat-label">{s.label}</div>
                    <div className="lp-pm-mock-stat-val" style={{ color: s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--pm-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.6rem" }}>
                Topic Accuracy
              </div>
              {topicBars.map(({ topic, pct, color }) => (
                <div key={topic}>
                  <div className="lp-pm-bar-label">
                    <span style={{ fontSize: "0.8rem", color: "rgba(238,240,248,0.65)" }}>{topic}</span>
                    <span style={{ fontWeight: 700, color }}>{pct}%</span>
                  </div>
                  <div className="lp-pm-bar-track">
                    <motion.div
                      className="lp-pm-bar-fill"
                      style={{ background: `linear-gradient(90deg, ${color}99, ${color})` }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: 0.2 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      {/* ════ SYLLABUS ════════════════════════════════════════════ */}
      <div id="syllabus" className="lp-pm-section">
        <Reveal style={{ textAlign: "center" }}>
          <p className="lp-pm-eyebrow">Complete Coverage</p>
          <h2 className="lp-pm-h2">Full UGC NET Syllabus — Covered</h2>
        </Reveal>

        <div className="lp-pm-syllabus-grid">
          {syllabus.map((paper, i) => (
            <motion.div key={i} className="lp-pm-syllabus-card" variants={stagger(i * 0.1)} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <div className="lp-pm-syllabus-head">
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--pm-grad-accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: "0.78rem" }}>{paper.tag}</span>
                </div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.92rem", color: "var(--pm-text)", lineHeight: 1.35 }}>{paper.paper}</h3>
              </div>
              <div className="lp-pm-syllabus-pill-wrap">
                {paper.units.map(u => (
                  <span key={u} className="lp-pm-syllabus-pill">
                    <FiCheckCircle size={11} /> {u}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ════ TESTIMONIALS ════════════════════════════════════════ */}
      <div className="lp-pm-testi-bg lp-pm-section-full">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center" }}>
            <p className="lp-pm-eyebrow">Success Stories</p>
            <h2 className="lp-pm-h2">Students who qualified NET</h2>
          </Reveal>

          <div className="lp-pm-testi-grid">
            {testimonials.map((t, i) => (
              <motion.div key={i} className="lp-pm-testi-card" variants={stagger(i * 0.1)} initial="hidden" whileInView="show" viewport={{ once: true }}>
                <div className="lp-pm-stars">
                  {[...Array(5)].map((_, j) => <FiStar key={j} size={13} style={{ fill: "#fbbf24", color: "#fbbf24" }} />)}
                </div>
                <p className="lp-pm-testi-text">"{t.text}"</p>
                <div className="lp-pm-testi-author">
                  <div className="lp-pm-testi-avatar">{t.name.split(" ").map(n => n[0]).join("")}</div>
                  <div>
                    <div className="lp-pm-testi-name">{t.name}</div>
                    <div className="lp-pm-testi-score">{t.score}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ════ PRICING ════════════════════════════════════════════ */}
      <div id="pricing" className="lp-pm-section">
        <Reveal style={{ textAlign: "center" }}>
          <p className="lp-pm-eyebrow">Simple Pricing</p>
          <h2 className="lp-pm-h2">Start free. Upgrade when ready.</h2>
        </Reveal>

        <div className="lp-pm-pricing-grid">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              className={`lp-pm-plan${plan.highlight ? " lp-pm-plan--highlight" : ""}`}
              variants={stagger(i * 0.1)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              {plan.badge && <span className="lp-pm-plan-badge">{plan.badge}</span>}
              {plan.save  && <span className="lp-pm-plan-save">{plan.save}</span>}
              <div className="lp-pm-plan-name">{plan.name}</div>
              <div className="lp-pm-plan-price">{plan.price}</div>
              <div className="lp-pm-plan-period">{plan.period}</div>
              <hr className="lp-pm-plan-divider" />
              {plan.features.map(f => (
                <div key={f} className="lp-pm-plan-feature">
                  <FiCheckCircle size={14} color={plan.highlight ? "#22d3a0" : "#4f6aff"} style={{ flexShrink: 0 }} />
                  {f}
                </div>
              ))}
              <div style={{ marginTop: "1.5rem" }}>
                <button
                  className={plan.highlight ? "lp-pm-plan-btn-pro" : "lp-pm-plan-btn-free"}
                  onClick={() => navigate("/register")}
                >
                  {plan.name === "Free" ? "Start for Free" : "Get Started"}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ════ FAQ ════════════════════════════════════════════════ */}
      <div id="faq" className="lp-pm-faq-bg lp-pm-section-full">
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <p className="lp-pm-eyebrow">FAQs</p>
            <h2 className="lp-pm-h2">Common questions</h2>
          </Reveal>
          {faqs.map((item, i) => <FAQ key={i} q={item.q} a={item.a} />)}
        </div>
      </div>

      {/* ════ FINAL CTA ══════════════════════════════════════════ */}
      <div className="lp-pm-cta-bg lp-pm-section-full">
        <Reveal style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <FiShield size={36} color="rgba(79,106,255,0.4)" style={{ marginBottom: "1.25rem" }} />
          <h2 className="lp-pm-h2">Your NET qualification<br />journey starts today</h2>
          <p className="lp-pm-section-sub" style={{ margin: "0.75rem auto 2.5rem", display: "block" }}>
            Join 4,800+ students already preparing smarter. Free forever for 5 mocks a month.
          </p>
          <button className="lp-pm-cta-mega-btn" onClick={() => navigate("/register")}>
            Create Free Account <FiArrowRight size={18} />
          </button>
          <p style={{ color: "rgba(120,128,160,0.4)", fontSize: "0.78rem", marginTop: "1rem" }}>
            No credit card required · 7-day money-back on Pro
          </p>
        </Reveal>
      </div>

      {/* ════ FOOTER ══════════════════════════════════════════════ */}
      <footer className="lp-pm-footer">
        <div className="lp-pm-footer-inner">
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--pm-grad-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FiBookOpen size={13} color="#fff" />
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "rgba(238,240,248,0.7)", fontSize: "0.875rem" }}>OdiaExams</span>
          </div>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            {["Privacy Policy", "Terms of Service", "Contact"].map(l => (
              <a key={l} href="#" className="lp-pm-footer-link">{l}</a>
            ))}
          </div>
          <p className="lp-pm-footer-copy">© 2025 OdiaExams. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
