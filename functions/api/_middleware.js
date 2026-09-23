// Every /api/* request must carry your password (or the separate agent key), so nobody else can use your AI quota.
export async function onRequest({ request, env, next }) {
  if (!env.STUDIO_PASSWORD) {
    return json({ error: "Set STUDIO_PASSWORD in Cloudflare (Settings > Variables and Secrets), then redeploy." }, 500);
  }
  const key = request.headers.get("x-studio-key");
  const ok = key === env.STUDIO_PASSWORD || (env.AGENT_KEY && key === env.AGENT_KEY);
  if (!ok) {
    return json({ error: "Wrong password." }, 401);
  }
  try {
    return await next();
  } catch (err) {
    return json({ error: err.message || "Something went wrong." }, 500);
  }
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
