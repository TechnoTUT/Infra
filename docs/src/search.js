import MiniSearch from 'minisearch';
import { pages } from './content.js';

// 英数字は単語、CJK は 2-gram に分割する(形態素解析なしで日本語部分一致を実現)
const CJK = /[぀-ヿ㐀-鿿ｦ-ﾟ]+/g;
export function tokenize(text) {
  const t = text.toLowerCase();
  const out = [];
  for (const run of t.match(CJK) ?? []) {
    if (run.length === 1) out.push(run);
    for (let i = 0; i < run.length - 1; i++) out.push(run.slice(i, i + 2));
  }
  out.push(...t.replace(CJK, ' ').split(/[^\p{L}\p{N}_.-]+/u).filter(Boolean));
  return out;
}

const raws = import.meta.glob('../content/**/*.mdx', { query: '?raw', import: 'default' });

function plain(src) {
  return src
    .replace(/^---[\s\S]*?---/, '')
    .replace(/```[^\n]*\n/g, '\n')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<\/?[A-Za-z][^>]*>/g, '')
    .replace(/[#*>|`_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

let indexPromise;
export function loadIndex() {
  indexPromise ??= (async () => {
    const mini = new MiniSearch({
      fields: ['title', 'body'],
      storeFields: ['title', 'path', 'body'],
      tokenize,
      searchOptions: { boost: { title: 3 }, prefix: true, combineWith: 'AND' },
    });
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
