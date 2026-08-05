const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

let initialized = false;
let timerId = null;

async function ping() {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('[KeepAlive] Supabase credentials not configured');
      return;
    }

    const url = `${supabaseUrl}/rest/v1/questions?select=id&limit=1`;
    const res = await fetch(url, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });
    if (!res.ok) {
      console.warn(`[KeepAlive] Database ping failed: ${res.status}`);
    }
  } catch (err) {
    console.warn('[KeepAlive] Database ping failed:', err.message);
  }
}

export const keepAliveService = {
  start() {
    if (initialized) return;
    initialized = true;
    ping();
    timerId = setInterval(ping, FIVE_DAYS_MS);
  },

  stop() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
    initialized = false;
  },
};
