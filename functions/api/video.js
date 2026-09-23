import { json } from "./_middleware.js";

const MODELS = {
  fast: "veo-3.1-fast-preview",
  quality: "veo-3.1-generate-preview",
};

export async function onRequestPost({ request, env }) {
  if (!env.GEMINI_API_KEY) {
    return json({ error: "Video needs a Gemini API key. Add GEMINI_API_KEY in Cloudflare (Settings > Variables and Secrets), then redeploy." }, 400);
  }
  const { prompt = "", brand_id = null, useColours = false, image = null, model = "fast", aspectRatio = "16:9" } = await request.json();
  if (!prompt.trim()) return json({ error: "Describe the video first." }, 400);

  let full = prompt;
  if (brand_id && useColours) {
    const b = await env.DB.prepare("SELECT colours FROM brands WHERE id = ?").bind(brand_id).first();
    if (b?.colours) full += `. Colour palette: ${b.colours}`;
  }

  const instance = { prompt: full };
  if (image) {
    const m = /^data:([^;]+);base64,(.+)$/.exec(image);
    if (!m) return json({ error: "Starting image looks invalid." }, 400);
    instance.image = { inlineData: { mimeType: m[1], data: m[2] } };
  }

  const modelId = MODELS[model] || MODELS.fast;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:predictLongRunning`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      body: JSON.stringify({
        instances: [instance],
        parameters: { aspectRatio, durationSeconds: "8" },
      }),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error?.message || `Gemini returned ${res.status}`;
    const hint = res.status === 400 && /billing|not enabled|permission/i.test(msg)
      ? " Veo needs billing enabled on the Google account behind your API key — it isn't included in the Gemini free tier."
      : "";
    return json({ error: msg + hint }, 502);
  }
  if (!data.name) return json({ error: "Gemini didn't return a job to track. Try again." }, 502);
  return json({ operation: data.name });
}
