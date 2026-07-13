import { Link, useLocation } from "react-router-dom";

const ITEMS = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/exams", label: "Exams" },
  { path: "/revision", label: "Revision" },
  { path: "/study-plans", label: "Study Plans" },
  { path: "/forum", label: "Forum" },
  { path: "/leaderboard", label: "Leaderboard" },
  { path: "/analytics", label: "Analytics" },
  { path: "/profile", label: "Profile" },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="sidebar">
      <div className="logo">OdiaExams</div>
      <div className="menu">
        {ITEMS.map((i) => (
          <Link key={i.path} to={i.path}
            className={pathname === i.path ? "active-link" : ""}>
            {i.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
