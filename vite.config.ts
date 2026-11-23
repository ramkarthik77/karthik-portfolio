import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import { profile } from './src/data/profile.ts'

const esc = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Builds search and social metadata from src/data/profile.ts so it never drifts
 * from the site: canonical + Open Graph/Twitter tags, Person structured data,
 * a no-JavaScript fallback, robots.txt and sitemap.xml.
 */
function seo(): Plugin {
  const url = profile.siteUrl.replace(/\/$/, '')
  const title = `${profile.name} — ${profile.role}`
  const description = `${profile.name} — ${profile.role} with ${profile.stats[0].value} years building enterprise content platforms at Adobe, T-Mobile, T. Rowe Price and AbbVie.`
  const image = `${url}/og-image.jpg`
  const current = profile.career[0]
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    alternateName: profile.fullName,
    jobTitle: profile.role,
    url,
    image,
    worksFor: { '@type': 'Organization', name: current.company },
    address: { '@type': 'PostalAddress', addressCountry: 'US' },
    sameAs: [profile.linkedin, profile.github].filter(Boolean),
    knowsAbout: profile.stack,
  }
  const head = [
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${url}/" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(profile.name)}" />`,
    `<meta property="og:url" content="${url}/" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(profile.tagline)}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(`${profile.name}, ${profile.role} — the personal motor park portfolio`)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(profile.tagline)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<script type="application/ld+json">${JSON.stringify(person).replace(/</g, '\\u003c')}</script>`,
  ].join('\n    ')
  const noscript = `<noscript>
      <main style="max-width:720px;margin:40px auto;padding:0 20px;font:16px/1.6 system-ui,sans-serif">
        <h1>${esc(profile.name)} — ${esc(profile.role)}</h1>
        <p>${esc(profile.tagline)}</p>
        ${profile.about.map((p) => `<p>${esc(p)}</p>`).join('\n        ')}
        <h2>Career</h2>
        <ul>${profile.career.map((job) => `<li><strong>${esc(job.company)}</strong> — ${esc(job.role)} (${esc(job.period)})</li>`).join('')}</ul>
        <h2>Selected work</h2>
        <ul>${profile.work.map((w) => `<li><strong>${esc(w.title)}</strong> (${esc(w.org)}): ${esc(w.body)}</li>`).join('')}</ul>
        <h2>Building with AI</h2>
        <ul>${profile.products.map((p) => `<li><strong>${esc(p.title)}</strong> — ${esc(p.body)}</li>`).join('')}</ul>
        <p>Contact: <a href="mailto:${esc(profile.email)}">${esc(profile.email)}</a> · <a href="${esc(profile.linkedin)}">LinkedIn</a></p>
      </main>
    </noscript>`
  return {
    name: 'portfolio-seo',
    transformIndexHtml(html) {
      return html
        .replace(/<title>.*<\/title>/, `<title>${esc(title)}</title>`)
        .replace('<!-- seo -->', head)
        .replace('<!-- noscript -->', noscript)
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${url}/sitemap.xml\n`,
      })
      const today = new Date().toISOString().slice(0, 10)
      const pages = ['/', '/profile']
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
          .map((path) => `  <url><loc>${url}${path}</loc><lastmod>${today}</lastmod></url>`)
          .join('\n')}\n</urlset>\n`,
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), seo()],
  server: { allowedHosts: ['terminal.local'] },
})
