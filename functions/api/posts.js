import { json } from "./_middleware.js";

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT posts.*, brands.name AS brand_name FROM posts
     LEFT JOIN brands ON brands.id = posts.brand_id
     ORDER BY scheduled_at ASC`
  ).all();
  return json({ posts: results });
}

export async function onRequestPost({ request, env }) {
  const { platform, caption, image = null, video = null, scheduled_at, brand_id = null } = await request.json();
  if (!platform || !caption?.trim() || !scheduled_at) {
    return json({ error: "A post needs a platform, a caption and a date." }, 400);
  }
  const row = await env.DB.prepare(
    "INSERT INTO posts (platform, caption, image, video, scheduled_at, brand_id) VALUES (?, ?, ?, ?, ?, ?) RETURNING *"
  ).bind(platform, caption, image, video, scheduled_at, brand_id).first();
  return json({ post: row }, 201);
}
