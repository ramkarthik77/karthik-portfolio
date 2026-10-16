# Karthik Guduri — 3D Portfolio

React + TypeScript + Three.js (react-three-fiber) + GSAP, built with Vite and deployed on Cloudflare Pages.

## Run locally
Requires Node.js 20.19+ or 22.12+.
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # outputs to dist/
```

## Edit content
Everything on the page comes from **`src/data/profile.ts`** — bio, stats, career, projects, stack, links.

- **GitHub link:** set `github`
- **Résumé:** put `resume.pdf` in `public/` and set `resumeUrl: '/resume.pdf'`
- **3D avatar:** put a `.glb` (under ~5 MB) at `public/models/avatar.glb` and set `avatarUrl: '/models/avatar.glb'`. Leave it `null` to keep the abstract "platform core" (a core with 100+ orbiting site nodes).

Styling is in `src/index.css` (colors are the variables at the top). The 3D scene is `src/components/Scene.tsx`.

## Deploy to Cloudflare Pages

### Automatic (GitHub Actions) — every push to `main` deploys
One-time setup:
1. Cloudflare Dashboard → My Profile → API Tokens → Create Token → **Custom token** with permission *Account → Cloudflare Pages → Edit*. Copy the token.
2. Copy your **Account ID** (Dashboard → Workers & Pages, right sidebar).
3. GitHub repo → Settings → Secrets and variables → Actions → add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
4. Actions tab → *Deploy to Cloudflare Pages* → Run workflow (or just push).

The workflow (`.github/workflows/deploy.yml`) builds, creates the `karthik-portfolio` Pages project on first run, and deploys. Your site goes live at `https://karthik-portfolio.pages.dev`.

### Manual (from your computer)
```bash
npx wrangler login     # first time only
npm run deploy
```

Add a custom domain under the Pages project's Custom domains tab.

`public/_headers` sets long-lived caching for the hashed build assets.
