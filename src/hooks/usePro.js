/**
 * usePro.js — live Pro-subscription status for the current user.
 */
import { useEffect, useState } from "react";
import { subscribeAuthState, subscribeSubscription } from "../data-layer";

export function usePro() {
  const [isPro,      setIsPro]      = useState(false);
  const [plan,       setPlan]       = useState(null);
  const [expiresAt,  setExpiresAt]  = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    let unsubSnap = null;

    const unsubAuth = subscribeAuthState((user) => {
      if (unsubSnap) { unsubSnap(); unsubSnap = null; }
      if (!user) {
        setIsPro(false);
        setPlan(null);
        setLoading(false);
        return;
      }

      // FIX: Supabase auth user uses .id, not .uid (Firebase convention)
      unsubSnap = subscribeSubscription(user.id, (d) => {
        const active = !!d?.isPro && (!d.expiresAt || d.expiresAt > Date.now());
        setIsPro(active);
        setPlan(d?.plan || null);
        setExpiresAt(d?.expiresAt || null);
        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      if (unsubSnap) unsubSnap();
    };
  }, []);

  return { isPro, plan, expiresAt, loading };
}
