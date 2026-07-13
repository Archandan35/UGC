import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const isActive = (p) => pathname === p;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">OdiaExams</Link>
      <div className="navbar-links">
        <Link to="/exams" className={isActive("/exams") ? "active-link" : ""}>Exams</Link>
        <Link to="/revision" className={isActive("/revision") ? "active-link" : ""}>Revision</Link>
        <Link to="/study-plans" className={isActive("/study-plans") ? "active-link" : ""}>Plans</Link>
        <Link to="/forum" className={isActive("/forum") ? "active-link" : ""}>Forum</Link>
        <Link to="/leaderboard" className={isActive("/leaderboard") ? "active-link" : ""}>Leaderboard</Link>
        <Link to="/pricing" className={isActive("/pricing") ? "active-link" : ""}>Pricing</Link>
        {user
          ? <Link to="/dashboard" className="btn-primary btn-sm">Dashboard</Link>
          : <Link to="/login" className="btn-primary btn-sm">Login</Link>}
      </div>
    </nav>
  );
}
