import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { logout } from "../data-layer";
import { useAuth } from "../context/AuthContext";

const NAV_CATEGORIES = [
  {
    label: "Practice",
    icon: "📝",
    items: [
      { label: "All Exams",      path: "/exams",       icon: "📚", desc: "Browse & start mock tests" },
      { label: "Mixed Exam",     path: "/mixed-exam",  icon: "🔀", desc: "Cross-topic random quiz" },
      { label: "Revision Mode",  path: "/revision",    icon: "🔁", desc: "Retry wrong & skipped Qs" },
    ],
  },
  {
    label: "Progress",
    icon: "📊",
    items: [
      { label: "Dashboard",    path: "/dashboard",   icon: "🏠", desc: "Your overview & stats" },
      { label: "Analytics",    path: "/analytics",   icon: "📈", desc: "Performance deep-dive" },
      { label: "Leaderboard",  path: "/leaderboard", icon: "🏆", desc: "Top performers ranking" },
    ],
  },
  {
    label: "Learn",
    icon: "🎓",
    items: [
      { label: "Study Plans",  path: "/study-plans", icon: "📅", desc: "Structured learning paths" },
      { label: "Forum",        path: "/forum",        icon: "💬", desc: "Discuss with peers" },
    ],
  },
];

export default function TopNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(null); // which category is open
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (navRef.current && !navRef.current.contains(e.target)) setOpen(null);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on route change
  useEffect(() => { setOpen(null); setMobileOpen(false); }, [location.pathname]);

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  const initials = user?.email?.charAt(0)?.toUpperCase() || "?";
  const emailShort = user?.email?.split("@")[0] || "";

  return (
    <>
      <nav className="tnav" ref={navRef}>
        {/* Brand */}
        <button className="tnav-brand" onClick={() => navigate("/dashboard")}>
          <span className="tnav-brand-icon">🎓</span>
          <span className="tnav-brand-text">Sravya Technologies</span>
        </button>

        {/* Desktop categories */}
        <div className="tnav-cats">
          {NAV_CATEGORIES.map((cat) => {
            const isOpen = open === cat.label;
            const active = cat.items.some(i => i.path === location.pathname);
            return (
              <div key={cat.label} className="tnav-cat">
                <button
                  className={`tnav-cat-btn ${active ? "tnav-cat-active" : ""} ${isOpen ? "tnav-cat-open" : ""}`}
                  onClick={() => setOpen(isOpen ? null : cat.label)}
                  onMouseEnter={() => setOpen(cat.label)}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <svg className={`tnav-chevron ${isOpen ? "tnav-chevron-up" : ""}`} width="12" height="12" viewBox="0 0 12 12">
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                  </svg>
                </button>

                {isOpen && (
                  <div className="tnav-dropdown" onMouseLeave={() => setOpen(null)}>
                    <div className="tnav-dropdown-inner">
                      {cat.items.map((item) => {
                        const isCurrent = location.pathname === item.path;
                        return (
                          <button
                            key={item.path}
                            className={`tnav-item ${isCurrent ? "tnav-item-current" : ""}`}
                            onClick={() => navigate(item.path)}
                          >
                            <span className="tnav-item-icon">{item.icon}</span>
                            <span className="tnav-item-body">
                              <span className="tnav-item-label">{item.label}</span>
                              <span className="tnav-item-desc">{item.desc}</span>
                            </span>
                            {isCurrent && <span className="tnav-item-dot" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: avatar + logout */}
        <div className="tnav-right">
          <button className="tnav-avatar" onClick={() => navigate("/profile")} title={user?.email}>
            {initials}
          </button>
          <span className="tnav-username">{emailShort}</span>
          <button className="tnav-logout" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>

          {/* Mobile hamburger */}
          <button className="tnav-hamburger" onClick={() => setMobileOpen(v => !v)}>
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="tnav-mobile">
          {NAV_CATEGORIES.map(cat => (
            <div key={cat.label} className="tnav-mobile-cat">
              <div className="tnav-mobile-cat-label">{cat.icon} {cat.label}</div>
              {cat.items.map(item => (
                <button
                  key={item.path}
                  className={`tnav-mobile-item ${location.pathname === item.path ? "tnav-mobile-item-active" : ""}`}
                  onClick={() => navigate(item.path)}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </div>
          ))}
          <button className="tnav-mobile-logout" onClick={handleLogout}>← Logout</button>
        </div>
      )}
    </>
  );
}
