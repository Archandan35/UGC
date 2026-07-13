/**
 * useRealtime — wraps data-layer subscription functions.
 * Instead of accepting a raw DB queryRef, it accepts a
 * subscribe function from data-layer that takes a callback.
 *
 * Usage:
 *   const { data, loading } = useRealtime(subscribeSubjects);
 */
import { useEffect, useState } from "react";

export function useRealtime(subscribeFn, deps = []) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!subscribeFn) return undefined;
    setLoading(true);
    let unsub;
    try {
      unsub = subscribeFn((items) => {
        setData(items);
        setLoading(false);
      });
    } catch (err) {
      setError(err);
      setLoading(false);
    }
    return () => { if (unsub) unsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}

export default useRealtime;
