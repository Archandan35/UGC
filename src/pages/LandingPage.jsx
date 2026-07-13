/**
 * LandingPage.jsx
 * Drop this file into src/pages/LandingPage.jsx
 * Add to App.jsx:  <Route path="/" element={<LandingPage />} />
 * Move old "/" login route to "/login"
 *
 * Requires: react-router-dom, react-icons, framer-motion (already in package.json)
 * Uses the existing globals.css design tokens (--blue-*, --grad-*, --shadow-*, etc.)
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  FiBookOpen, FiBarChart2, FiAward, FiUsers, FiCheckCircle,
  FiArrowRight, FiStar, FiZap, FiTarget, FiClock, FiTrendingUp,
  FiShield, FiSmartphone, FiMenu, FiX, FiChevronDown,
} from "react-icons/fi";

/* ─── Animation helpers ─────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25,0.46,0.45,0.94] } },
};
const stagger = (delay = 0) => ({
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, delay, ease: "easeOut" } },
});

/* ─── Section wrapper with scroll-triggered reveal ─────────── */
function Section({ children, className = "", style = {} }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      className={className}
      style={style}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={fadeUp}
    >
      {children}
    </motion.section>
  );
}

/* ─── Counter animation ──────────────────────────────────────── */
function AnimatedCounter({ target, suffix = "", duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setCount(Math.floor(start));
      if (start >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── FAQ item ───────────────────────────────────────────────── */
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lp-faq-item" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1rem", marginBottom: "1rem" }}>
      <button
        className="lp-faq-q"
        onClick={() => setOpen(!open)}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", cursor: "pointer", padding: "0.5rem 0", textAlign: "left", gap: "1rem" }}
      >
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1rem", color: "var(--text-primary)" }}>{q}</span>
        <FiChevronDown
          size={18}
          color="var(--primary)"
          style={{ flexShrink: 0, transition: "transform 0.25s", transform: open ? "rotate(180deg)" : "rotate(0)" }}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        style={{ overflow: "hidden" }}
        transition={{ duration: 0.28, ease: "easeInOut" }}
      >
        <p style={{ margin: "0.5rem 0 0", color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "0.925rem", paddingRight: "2rem" }}>{a}</p>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);

  /* ─── DATA ────────────────────────────────────────────────── */
  const stats = [
    { value: 12500, suffix: "+", label: "Practice Questions" },
    { value: 4800,  suffix: "+", label: "Registered Students" },
    { value: 320,   suffix: "+", label: "Mock Tests" },
    { value: 98,    suffix: "%", label: "Syllabus Coverage" },
  ];

  const features = [
    { icon: <FiBookOpen size={28} />, title: "Full-Length Mock Tests", desc: "Simulate the real UGC NET exam with timed mocks covering Paper I & Paper II, with negative marking and detailed solutions." },
    { icon: <FiTarget size={28} />, title: "Topic-Wise Practice", desc: "Drill down into any chapter — Medieval Odia Poetry, Modern Prose, Linguistics — and master it before moving on." },
    { icon: <FiBarChart2 size={28} />, title: "Deep Analytics", desc: "Track accuracy, time per question, weak topics, and compare your performance against your own trends over time." },
    { icon: <FiAward size={28} />, title: "Live Leaderboard", desc: "See where you stand against other aspirants. Rank prediction and percentile scoring after every mock." },
    { icon: <FiZap size={28} />, title: "PYQ Bank", desc: "Practice with previous year questions tagged by year. Understand the pattern and recurring question types." },
    { icon: <FiSmartphone size={28} />, title: "Mobile-First Design", desc: "Take tests on any device. The exam interface adapts seamlessly between phone, tablet, and desktop." },
  ];

  const syllabus = [
    { paper: "Paper I — Teaching & Research Aptitude", units: ["Teaching Aptitude", "Research Aptitude", "Reading Comprehension", "Communication", "Reasoning & Logical Deduction", "Data Interpretation", "ICT", "People & Environment", "Higher Education"] },
    { paper: "Paper II — Odia Literature", units: ["Ancient & Medieval Odia Poetry", "Modern Odia Poetry", "Odia Prose & Fiction", "Odia Drama", "Odia Literary Criticism", "Linguistics & Language Theory", "Folk Literature", "Comparative Literature", "Odia Journalism & Translation"] },
  ];

  const plans = [
    {
      name: "Free",
      price: "₹0",
      period: "forever",
      highlight: false,
      features: ["5 mock tests per month", "Topic-wise practice", "Basic score report", "Leaderboard access"],
    },
    {
      name: "Pro",
      price: "₹299",
      period: "per month",
      highlight: true,
      badge: "Most Popular",
      features: ["Unlimited mock tests", "PYQ bank (all years)", "Deep analytics & trends", "Rank prediction & percentile", "Bookmarks & revision mode", "Priority support"],
    },
    {
      name: "Annual Pro",
      price: "₹1,999",
      period: "per year",
      highlight: false,
      save: "Save ₹1,589",
      features: ["Everything in Pro", "Study streak tracking", "Achievement badges", "Discussion forum access", "Exam notification alerts"],
    },
  ];

  const testimonials = [
    { name: "Priya Mohanty", score: "JRF — AIR 12", text: "The mock tests here are the closest I've found to the actual NET pattern. After 3 months of practice, I scored in the top 1% nationally." },
    { name: "Subhash Panda", score: "NET Qualified", text: "Topic-wise analytics showed me exactly where I was losing marks. I improved my Odia Prose accuracy from 52% to 81% in 6 weeks." },
    { name: "Sasmita Dash", score: "NET + Lecturer Exam", text: "Used this platform alongside my coaching. The PYQ bank and negative marking practice were the real difference makers." },
  ];

  const faqs = [
    { q: "Who is this platform designed for?", a: "Students preparing for UGC NET in Odia Literature (Paper I + Paper II), Odisha SET, and lecturer recruitment exams. The question bank covers the complete UGC NET syllabus." },
    { q: "Is the content available in Odia medium?", a: "Yes. Questions are available in Odia, English, and bilingual format. You can filter by language in practice mode. Full Odia-medium support is a core priority." },
    { q: "How is the mock test scoring calculated?", a: "Each correct answer earns +1 mark. Each incorrect answer deducts –0.25 (negative marking). Unattempted questions carry 0 marks — matching the official UGC NET pattern exactly." },
    { q: "Can I attempt tests on mobile?", a: "Yes. The exam interface is fully optimized for mobile and tablet. You can start a test on desktop and there is no restriction on device type." },
    { q: "What is the refund policy for Pro?", a: "We offer a 7-day full refund if you are not satisfied. No questions asked — contact support within 7 days of purchase." },
    { q: "How often are new mocks added?", a: "New full-length mocks are added every week. Topic-wise tests are added continuously as the question bank grows. Pro users get immediate access to all new content." },
  ];

  /* ─── RENDER ──────────────────────────────────────────────── */
  return (
    <div className="lp-root" style={{ fontFamily: "var(--font-body)", background: "var(--bg)", color: "var(--text)", minHeight: "100vh", overflowX: "hidden" }}>

      {/* ════ NAV ═══════════════════════════════════════════════ */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "var(--surface-glass)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 1.5rem", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer" }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--grad-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FiBookOpen size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)", lineHeight: 1 }}>OdiaExams</div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.05em" }}>UGC NET · OSET · Lecturer</div>
            </div>
          </div>

          {/* Desktop nav links */}
          <div className="lp-nav-links" style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
            {["Features", "Syllabus", "Pricing", "FAQ"].map(link => (
              <a key={link} href={`#${link.toLowerCase()}`}
                style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500, transition: "color 0.15s" }}
                onMouseEnter={e => e.target.style.color = "var(--primary)"}
                onMouseLeave={e => e.target.style.color = "var(--text-secondary)"}
              >{link}</a>
            ))}
          </div>

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button onClick={() => navigate("/login")}
              style={{ background: "none", border: "1.5px solid var(--border-medium)", borderRadius: "var(--radius-full)", padding: "0.45rem 1.2rem", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)", transition: "border-color 0.15s" }}>
              Sign In
            </button>
            <button onClick={() => navigate("/register")}
              style={{ background: "var(--grad-primary)", border: "none", borderRadius: "var(--radius-full)", padding: "0.5rem 1.25rem", cursor: "pointer", fontWeight: 700, fontSize: "0.875rem", color: "#fff", boxShadow: "var(--shadow-btn)", transition: "opacity 0.15s" }}>
              Start Free
            </button>
          </div>
        </div>
      </nav>

      {/* ════ HERO ══════════════════════════════════════════════ */}
      <div style={{ background: "var(--grad-header)", position: "relative", overflow: "hidden" }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 420, height: 420, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,0.03)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "5rem 1.5rem 4.5rem", textAlign: "center", position: "relative" }}>
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "var(--radius-full)", padding: "0.35rem 1rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.9)", fontWeight: 600, marginBottom: "1.5rem", letterSpacing: "0.03em" }}>
              <FiZap size={13} /> India's #1 Platform for UGC NET Odia Literature
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "#fff", lineHeight: 1.15, marginBottom: "1.25rem", letterSpacing: "-0.02em" }}
          >
            Crack UGC NET Odia Literature<br />
            <span style={{ background: "linear-gradient(90deg, #60a5fa, #a5f3fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              with Confidence
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", color: "rgba(255,255,255,0.75)", maxWidth: 580, margin: "0 auto 2.5rem", lineHeight: 1.65 }}
          >
            Full-length mock tests · Topic-wise practice · PYQ bank · Deep analytics —
            everything you need to qualify NET and secure your lectureship.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}
          >
            <button onClick={() => navigate("/register")}
              style={{ background: "#fff", border: "none", borderRadius: "var(--radius-full)", padding: "0.85rem 2.2rem", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem", color: "var(--primary)", boxShadow: "0 8px 32px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              Start Free Today <FiArrowRight size={18} />
            </button>
            <button onClick={() => document.getElementById("features").scrollIntoView({ behavior: "smooth" })}
              style={{ background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.25)", borderRadius: "var(--radius-full)", padding: "0.85rem 2rem", cursor: "pointer", fontWeight: 600, fontSize: "1rem", color: "#fff" }}>
              Explore Features
            </button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem", marginTop: "1.25rem" }}
          >
            No credit card required · Free plan available · Cancel anytime
          </motion.p>
        </div>
      </div>

      {/* ════ STATS ══════════════════════════════════════════════ */}
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "2.5rem 1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
          {stats.map((s, i) => (
            <motion.div key={i} variants={stagger(i * 0.08)} initial="hidden" whileInView="show" viewport={{ once: true }}
              style={{ textAlign: "center", padding: "1.25rem 1rem" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "2.2rem", color: "var(--primary)", lineHeight: 1 }}>
                <AnimatedCounter target={s.value} suffix={s.suffix} />
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.35rem", fontWeight: 500 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ════ FEATURES ═══════════════════════════════════════════ */}
      <div id="features" style={{ maxWidth: 1120, margin: "0 auto", padding: "5rem 1.5rem" }}>
        <Section>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ color: "var(--primary)", fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.5rem" }}>Platform Features</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(1.6rem,4vw,2.4rem)", color: "var(--text-primary)", lineHeight: 1.2 }}>
              Everything to clear NET<br />in one place
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
            {features.map((f, i) => (
              <motion.div key={i} variants={stagger(i * 0.07)} initial="hidden" whileInView="show" viewport={{ once: true }}
                style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1.75rem", boxShadow: "var(--shadow-card)", transition: "transform 0.2s, box-shadow 0.2s" }}
                whileHover={{ y: -4, boxShadow: "var(--shadow-lg)" }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--grad-card-top)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", marginBottom: "1rem" }}>
                  {f.icon}
                </div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>{f.title}</h3>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.65, fontSize: "0.9rem" }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </Section>
      </div>

      {/* ════ ANALYTICS PREVIEW ══════════════════════════════════ */}
      <div style={{ background: "var(--grad-header)", padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
          <Section>
            <p style={{ color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.75rem" }}>Performance Analytics</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(1.5rem,3.5vw,2.2rem)", color: "#fff", lineHeight: 1.25, marginBottom: "1.25rem" }}>
              Know exactly where<br />you need to improve
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.7, marginBottom: "2rem", fontSize: "0.95rem" }}>
              After every test, see your accuracy by subject and topic, time spent per question, comparison with top scorers, and a personalised list of weak areas to focus on.
            </p>
            {[
              { icon: <FiTrendingUp size={16} />, text: "Accuracy trends over time" },
              { icon: <FiClock size={16} />,     text: "Time-per-question heatmap" },
              { icon: <FiTarget size={16} />,    text: "Weak topic identification" },
              { icon: <FiAward size={16} />,     text: "Rank & percentile prediction" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem", color: "rgba(255,255,255,0.85)", fontSize: "0.9rem" }}>
                <span style={{ color: "#60a5fa" }}>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </Section>

          {/* Mock analytics card */}
          <Section>
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-xl)", padding: "1.5rem", boxShadow: "var(--shadow-xl)" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1.25rem", fontSize: "0.95rem" }}>
                Your Performance — Mock Test #47
              </div>
              {/* Mini stat grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
                {[
                  { label: "Score", value: "73 / 100", color: "var(--primary)" },
                  { label: "Accuracy", value: "78.4%", color: "var(--success)" },
                  { label: "Time Used", value: "1h 42m", color: "var(--warning)" },
                  { label: "Rank", value: "#124 / 892", color: "#7c3aed" },
                ].map((stat, i) => (
                  <div key={i} style={{ background: "var(--bg)", borderRadius: "var(--radius)", padding: "0.85rem" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.25rem", fontWeight: 600 }}>{stat.label}</div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.15rem", color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>
              {/* Topic accuracy bars */}
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Topic Accuracy</div>
              {[
                { topic: "Medieval Poetry", pct: 91 },
                { topic: "Modern Prose", pct: 74 },
                { topic: "Linguistics", pct: 52 },
                { topic: "Folk Literature", pct: 68 },
              ].map(({ topic, pct }) => (
                <div key={topic} style={{ marginBottom: "0.6rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.2rem" }}>
                    <span>{topic}</span><span style={{ fontWeight: 700, color: pct < 60 ? "var(--danger)" : pct > 80 ? "var(--success)" : "var(--warning)" }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: "var(--border)", overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}
                      style={{ height: "100%", borderRadius: 999, background: pct < 60 ? "var(--grad-danger)" : pct > 80 ? "var(--grad-success)" : "var(--grad-warning)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>

      {/* ════ SYLLABUS ════════════════════════════════════════════ */}
      <div id="syllabus" style={{ maxWidth: 1120, margin: "0 auto", padding: "5rem 1.5rem" }}>
        <Section>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ color: "var(--primary)", fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.5rem" }}>Complete Coverage</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(1.6rem,4vw,2.4rem)", color: "var(--text-primary)", lineHeight: 1.2 }}>
              Full UGC NET Syllabus — Covered
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
            {syllabus.map((paper, i) => (
              <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border-blue)", borderRadius: "var(--radius-lg)", padding: "1.75rem", boxShadow: "var(--shadow-card)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--grad-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#fff", fontWeight: 800, fontSize: "0.8rem" }}>P{i + 1}</span>
                  </div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.3 }}>{paper.paper}</h3>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {paper.units.map(unit => (
                    <span key={unit} style={{ background: "var(--blue-50)", color: "var(--blue-700)", border: "1px solid var(--blue-100)", borderRadius: "var(--radius-full)", padding: "0.25rem 0.75rem", fontSize: "0.8rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <FiCheckCircle size={12} /> {unit}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ════ TESTIMONIALS ════════════════════════════════════════ */}
      <div style={{ background: "var(--grad-page-bg)", padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <Section>
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <p style={{ color: "var(--primary)", fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.5rem" }}>Success Stories</p>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(1.6rem,4vw,2.4rem)", color: "var(--text-primary)", lineHeight: 1.2 }}>
                Students who qualified NET
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
              {testimonials.map((t, i) => (
                <motion.div key={i} variants={stagger(i * 0.1)} initial="hidden" whileInView="show" viewport={{ once: true }}
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1.5rem", boxShadow: "var(--shadow-card)" }}>
                  <div style={{ display: "flex", gap: "0.25rem", marginBottom: "0.85rem" }}>
                    {[...Array(5)].map((_, j) => <FiStar key={j} size={14} style={{ fill: "#f59e0b", color: "#f59e0b" }} />)}
                  </div>
                  <p style={{ color: "var(--text-secondary)", lineHeight: 1.65, fontSize: "0.9rem", marginBottom: "1.25rem", fontStyle: "italic" }}>"{t.text}"</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--grad-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: "0.875rem" }}>
                      {t.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>{t.name}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--primary)", fontWeight: 600 }}>{t.score}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Section>
        </div>
      </div>

      {/* ════ PRICING ════════════════════════════════════════════ */}
      <div id="pricing" style={{ maxWidth: 1120, margin: "0 auto", padding: "5rem 1.5rem" }}>
        <Section>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ color: "var(--primary)", fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.5rem" }}>Simple Pricing</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(1.6rem,4vw,2.4rem)", color: "var(--text-primary)", lineHeight: 1.2 }}>
              Start free. Upgrade when ready.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem", alignItems: "start" }}>
            {plans.map((plan, i) => (
              <motion.div key={i} variants={stagger(i * 0.1)} initial="hidden" whileInView="show" viewport={{ once: true }}
                style={{
                  background: plan.highlight ? "var(--grad-primary)" : "var(--surface)",
                  border: plan.highlight ? "none" : "1.5px solid var(--border)",
                  borderRadius: "var(--radius-xl)", padding: "2rem",
                  boxShadow: plan.highlight ? "var(--shadow-xl)" : "var(--shadow-card)",
                  transform: plan.highlight ? "scale(1.03)" : "scale(1)",
                  position: "relative", overflow: "hidden",
                }}>
                {plan.badge && (
                  <span style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: "0.72rem", fontWeight: 700, padding: "0.25rem 0.7rem", borderRadius: "var(--radius-full)" }}>
                    {plan.badge}
                  </span>
                )}
                {plan.save && (
                  <span style={{ display: "inline-block", background: "var(--blue-50)", color: "var(--primary)", fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.65rem", borderRadius: "var(--radius-full)", marginBottom: "0.75rem" }}>
                    {plan.save}
                  </span>
                )}
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem", color: plan.highlight ? "#fff" : "var(--text-primary)", marginBottom: "0.25rem" }}>{plan.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.3rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "2.4rem", color: plan.highlight ? "#fff" : "var(--primary)" }}>{plan.price}</span>
                </div>
                <div style={{ fontSize: "0.8rem", color: plan.highlight ? "rgba(255,255,255,0.7)" : "var(--text-muted)", marginBottom: "1.5rem" }}>{plan.period}</div>
                <div style={{ borderTop: plan.highlight ? "1px solid rgba(255,255,255,0.15)" : "1px solid var(--border)", paddingTop: "1.25rem", marginBottom: "1.5rem" }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.65rem", fontSize: "0.875rem", color: plan.highlight ? "rgba(255,255,255,0.9)" : "var(--text-secondary)" }}>
                      <FiCheckCircle size={15} color={plan.highlight ? "#86efac" : "var(--success)"} style={{ flexShrink: 0 }} />
                      {f}
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate("/register")}
                  style={{ width: "100%", padding: "0.8rem", borderRadius: "var(--radius-full)", border: plan.highlight ? "none" : "1.5px solid var(--border-medium)", background: plan.highlight ? "#fff" : "transparent", color: plan.highlight ? "var(--primary)" : "var(--text-primary)", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>
                  {plan.name === "Free" ? "Start for Free" : "Get Started"}
                </button>
              </motion.div>
            ))}
          </div>
        </Section>
      </div>

      {/* ════ FAQ ════════════════════════════════════════════════ */}
      <div id="faq" style={{ background: "var(--surface)", padding: "5rem 1.5rem", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <Section>
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <p style={{ color: "var(--primary)", fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.5rem" }}>FAQs</p>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(1.6rem,4vw,2.4rem)", color: "var(--text-primary)", lineHeight: 1.2 }}>
                Common questions
              </h2>
            </div>
            {faqs.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} />)}
          </Section>
        </div>
      </div>

      {/* ════ FINAL CTA ══════════════════════════════════════════ */}
      <div style={{ background: "var(--grad-header)", padding: "5rem 1.5rem", textAlign: "center" }}>
        <Section>
          <FiShield size={40} color="rgba(255,255,255,0.4)" style={{ marginBottom: "1.25rem" }} />
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(1.75rem,4.5vw,2.8rem)", color: "#fff", lineHeight: 1.2, marginBottom: "1rem" }}>
            Your NET qualification journey<br />starts today
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1.05rem", marginBottom: "2.5rem", maxWidth: 480, margin: "0 auto 2.5rem" }}>
            Join 4,800+ students already preparing smarter. Free forever for 5 mocks a month.
          </p>
          <button onClick={() => navigate("/register")}
            style={{ background: "#fff", border: "none", borderRadius: "var(--radius-full)", padding: "1rem 2.8rem", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem", color: "var(--primary)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            Create Free Account <FiArrowRight size={20} />
          </button>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", marginTop: "1rem" }}>
            No credit card required · 7-day money-back on Pro
          </p>
        </Section>
      </div>

      {/* ════ FOOTER ══════════════════════════════════════════════ */}
      <footer style={{ background: "var(--blue-950)", padding: "2.5rem 1.5rem" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--grad-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FiBookOpen size={14} color="#fff" />
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>OdiaExams</span>
          </div>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            {["Privacy Policy", "Terms of Service", "Contact"].map(link => (
              <a key={link} href="#" style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", textDecoration: "none" }}>{link}</a>
            ))}
          </div>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.78rem" }}>© 2025 OdiaExams. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
