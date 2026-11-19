import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import rehypeSlug from 'rehype-slug';

// @mdx-js/rollup は id の ?query を取り除いて判定するため、検索インデックス用の ?raw 読み込み
// (src/search.js)まで MDX としてコンパイルしてしまう。?raw は生のテキストのまま通す。
const mdxPlugin = mdx({
  rehypePlugins: [rehypeSlug],
  remarkPlugins: [remarkGfm, remarkFrontmatter, remarkMdxFrontmatter],
  providerImportSource: undefined,
});
const mdxTransform = mdxPlugin.transform;

export default defineConfig({
  publicDir: 'static',
  build: { outDir: 'build', emptyOutDir: true },
  plugins: [
    {
      enforce: 'pre',
      ...mdxPlugin,
      transform(code, id, ...rest) {
        return id.includes('?raw') ? null : mdxTransform.call(this, code, id, ...rest);
      },
    },
    react({ include: /\.(jsx|js|mdx)$/ }),
  ],
});
