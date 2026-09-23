// Every /api/* request must carry your password, so nobody else can use your AI quota.
export async function onRequest({ request, env, next }) {
  if (!env.STUDIO_PASSWORD) {
    return json({ error: "Set STUDIO_PASSWORD in Cloudflare (Settings > Variables and Secrets), then redeploy." }, 500);
  }
  if (request.headers.get("x-studio-key") !== env.STUDIO_PASSWORD) {
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
