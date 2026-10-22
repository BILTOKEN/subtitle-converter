// Tiny static server for local testing. Mimics Vercel's cleanUrls:
// /srt-to-txt serves dist/srt-to-txt.html.
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const port = Number(process.env.PORT) || 8080;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  const candidates = [join(dist, path), join(dist, `${path}.html`), join(dist, path, 'index.html')];
  const file = candidates.find((f) => f.startsWith(dist) && existsSync(f) && statSync(f).isFile());
  if (!file) {
    res.writeHead(404, { 'content-type': types['.html'] });
    res.end(readFileSync(join(dist, '404.html')));
    return;
  }
  res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(port, () => console.log(`http://localhost:${port}`));
