import { useEffect, useState } from "react";
import { getCurrentUid, getGamification } from "../data-layer";

export default function useGamification() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      const uid = getCurrentUid();
      if (!uid) { setLoading(false); return; }
      const g = await getGamification(uid);
      if (alive) { setData(g); setLoading(false); }
    }
    load();
    return () => { alive = false; };
  }, []);

  return { gamification: data, loading };
}
