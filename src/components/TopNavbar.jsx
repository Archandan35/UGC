import { useNavigate } from "react-router-dom";
import { logout, getCurrentUser } from "../data-layer";

export default function TopNavbar() {
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  const user = getCurrentUser();

  return (
    <div className="top-navbar">
      <div className="nav-left">
        <h2>Sravya Technologies</h2>
      </div>
      <div className="nav-right">
        <div className="avatar">
          {user?.email?.charAt(0)?.toUpperCase()}
        </div>
        <button className="delete-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
