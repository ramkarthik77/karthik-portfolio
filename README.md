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

### Automatic (recommended)
Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git → `karthik-portfolio`.
Framework preset **Vite**, build command `npm run build`, output directory `dist`. Every push to `main` then deploys. Node 22 is pinned via `.node-version`.

### GitHub Actions (optional, manual trigger)
Add repo secrets `CLOUDFLARE_API_TOKEN` (custom token with *Cloudflare Pages → Edit*) and `CLOUDFLARE_ACCOUNT_ID`, then Actions tab → *Deploy to Cloudflare Pages* → Run workflow.

### Manual (from your computer)
```bash
npx wrangler login     # first time only
npm run deploy
```

Add a custom domain under the Pages project's Custom domains tab.

`public/_headers` sets long-lived caching for the hashed build assets.
