// Builds the static site into dist/. No dependencies.
// SITE_URL decides canonical links and the sitemap. On Vercel it falls back to
// the production domain automatically, so adding a custom domain later just
// needs a redeploy.
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { home, notFound, tools } from '../src/pages.mjs';
import { renderPage } from '../src/template.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const dist = join(root, 'dist');

const siteUrl = (
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
  'http://localhost:8080'
).replace(/\/+$/, '');

const verification = {
  google: process.env.GOOGLE_SITE_VERIFICATION || '',
  bing: process.env.BING_SITE_VERIFICATION || '',
};

const hash = (s) => createHash('sha256').update(s).digest('hex').slice(0, 10);

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'assets'), { recursive: true });

// Assets with cache-busting query strings.
const converterJs = readFileSync(join(src, 'converter.js'), 'utf8');
const converterV = hash(converterJs);
const appJs = readFileSync(join(src, 'app.js'), 'utf8').replace(
  "from './converter.js'",
  `from './converter.js?v=${converterV}'`,
);
const css = readFileSync(join(src, 'styles.css'), 'utf8');
writeFileSync(join(dist, 'assets', 'converter.js'), converterJs);
writeFileSync(join(dist, 'assets', 'app.js'), appJs);
writeFileSync(join(dist, 'assets', 'styles.css'), css);
const assets = { js: `/assets/app.js?v=${hash(appJs)}`, css: `/assets/styles.css?v=${hash(css)}` };

const ctx = { siteUrl, assets, verification };
writeFileSync(join(dist, 'index.html'), renderPage(home, ctx));
for (const page of tools) writeFileSync(join(dist, `${page.slug}.html`), renderPage(page, ctx));
writeFileSync(join(dist, '404.html'), renderPage(notFound, ctx));

// Static files (favicon, search-engine verification files, ...).
const staticDir = join(root, 'static');
if (existsSync(staticDir)) {
  for (const name of readdirSync(staticDir)) cpSync(join(staticDir, name), join(dist, name), { recursive: true });
}

const today = new Date().toISOString().slice(0, 10);
const urls = [home, ...tools].map((p) => `${siteUrl}/${p.slug}`.replace(/\/$/, p.slug ? '' : '/'));
writeFileSync(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`,
);
writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);

console.log(`Built ${tools.length + 2} pages for ${siteUrl}`);
