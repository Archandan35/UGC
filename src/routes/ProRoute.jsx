import { Navigate } from "react-router-dom";
import { usePro } from "../hooks/usePro";

/** Gate Pro-only content; sends free users to /pricing. */
export default function ProRoute({ children }) {
  const { isPro, loading } = usePro();
  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner" />
      </div>
    );
  }
  return isPro ? children : <Navigate to="/pricing" replace />;
}
