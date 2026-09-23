# Studio — content desk for MidCoast Web Co, clients and projects

Write posts/scripts/blogs, generate images, and plan your posting calendar.
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

## Brands
Pick who you're working on in the sidebar ("Working on"). Writing, images and the planner all follow it.
Edit or add clients under the Brands tab. MidCoast Web Co, Dan Amato Landscapes, On-The-Go Auto Repairs
and Cape Hawke Game Fishing Club are preloaded.
