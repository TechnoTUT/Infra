# TechnoTUT Network Docs

React + [Vite](https://vite.dev/) + [MDX](https://mdxjs.com/) による独自実装の静的ドキュメントサイトです。
ビルド時に全ページを静的 HTML としてプリレンダリングし、ブラウザ側で hydrate します。

## 構成

| パス | 内容 |
| --- | --- |
| `content/` | ドキュメント本文 (`.mdx`)。フォルダ名がセクション、frontmatter の `sidebar_position` が並び順 |
| `src/site.config.js` | サイト名・ナビ(セクション)・フッター・編集リンクの設定 |
| `src/content.js` | `content/` からページ一覧/ルーティング/サイドバーを生成 |
| `src/components/` | Layout, 検索, MDX 用コンポーネント(コードブロック, Mermaid, Admonition) |
| `scripts/prerender.mjs` | 全ルートの静的 HTML, `404.html`, `sitemap.xml` を `build/` に出力 |
| `worker/index.js` | `/mcp` の MCP サーバ(Worker)。`worker/docs.json` はビルド時に生成 |
| `static/` | 画像などの静的ファイル |

### ドキュメントの書き方

```mdx
---
title: ページタイトル
sidebar_position: 1
slug: /custom-path   # 省略時は content/ 配下のパス
---

本文。 ```mermaid のコードブロックは図として描画されます。

<Admonition type="info">注意書き</Admonition>
```

## 開発

```
$ cd docs
$ npm install
$ npm run dev      # 開発サーバ
$ npm run build    # build/ にプリレンダリング済みサイトを出力
$ npm run serve    # build/ をローカル配信 (-- --port 3000)
```

## Deployment
Cloudflare Workers(Static Assets)でホストされており、push 時に自動でビルド・デプロイされます。

## MCP
`https://network.technotut.net/mcp` で、このドキュメントを MCP サーバ(Streamable HTTP・認証なし・読み取り専用)として公開しています。

| ツール | 内容 |
| --- | --- |
| `list_docs` | 全ページの path とタイトル |
| `search_docs` | 全文検索(日英対応) |
| `read_doc` | ページ本文を Markdown で取得 |

```
$ claude mcp add --transport http technotut-docs https://network.technotut.net/mcp
```

`/mcp` だけ Worker が処理し、それ以外のパスは従来どおり静的アセットとして配信されます。ローカルでは `npm run build && npx wrangler dev` で確認できます。
