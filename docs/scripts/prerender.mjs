// vite build (client) + vite build --ssr の後に実行し、全ルートを静的 HTML として書き出す
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { plain } from '../src/text.js';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'build');
const ssrDir = join(root, '.ssr');
const { render, routes, titleFor, pages } = await import(pathToFileURL(join(ssrDir, 'entry-server.js')).href);
const { site } = await import(pathToFileURL(join(root, 'src/site.config.js')).href);

const template = await readFile(join(out, 'index.html'), 'utf8');
const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const image = `${site.url}/img/og.jpg`;

function headFor(url) {
  const title = escape(titleFor(url));
  const pageUrl = `${site.url}${url === '/' ? '/' : url}`;
  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${escape(site.tagline)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escape(site.title)}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${escape(site.tagline)}" />`,
    `<meta property="og:url" content="${pageUrl}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ].join('\n    ');
}

async function emit(file, url) {
  const html = template
    .replace('<!--app-->', render(url))
    .replace('<!--head-->', headFor(url));
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

// MCP Worker (worker/index.js) が bundle する、全ページのテキスト。
// body は読み取り用の Markdown(frontmatter 除去)、text は検索インデックス用の平文。
const docs = await Promise.all(
  pages.map(async (p) => {
    const src = await readFile(join(root, p.editPath), 'utf8');
    return {
      path: p.path,
      title: p.title,
      section: p.section,
      url: `${site.url}${p.path}`,
      body: src.replace(/^---[\s\S]*?---\n*/, '').trim(),
      text: plain(src),
    };
  }),
);
await mkdir(join(root, 'worker'), { recursive: true });
await writeFile(join(root, 'worker/docs.json'), JSON.stringify(docs));

await rm(ssrDir, { recursive: true, force: true });
console.log(`Prerendered ${routes.length} pages + 404.html + sitemap.xml, ${docs.length} docs for MCP`);
