# Studio — content desk for MidCoast Web Co, clients and projects

Write posts/scripts/blogs, generate images and video, and plan your posting calendar.
Runs on Cloudflare Pages (free). Database "content-studio" (D1) is already created.

## Deploy (about 10 minutes)
1. Create a new GitHub repo called `content-studio` and upload everything in this folder.
2. Cloudflare dashboard > Workers & Pages > Create > Pages > Connect to Git > pick the repo.
   Build command: (leave empty). Output directory: `public`. Deploy.
3. Settings > Variables and Secrets > add:
   - `STUDIO_PASSWORD` (Secret) — any password you like
   - `GEMINI_API_KEY` (Secret, optional) — free key from https://aistudio.google.com/apikey
4. Deployments > Retry deployment (so the secrets take effect).
5. Open your `*.pages.dev` link, enter the password.

Bindings (AI + D1) come from wrangler.toml automatically.
Without a Gemini key, writing uses Cloudflare's built-in model (free daily allowance).
Images always use Cloudflare's FLUX model (free daily allowance).

## Video
Video uses Google Veo through the Gemini API and needs `GEMINI_API_KEY` set. Unlike text and images,
**Veo is not on the Gemini free tier** — the Google Cloud project behind your API key needs billing
enabled, and each clip costs a small amount (Veo is priced per second of video). Check
https://ai.google.dev/gemini-api/docs/pricing before generating a lot of clips. Each video takes
roughly 1-3 minutes to render; the "Fast" quality option is cheaper and quicker than "Higher quality".

## Model routing
The Write tab doesn't always use the same model. Quick, low-stakes formats (a social caption,
a review reply, SEO meta tags) run on `GEMINI_FAST_MODEL` — free. Longer or more structured
formats (a blog post, a local service page, a video script) run on real Claude
(`ANTHROPIC_API_KEY` + `CLAUDE_MODEL`) when that key is set, so the writing that actually
matters gets the better model. A "Quality" dropdown on the Write tab lets you force fast or
best on any single request instead of leaving it on auto.

**Setting up the Claude tier (optional, costs real money — separate from your claude.ai
subscription):**
1. Get a key at https://console.anthropic.com/settings/keys (this is pay-as-you-go API
   billing, a different account/product from your Claude.ai chat subscription — one doesn't
   substitute for the other).
2. Before you use it, cap it: console.anthropic.com > Settings > Billing > Limits > set a
   monthly spend limit (e.g. $30). Once that's spent, Claude calls just fail with a clear
   error instead of ever going over — Studio falls back to Gemini automatically if the key
   is missing entirely, but not mid-month if you hit the cap, so set it before you rely on it.
3. Add `ANTHROPIC_API_KEY` as a Secret in Cloudflare (Settings > Variables and Secrets), then
   Deployments > Retry deployment.

Leave `ANTHROPIC_API_KEY` unset to keep everything on Gemini's free tier — nothing else
changes, premium formats just fall back to `GEMINI_PREMIUM_MODEL` instead.

Separately: if you're hitting usage limits while chatting with Claude directly (not inside
Studio), that's your claude.ai/Cowork subscription's own session and weekly caps — check
Settings > Usage in the Claude app, and a higher-tier plan (Max) raises that ceiling. This
`ANTHROPIC_API_KEY` here has no effect on that at all; it only powers Studio's own Write tab.

## Brands
Pick who you're working on in the sidebar ("Working on"). Writing, images and the planner all follow it.
Edit or add clients under the Brands tab. MidCoast Web Co, Dan Amato Landscapes, On-The-Go Auto Repairs
and Cape Hawke Game Fishing Club are preloaded.

## Agent access
Every `/api/*` request needs the value in `STUDIO_PASSWORD`, sent as an `x-studio-key` header — that's
what protects your AI quota from being used by anyone who finds the link. If you also set `AGENT_KEY`
(Secret, any random string — never reuse your real password here), that value is accepted too, on
every endpoint. This lets an assistant like Claude call `/api/write`, `/api/image`, `/api/video`,
`/api/posts` etc. directly, without you ever handing over your actual login password. Only set this
if you actually want an agent calling the API on your behalf; leave it unset otherwise.
