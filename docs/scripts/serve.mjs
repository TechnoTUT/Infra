// build/ を Cloudflare Pages と同様の挙動(<path>/index.html, 404.html)で配信する簡易サーバ
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..', 'build');
const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const port = Number(opt('--port', 3000));
const host = opt('--host', '127.0.0.1');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.PNG': 'image/png', '.xml': 'application/xml', '.json': 'application/json' };

async function find(p) {
  for (const c of [p, join(p, 'index.html')]) {
    try { if ((await stat(c)).isFile()) return c; } catch {}
  }
}

createServer(async (req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const target = resolve(join(root, url));
  let file = target.startsWith(root) ? await find(target) : undefined;
  let status = 200;
  if (!file) { file = join(root, '404.html'); status = 404; }
  res.writeHead(status, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  res.end(await readFile(file));
}).listen(port, host, () => console.log(`Serving build/ at http://${host}:${port}`));
