import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { subscribeAuthState, subscribeUserByUid } from "../data-layer";
import { isAdminRole } from "../hooks/useRole";

export default function AdminRoute({ children }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let unsubSnap = null;

    const unsubAuth = subscribeAuthState((user) => {
      if (!user) {
        setStatus("denied");
        return;
      }

      if (unsubSnap) { unsubSnap(); unsubSnap = null; }

      // FIX: Supabase auth user object uses .id, not .uid (Firebase convention).
      unsubSnap = subscribeUserByUid(user.id, (userData) => {
        if (userData) {
          const role = userData.role || "student";
          setStatus(isAdminRole(role) ? "allowed" : "denied");
        } else {
          setStatus("denied");
        }
      });
    });

    return () => {
      unsubAuth();
      if (unsubSnap) unsubSnap();
    };
  }, []);

  if (status === "loading") return null;
  if (status === "denied")  return <Navigate to="/dashboard" replace />;
  return children;
}
