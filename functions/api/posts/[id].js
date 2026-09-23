import { json } from "../_middleware.js";

export async function onRequestPatch({ request, params, env }) {
  const { status, caption, scheduled_at } = await request.json();
  const row = await env.DB.prepare(
    `UPDATE posts SET
       status = COALESCE(?, status),
       caption = COALESCE(?, caption),
       scheduled_at = COALESCE(?, scheduled_at)
     WHERE id = ? RETURNING *`
  ).bind(status ?? null, caption ?? null, scheduled_at ?? null, params.id).first();
  if (!row) return json({ error: "Post not found." }, 404);
  return json({ post: row });
}

export async function onRequestDelete({ params, env }) {
  await env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(params.id).run();
  return json({ ok: true });
}
