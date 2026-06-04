/* MFM Research Hub — AI client
   One entry point for all AI calls so the app behaves correctly everywhere:

   1. Inside the Claude preview/harness  → uses window.claude.complete (as before).
   2. On your deployed site              → calls a Supabase Edge Function
                                            (functions/v1/ai-proxy) that holds the
                                            Anthropic key server-side. Deploy the
                                            function in supabase/functions/ai-proxy
                                            and AI features light up automatically.
   3. Nothing configured                 → throws a friendly, non-scary error the
                                            UI can show instead of crashing.
*/
(function () {
  const proxyUrl = () => {
    const cfg = window.__SUPABASE_CONFIG__ || {};
    if (cfg.aiProxyUrl) return cfg.aiProxyUrl;                 // explicit override
    if (cfg.url) return cfg.url.replace(/\/+$/, '') + '/functions/v1/ai-proxy';
    return null;
  };

  window.AIClient = {
    // True when an AI backend of some kind is reachable.
    isAvailable() {
      return (window.claude && typeof window.claude.complete === 'function') || !!proxyUrl();
    },

    async complete(prompt, opts = {}) {
      // 1) Native Claude harness (preview)
      if (window.claude && typeof window.claude.complete === 'function') {
        return await window.claude.complete(prompt);
      }

      // 2) Supabase Edge Function proxy (production)
      const url = proxyUrl();
      if (url) {
        const cfg = window.__SUPABASE_CONFIG__ || {};
        const token = (window.AuthService && window.AuthService.getSession && window.AuthService.getSession()?.access_token) || cfg.anonKey;
        let res;
        try {
          res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(cfg.anonKey ? { apikey: cfg.anonKey } : {}),
              ...(token ? { Authorization: 'Bearer ' + token } : {}),
            },
            body: JSON.stringify({ prompt, max_tokens: opts.maxTokens || 1024 }),
          });
        } catch (netErr) {
          throw new Error('Could not reach the AI service. Check your connection and that the ai-proxy function is deployed.');
        }
        if (res.status === 404) {
          const e = new Error('The AI service isn’t deployed yet. Add the ai-proxy Edge Function in Supabase to enable AI features.');
          e.code = 'AI_NOT_DEPLOYED';
          throw e;
        }
        if (!res.ok) {
          let detail = '';
          try { detail = (await res.json())?.error || ''; } catch (_) {}
          throw new Error(detail || ('AI service error (' + res.status + ').'));
        }
        const data = await res.json();
        return (data.completion || data.text || data.content || '').toString();
      }

      // 3) Nothing configured
      const e = new Error('AI features aren’t enabled on this deployment yet.');
      e.code = 'AI_NOT_CONFIGURED';
      throw e;
    },
  };
})();
