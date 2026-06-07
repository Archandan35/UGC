// src/hooks/useRole.js
import { useEffect, useState, useRef } from "react";
import {
  subscribeAuthState,
  subscribeUserByUid,
  createUser,
  markUserOnline,
  markUserOffline,
  getCurrentUid,
} from "../data-layer";

export function isAdminRole(role) {
  if (!role) return false;
  const r = String(role).toLowerCase().replace(/[\s_-]/g, "");
  return r === "admin" || r === "superadmin";
}

export function isSuperAdminRole(role) {
  if (!role) return false;
  const r = String(role).toLowerCase().replace(/[\s_-]/g, "");
  return r === "superadmin";
}

const HEARTBEAT_MS  = 20_000;
const OFFLINE_DELAY = 10_000;

export function useRole() {
  const [role,        setRole]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [userId,      setUserId]      = useState(null);
  const [permissions, setPermissions] = useState([]);

  const userIdRef    = useRef(null);
  const offlineTimer = useRef(null);

  useEffect(() => {
    let unsubSnap = null;

    const unsubAuth = subscribeAuthState(async (user) => {
      if (unsubSnap) { unsubSnap(); unsubSnap = null; }

      if (!user) {
        if (userIdRef.current) markUserOffline(userIdRef.current);
        setRole(null);
        setUserId(null);
        userIdRef.current = null;
        setPermissions([]);
        setLoading(false);
        return;
      }

      unsubSnap = subscribeUserByUid(user.id, async (userData) => {
        if (userData) {
          setRole(userData.role || "student");
          setUserId(userData.id);
          userIdRef.current = userData.id;
          setPermissions(userData.permissions || []);

          const { updateUser } = await import("../data-layer");
          updateUser(userData.id, {
            isOnline:  true,
            lastLogin: Date.now(),
            lastSeen:  Date.now(),
          }).catch(() => {});
        } else {
          try {
            const newId = await createUser({
              uid:         user.id,   // FIX: Supabase auth user uses .id not .uid
              email:       user.email || "",
              firstName:   user.displayName?.split(" ")[0] || "",
              lastName:    user.displayName?.split(" ").slice(1).join(" ") || "",
              name:        user.displayName || user.email || "",
              username:    "",
              role:        "student",
              status:      "active",
              isOnline:    true,
              lastLogin:   Date.now(),
              lastSeen:    Date.now(),
              permissions: [],
            });
            setRole("student");
            setUserId(newId);
            userIdRef.current = newId;
            setPermissions([]);
          } catch {
            setRole("student");
          }
        }
        setLoading(false);
      });
    });

    const handleUnload = () => {
      const id = userIdRef.current;
      if (id) markUserOffline(id);
    };
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide",     handleUnload);

    return () => {
      unsubAuth();
      if (unsubSnap) unsubSnap();
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide",     handleUnload);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    markUserOnline(userId);

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        markUserOnline(userId);
      }
    }, HEARTBEAT_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        if (offlineTimer.current) {
          clearTimeout(offlineTimer.current);
          offlineTimer.current = null;
        }
        markUserOnline(userId);
      } else {
        offlineTimer.current = setTimeout(() => {
          markUserOffline(userId);
          offlineTimer.current = null;
        }, OFFLINE_DELAY);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      if (offlineTimer.current) {
        clearTimeout(offlineTimer.current);
        offlineTimer.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisibility);
      markUserOffline(userId);
    };
  }, [userId]);

  return {
    role,
    loading,
    userId,
    permissions,
    isAdmin:      isAdminRole(role),
    isSuperAdmin: isSuperAdminRole(role),
  };
}
