// MFM Research Hub — Supabase client config
// PUBLIC values only — safe to commit to a public repo.
// Do NOT add the service_role key here.

window.__SUPABASE_CONFIG__ = {
  url: 'https://lwzhaqxhzwbbvsvonkrb.supabase.co',
  anonKey: 'sb_publishable_o4fW4YzBNfB6tJRN17fTqg_c49J98-1',
  // AI features call this automatically. By default it points at the
  // ai-proxy Edge Function under the Supabase URL above — just deploy
  // supabase/functions/ai-proxy and it works. Override only if your AI
  // proxy lives elsewhere:
  // aiProxyUrl: 'https://your-host/ai-proxy',
};
