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
Cloudflare Pages でホストされており、push 時に自動でビルド・デプロイされます。
