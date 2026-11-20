import MiniSearch from 'minisearch';
import { pages } from './content.js';
import { plain, searchOptions } from './text.js';

const raws = import.meta.glob('../content/**/*.mdx', { query: '?raw', import: 'default' });

let indexPromise;
export function loadIndex() {
  indexPromise ??= (async () => {
    const mini = new MiniSearch({ ...searchOptions, storeFields: ['title', 'path', 'body'] });
    const docs = await Promise.all(
      pages.map(async (p) => {
        const load = raws[p.file];
        return { id: p.path, path: p.path, title: p.title, body: load ? plain(await load()) : '' };
      }),
    );
    mini.addAll(docs);
    return mini;
  })();
  return indexPromise;
}

export function snippet(body, query) {
  const q = query.trim().toLowerCase();
  const i = body.toLowerCase().indexOf(q.split(/\s+/)[0]);
  if (i < 0) return body.slice(0, 80);
  const start = Math.max(0, i - 20);
  return (start ? '…' : '') + body.slice(start, start + 90);
}
