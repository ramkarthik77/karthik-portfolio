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

- **AI products:** edit `products` — they appear in the Innovation lab and the Quick profile
- **Site address:** set `siteUrl` if you move to a custom domain; canonical links, social previews, `robots.txt` and `sitemap.xml` are generated from it at build time
- **Social preview image:** `public/og-image.jpg` (1200×630)

The Quick profile is served at `/profile`, so it can be linked directly.

## Graphics quality
The Motor Park (`src/components/Circuit.tsx`) renders in three tiers:

| Tier | Who gets it | What's on |
|---|---|---|
| high | desktops | up to 2× pixel density (4K on 4K displays), 4096 soft shadows, ambient occlusion, bloom, depth of field on the welcome shot, colour grade, vignette |
| medium | phones / touch devices | up to 1.5× density, 2048 shadows, bloom, grade, vignette |
| low | Performance mode, or devices that can't hold frame rate | no post-processing, no shadows |

Tiers step down automatically if the frame rate drops. Add `?quality=high`, `?quality=medium` or `?quality=low` to the URL to pin one. Post-processing lives in `src/world/Effects.tsx` and loads as a separate chunk; per-mood lighting and sky colours are in `src/world/looks.ts`.

Styling is in `src/index.css` (Quick profile) and `src/motorsport.css` (Motor Park).

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
