// MFM Research Hub — AI proxy (Supabase Edge Function)
// Keeps the Anthropic API key on the server so it never ships to the browser.
//
// ── Deploy ────────────────────────────────────────────────────────────────
//   1. Install the Supabase CLI:  https://supabase.com/docs/guides/cli
//   2. Set your Anthropic key as a secret (get one at console.anthropic.com):
//        supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//   3. Deploy this function:
//        supabase functions deploy ai-proxy --no-verify-jwt
//   That's it — the app calls it automatically once it's live.
//
//   (Optional) pick a model:
//        supabase secrets set ANTHROPIC_MODEL=claude-3-5-haiku-20241022
// ───────────────────────────────────────────────────────────────────────────

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = Deno.env.get("ANTHROPIC_MODEL") || "claude-3-5-haiku-20241022";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set on the server.");

    const { prompt, max_tokens } = await req.json();
    if (!prompt || typeof prompt !== "string") throw new Error("Missing 'prompt'.");

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: Math.min(Math.max(Number(max_tokens) || 1024, 64), 4096),
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await r.json();
    if (!r.ok) throw new Error(data?.error?.message || ("Anthropic error " + r.status));

    const completion = (data.content || [])
      .map((b: { text?: string }) => b.text || "")
      .join("")
      .trim();

    return new Response(JSON.stringify({ completion }), {
      headers: { ...cors, "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message || e) }), {
      status: 400,
      headers: { ...cors, "content-type": "application/json" },
    });
  }
});
