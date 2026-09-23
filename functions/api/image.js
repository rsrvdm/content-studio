import { json } from "./_middleware.js";

export async function onRequestPost({ request, env }) {
  const { prompt = "", style = "", brand_id = null, useColours = false } = await request.json();
  if (!prompt.trim()) return json({ error: "Describe the image first." }, 400);

  let full = prompt;
  if (style) full += `. Style: ${style}`;
  if (brand_id && useColours) {
    const b = await env.DB.prepare("SELECT colours FROM brands WHERE id = ?").bind(brand_id).first();
    if (b?.colours) full += `. Colour palette: ${b.colours}`;
  }
  full += ". No text, no logos, no watermarks.";

  const out = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", { prompt: full, steps: 8 });
  if (!out?.image) return json({ error: "The image model returned nothing. Try rewording the prompt." }, 502);
  return json({ image: `data:image/jpeg;base64,${out.image}` });
}
