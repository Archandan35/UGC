import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  registerEmail,
  createUser,
  getUserByEmail,
  getUserByUid,
  getUsersByPhone,
} from "../data-layer";

/** Normalise any Indian phone input → "+91XXXXXXXXXX" */
function normalisePhone(raw) {
  const digits = raw.replace(/\D/g, "");
  const ten = digits.slice(-10);
  return `+91${ten}`;
}

export default function Register() {
  const nav = useNavigate();

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");   // dedicated email field
  const [phone,    setPhone]    = useState("");   // dedicated phone field (optional)
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [role,     setRole]     = useState("student");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function register() {
    setError("");

    // ── Validation ──────────────────────────────────────────
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    const emailVal = email.trim().toLowerCase();
    if (!emailVal) {
      setError("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    const phoneVal = phone.trim() ? normalisePhone(phone.trim()) : "";

    // ── Duplicate checks ────────────────────────────────────
    setLoading(true);
    try {
      // Email duplicate check
      const existingByEmail = await getUserByEmail(emailVal);
      if (existingByEmail) {
        setError("An account with this email already exists. Please sign in.");
        setLoading(false);
        return;
      }

      // Phone duplicate check (if provided)
      if (phoneVal) {
        const digits = phoneVal.replace(/\D/g, "");
        const existingByPhone = await getUsersByPhone([
          `+91${digits.slice(-10)}`,
          digits.slice(-10),
        ]);
        if (existingByPhone?.length) {
          setError("An account with this phone number already exists. Please sign in.");
          setLoading(false);
          return;
        }
      }

      // ── Supabase Auth signUp ────────────────────────────
      const res = await registerEmail(emailVal, password);
      console.log("Signup response:", res);

      const userId = res?.data?.user?.id;
      if (!userId) {
        throw new Error("Failed to create auth account. Please try again.");
      }

      // ── Insert profile row FIRST (session still active) ─
      // CRITICAL: Must run BEFORE any logout() so the RLS policy
      // auth.uid() = uid::uuid passes. Never logout before createUser.
      await createUser({
        uid:       userId,
        name:      name.trim(),
        email:     emailVal,
        phone:     phoneVal || null,
        role,
        createdAt: new Date().toISOString(),
      });

      // ── Fetch the saved profile to confirm role ─────────
      // This mirrors exactly how Login.jsx does role-based redirect.
      const userData = await getUserByUid(userId);
      const savedRole = userData?.role || role;

      // ── Role-based redirect (auto-login, no logout) ─────
      if (
        savedRole === "admin" ||
        savedRole === "super-admin" ||
        savedRole === "superadmin"
      ) {
        nav("/admin");
      } else {
        nav("/dashboard");   // DashboardRouter will render StudentDashboard
      }

    } catch (e) {
      console.error("Registration error:", e);
      const msg = e?.message || "";
      if (
        msg.toLowerCase().includes("already registered") ||
        msg.toLowerCase().includes("already exists") ||
        msg.toLowerCase().includes("duplicate")
      ) {
        setError("An account with this email already exists. Please sign in.");
      } else {
        setError(msg || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-heading">
          <div className="auth-badge"><span>🎓</span> Sravya Technologies</div>
          <h1>Create Account</h1>
          <p className="auth-tagline">Join and start your UGC NET journey</p>
        </div>

        {error && <p className="auth-error">{error}</p>}

        {/* Full Name */}
        <div className="auth-field">
          <label>Full Name</label>
          <input
            type="text"
            placeholder="Your full name"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
          />
        </div>

        {/* Email — dedicated, email only */}
        <div className="auth-field">
          <label>Email Address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
          />
        </div>

        {/* Phone — dedicated, phone only, optional */}
        <div className="auth-field">
          <label>
            Phone Number{" "}
            <span className="label-optional">(optional)</span>
          </label>
          <input
            type="tel"
            placeholder="9876543210"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setError(""); }}
          />
        </div>

        {/* Password */}
        <div className="auth-field">
          <label>Password</label>
          <div className="auth-pwd-field">
            <input
              type={showPwd ? "text" : "password"}
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
            />
            <button
              type="button"
              className="auth-pwd-toggle"
              onClick={() => setShowPwd((v) => !v)}
              tabIndex={-1}
            >
              {showPwd ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        {/* Role */}
        <div className="auth-field">
          <label>I am a</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button className="auth-btn" onClick={register} disabled={loading}>
          {loading ? "Creating account…" : "Create Account →"}
        </button>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
