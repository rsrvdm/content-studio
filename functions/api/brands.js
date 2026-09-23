import { json } from "./_middleware.js";
export const FIELDS = ["name","kind","website","area","audience","services","voice","avoid","colours","hashtags","notes"];

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    "SELECT * FROM brands ORDER BY CASE kind WHEN 'business' THEN 0 WHEN 'client' THEN 1 ELSE 2 END, name"
  ).all();
  return json({ brands: results });
}

export async function onRequestPost({ request, env }) {
  const b = await request.json();
  if (!b.name?.trim()) return json({ error: "Give the brand a name." }, 400);
  const row = await env.DB.prepare(
    `INSERT INTO brands (${FIELDS.join(",")}) VALUES (${FIELDS.map(() => "?").join(",")}) RETURNING *`
  ).bind(...FIELDS.map((f) => b[f] ?? (f === "kind" ? "client" : ""))).first();
  return json({ brand: row }, 201);
}
