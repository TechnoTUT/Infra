// vite build (client) + vite build --ssr の後に実行し、全ルートを静的 HTML として書き出す
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'build');
const ssrDir = join(root, '.ssr');
const { render, routes, titleFor } = await import(pathToFileURL(join(ssrDir, 'entry-server.js')).href);
const { site } = await import(pathToFileURL(join(root, 'src/site.config.js')).href);

const template = await readFile(join(out, 'index.html'), 'utf8');
const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

async function emit(file, url) {
  const html = template
    .replace('<!--app-->', render(url))
    .replace('<!--head-->', `<title>${escape(titleFor(url))}</title>`);
  const dest = join(out, file);
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, html);
}

for (const url of routes) await emit(url === '/' ? 'index.html' : `${url.slice(1)}/index.html`, url);
await emit('404.html', '/__not_found__');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes
  .map((u) => `  <url><loc>${site.url}${u === '/' ? '/' : u}</loc></url>`)
  .join('\n')}\n</urlset>\n`;
await writeFile(join(out, 'sitemap.xml'), sitemap);

await rm(ssrDir, { recursive: true, force: true });
console.log(`Prerendered ${routes.length} pages + 404.html + sitemap.xml`);
