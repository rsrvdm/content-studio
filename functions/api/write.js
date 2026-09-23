import { json } from "./_middleware.js";

const FORMATS = {
  social: "a social media post. Scroll-stopping first line, short paragraphs, one clear call to action, and 3-5 relevant hashtags at the end.",
  gbp: "a Google Business Profile update (under 1,200 characters, no hashtags, ends with a clear call to action such as calling or requesting a quote).",
  casestudy: "a before-and-after project post showing a finished job: what the customer needed, what was done, and the result. End with a call to action.",
  webpage: "website page copy: a headline, a one-sentence subheading, 3-4 short sections with subheadings, and a closing call to action. Mark each part clearly.",
  service: "a service page optimised for local search: an H1 that includes the service and main suburb, an intro, what's included, why choose this business, the service area, 4 FAQs with answers, and a call to action. Then suggest an SEO title (max 60 characters) and meta description (max 155 characters).",
  meta: "three options each for an SEO page title (max 60 characters) and meta description (max 155 characters).",
  review: "a warm, genuine reply to a customer review. Thank them by name if given, mention the specific job if given, and keep it under 80 words. If the review is negative, stay calm, take it offline, and don't argue.",
  pitch: "a short, friendly outreach message to a local business owner offering help with their website or online presence. Mention one specific, observable problem from the notes, keep it under 120 words, no hard sell, end with a low-pressure question.",
  script: "a short-form video script (30-60 seconds). Open with a hook, then beats with on-screen text in [brackets], and end with a call to action.",
  blog: "a blog post with a strong title, a short intro, H2 subheadings, and a brief conclusion.",
  ad: "three variations of ad copy, each with a headline (max 40 characters) and primary text (max 125 characters).",
  email: "a marketing email with a subject line, preview text, and body.",
};

// Which formats are quick/low-stakes (cheap, fast model) vs longer/structured (better model).
// "auto" picks from this table; the person can still override with the Quality selector.
const FORMAT_TIER = {
  social: "fast", gbp: "fast", review: "fast", meta: "fast", pitch: "fast", ad: "fast",
  webpage: "premium", service: "premium", blog: "premium", casestudy: "premium", script: "premium", email: "premium",
};

function pickTier(format, quality) {
  if (quality === "fast" || quality === "best") return quality === "best" ? "premium" : "fast";
  return FORMAT_TIER[format] || "fast";
}

async function callClaude(env, prompt) {
  const model = env.CLAUDE_MODEL || "claude-sonnet-5";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error?.message || `Claude returned ${res.status}`;
    const hint = res.status === 400 && /credit balance|billing/i.test(msg)
      ? " Add credit at console.anthropic.com/settings/billing, or lower the spend cap if this is expected." : "";
    throw new Error(`Claude: ${msg}${hint}`);
  }
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
}

function brandBrief(b) {
  if (!b) return "";
  const lines = [
    `You are writing for: ${b.name}${b.website ? ` (${b.website})` : ""}.`,
    b.area && `Service area: ${b.area}.`,
    b.audience && `Audience: ${b.audience}.`,
    b.services && `What they offer: ${b.services}.`,
    b.voice && `Voice: ${b.voice}`,
    b.hashtags && `Preferred hashtags (use when hashtags fit the format): ${b.hashtags}`,
    b.notes && `Background: ${b.notes}`,
    b.avoid && `Never use these words or phrases: ${b.avoid}.`,
    "Only state facts given here or in the request. Don't invent prices, awards, years in business, customer names or reviews.",
  ];
  return lines.filter(Boolean).join("\n");
}

export async function onRequestPost({ request, env }) {
  const { format = "social", topic = "", tone = "", platform = "", notes = "", brand_id = null, quality = "auto" } = await request.json();
  if (!topic.trim()) return json({ error: "Add a topic first." }, 400);

  const brand = brand_id
    ? await env.DB.prepare("SELECT * FROM brands WHERE id = ?").bind(brand_id).first()
    : null;

  const prompt = [
    brandBrief(brand),
    "",
    `Write ${FORMATS[format] || FORMATS.social}`,
    `Topic: ${topic}`,
    tone && `Tone: ${tone}`,
    platform && `Platform: ${platform}`,
    notes && `Extra details: ${notes}`,
    "Use Australian English. Avoid generic AI-sounding phrasing. Return only the finished content, with no preamble.",
  ].filter((x) => x !== false && x !== undefined).join("\n");

  const tier = pickTier(format, quality);
  let text, engine;

  if (tier === "premium" && env.ANTHROPIC_API_KEY) {
    // Premium-tier writing (blogs, service pages, scripts...) gets the best model, on its
    // own capped budget - see ANTHROPIC_API_KEY / spend limit in the README.
    try {
      text = await callClaude(env, prompt);
      engine = "Claude (premium)";
    } catch (err) {
      return json({ error: err.message }, 502);
    }
  } else if (env.GEMINI_API_KEY) {
    const model = tier === "premium"
      ? (env.GEMINI_PREMIUM_MODEL || "gemini-2.5-pro")
      : (env.GEMINI_FAST_MODEL || env.GEMINI_MODEL || "gemini-2.5-flash");
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    const data = await res.json();
    if (!res.ok) return json({ error: `Gemini: ${data.error?.message || res.status}` }, 502);
    text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
    engine = tier === "premium" ? "Gemini (premium)" : "Gemini (fast)";
  } else {
    const out = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
    });
    text = out.response || "";
    engine = "Cloudflare AI (free)";
  }
  return json({ text: text.trim(), engine });
}
