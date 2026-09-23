import { json } from "../_middleware.js";
import { FIELDS } from "../brands.js";

export async function onRequestPatch({ request, params, env }) {
  const b = await request.json();
  const row = await env.DB.prepare(
    `UPDATE brands SET ${FIELDS.map((f) => `${f} = ?`).join(", ")} WHERE id = ? RETURNING *`
  ).bind(...FIELDS.map((f) => b[f] ?? ""), params.id).first();
  if (!row) return json({ error: "Brand not found." }, 404);
  return json({ brand: row });
}

export async function onRequestDelete({ params, env }) {
  await env.DB.prepare("UPDATE posts SET brand_id = NULL WHERE brand_id = ?").bind(params.id).run();
  await env.DB.prepare("DELETE FROM brands WHERE id = ?").bind(params.id).run();
  return json({ ok: true });
}
