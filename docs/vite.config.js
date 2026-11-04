import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import rehypeSlug from 'rehype-slug';

export default defineConfig({
  publicDir: 'static',
  build: { outDir: 'build', emptyOutDir: true },
  plugins: [
    {
      enforce: 'pre',
      ...mdx({
        rehypePlugins: [rehypeSlug],
        remarkPlugins: [remarkGfm, remarkFrontmatter, remarkMdxFrontmatter],
        providerImportSource: undefined,
      }),
    },
    react({ include: /\.(jsx|js|mdx)$/ }),
  ],
});
