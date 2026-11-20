// 検索まわりの純粋な文字列処理。ブラウザ(src/search.js)・ビルド(scripts/prerender.mjs)・
// MCP Worker(worker/index.js)で共有するため、Vite 固有の API には依存させない。

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

export function plain(src) {
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

export const searchOptions = {
  fields: ['title', 'body'],
  storeFields: ['title', 'path'],
  tokenize,
  searchOptions: { boost: { title: 3 }, prefix: true, combineWith: 'AND' },
};
