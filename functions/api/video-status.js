import { json } from "./_middleware.js";

function bufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function onRequestPost({ request, env }) {
  if (!env.GEMINI_API_KEY) return json({ error: "Missing GEMINI_API_KEY." }, 400);
  const { operation = "" } = await request.json();
  if (!operation) return json({ error: "Missing operation." }, 400);

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${operation}`, {
    headers: { "x-goog-api-key": env.GEMINI_API_KEY },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return json({ error: data.error?.message || `Gemini returned ${res.status}` }, 502);

  if (!data.done) return json({ done: false });
  if (data.error) return json({ done: true, error: data.error.message || "Video generation failed." });

  const sample = data.response?.generateVideoResponse?.generatedSamples?.[0];
  const uri = sample?.video?.uri;
  if (!uri) return json({ done: true, error: "Gemini finished but returned no video." });

  const vidRes = await fetch(uri, { headers: { "x-goog-api-key": env.GEMINI_API_KEY } });
  if (!vidRes.ok) return json({ done: true, error: `Couldn't download the finished video (${vidRes.status}).` });
  const buf = await vidRes.arrayBuffer();
  const mimeType = vidRes.headers.get("content-type") || "video/mp4";
  return json({ done: true, video: `data:${mimeType};base64,${bufferToBase64(buf)}` });
}
