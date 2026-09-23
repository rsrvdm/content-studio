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
