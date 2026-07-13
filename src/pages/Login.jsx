import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginEmail, resetPassword, getUsersByPhone, getUserByUid } from "../data-layer";

export default function Login() {
  const nav = useNavigate();
  const [identifier,   setIdentifier]   = useState("");
  const [password,     setPassword]     = useState("");
  const [showPwd,      setShowPwd]      = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [forgotMode,   setForgotMode]   = useState(false);
  const [resetEmail,   setResetEmail]   = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError,   setResetError]   = useState("");
  const [error,        setError]        = useState("");

  function isPhone(val) {
    return /^\d{7,15}$/.test(val.replace(/[\s\-().+]/g, ""));
  }

  async function login() {
    setError("");
    if (!identifier.trim()) { setError("Please enter your email or phone number."); return; }
    if (!password)           { setError("Please enter your password."); return; }
    setLoading(true);

    try {
      let emailToUse = identifier.trim().toLowerCase();

      if (isPhone(identifier)) {
        // ── Phone login flow ───────────────────────────────────────────
        // getUsersByPhone runs BEFORE auth, so it needs a Supabase RLS
        // policy: "Allow public phone lookup for login"
        //   FOR SELECT USING (true)  ← on the phone column only, or use
        //   a Postgres function with SECURITY DEFINER (see SQL below).
        //
        // SQL to run in Supabase SQL Editor:
        // ──────────────────────────────────────────────────────────────
        // CREATE POLICY "Public phone lookup for login"
        //   ON public.users
        //   FOR SELECT
        //   USING (true);
        // ──────────────────────────────────────────────────────────────
        // If you prefer tighter security, use a SECURITY DEFINER fn:
        // ──────────────────────────────────────────────────────────────
        // CREATE OR REPLACE FUNCTION public.get_email_by_phone(phone_variants text[])
        // RETURNS text
        // LANGUAGE sql SECURITY DEFINER AS $$
        //   SELECT email FROM public.users
        //   WHERE phone = ANY(phone_variants)
        //   LIMIT 1;
        // $$;
        // ──────────────────────────────────────────────────────────────
        const digits = identifier.replace(/\D/g, "");
        const variants = [
          `+91${digits.slice(-10)}`,
          digits.slice(-10),
          `+91${digits}`,
        ];
        const users = await getUsersByPhone(variants);

        if (!users.length) {
          setError("No account found with this phone number.");
          setLoading(false);
          return;
        }
        emailToUse = users[0]?.email;
        if (!emailToUse) {
          setError("Account found but email is missing. Please contact support.");
          setLoading(false);
          return;
        }
      }

      // ── Auth sign-in ──────────────────────────────────────────────
      const res = await loginEmail(emailToUse, password);

      const userId = res?.data?.user?.id;
      if (!userId) throw new Error("Unable to get user ID. Please try again.");

      // ── Role-based redirect ───────────────────────────────────────
      const userData = await getUserByUid(userId);
      const role = userData?.role || "student";

      if (role === "admin" || role === "super-admin" || role === "superadmin") {
        nav("/admin");
      } else {
        nav("/dashboard");
      }

    } catch (e) {
      const msg = e?.message || "";
      // Supabase error messages for bad credentials
      if (
        msg.toLowerCase().includes("invalid login") ||
        msg.toLowerCase().includes("invalid credentials") ||
        msg.toLowerCase().includes("email not confirmed")
      ) {
        setError("Incorrect email/phone or password. Please try again.");
      } else if (msg.toLowerCase().includes("too many")) {
        setError("Too many attempts. Please wait a moment and try again.");
      } else {
        setError(msg || "Sign in failed. Please try again.");
      }
    }
    setLoading(false);
  }

  async function handleForgotPassword() {
    setResetError("");
    if (!resetEmail.trim()) { setResetError("Please enter your registered email address."); return; }
    setResetLoading(true);
    try {
      await resetPassword(resetEmail.trim().toLowerCase());
      setResetSuccess(true);
    } catch (e) {
      const code = e.code || "";
      if (code === "auth/user-not-found") setResetError("No account found with this email address.");
      else if (code === "auth/invalid-email") setResetError("Please enter a valid email address.");
      else setResetError(e.message || "Failed to send reset email. Please try again.");
    }
    setResetLoading(false);
  }

  if (forgotMode) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-heading">
            <div className="auth-badge"><span>🔑</span> Reset Password</div>
            <h1>Forgot Your<br />Password?</h1>
            <p className="auth-tagline">We'll send you a reset link</p>
          </div>
          {!resetSuccess ? (
            <>
              {resetError && <p className="auth-error">{resetError}</p>}
              <div className="auth-field">
                <label>Registered Email Address</label>
                <input type="email" placeholder="you@example.com" value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)} />
              </div>
              <button className="auth-btn" onClick={handleForgotPassword} disabled={resetLoading}>
                {resetLoading ? "Sending…" : "Send Reset Link →"}
              </button>
            </>
          ) : (
            <div className="auth-success-box">
              <span className="auth-success-icon">✅</span>
              <p>Password reset email sent to <strong>{resetEmail}</strong>.</p>
              <p className="auth-success-sub">Check your inbox and follow the instructions.</p>
            </div>
          )}
          <div className="auth-footer">
            <button className="auth-back-link"
              onClick={() => { setForgotMode(false); setResetSuccess(false); setResetError(""); setResetEmail(""); }}>
              ← Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-heading">
          <div className="auth-badge"><span>🎓</span> Sravya Technologies</div>
          <h1>Welcome Back<br />Champion! 🎉</h1>
          <p className="auth-tagline">Crack UGC NET – Odia with Confidence</p>
          <p className="auth-subtitle">Learn • Practice • Succeed</p>
        </div>

        {error && <p className="auth-error">{error}</p>}

        <div className="auth-field">
          <label>Email or Phone Number</label>
          <input type="text" placeholder="you@example.com or 9876543210" value={identifier}
            onChange={(e) => { setIdentifier(e.target.value); setError(""); }} />
        </div>

        <div className="auth-field">
          <label>Password</label>
          <div className="auth-pwd-field">
            <input type={showPwd ? "text" : "password"} placeholder="Enter your password" value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }} />
            <button type="button" className="auth-pwd-toggle" onClick={() => setShowPwd((v) => !v)} tabIndex={-1}>
              {showPwd ? "🙈" : "👁"}
            </button>
          </div>
          <div className="auth-forgot-row">
            <button type="button" className="auth-forgot-link" onClick={() => setForgotMode(true)}>
              Forgot Password?
            </button>
          </div>
        </div>

        <button className="auth-btn" onClick={login} disabled={loading}>
          {loading ? "Signing in…" : "Sign In →"}
        </button>

        <div className="auth-footer">Don't have an account? <Link to="/register">Create Account</Link></div>

        <div className="auth-divider" />
        <div className="auth-quote">
          <p>"Your future is created by what you do today, not tomorrow. Practice with purpose, learn from mistakes, and believe in your ability to succeed."</p>
          <strong>Keep going — you are capable of more than you imagine.</strong>
        </div>
        <div className="auth-dedication">
          <p>Built with passion. Dedicated with endless love to my <span className="heart">💕</span> beloved wife <strong>Srabani</strong>, whose support inspires me for this milestone.</p>
        </div>
      </div>
    </div>
  );
}
