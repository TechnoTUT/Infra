---
title: 公式ホームページ
sidebar_position: 2
---
https://technotut.net/ は、TechnoTUTの公式ホームページです。音楽技術部の活動を全世界に発信することを目的としています。  

## 編集方法
編集方法については、GitHubリポジトリの[README](https://github.com/technotut/technotut.net)を参照してください。

## 技術スタック
[technotut.net](https://technotut.net/)は、Next.js v14を使用して構築されています。Next.jsでは、ビルド時に静的ファイルを生成しつつ、画像の最適化を行うことで、高速なページ表示を実現しています。ホストには Cloudflare Pages を採用し、Cloudflare Rocket Loader や Cloudflare Zaraz などの機能を利用して、ページの表示速度を向上させています。

## Markdown記法による記述
Markdown記法は、DiscordやNotionなど、多くのアプリケーションで採用されている記法です。Markdown記法を使用することで、簡単に見出しやリンクを挿入することができます。また、Markdown記法は、HTMLタグを使用することなく、文章の装飾を行うことができます。Markdown記法を採用することで、記事の作成が容易になり、誰でも編集できます。

## Gitを使用したバージョン管理
ホームページは、[GitHubリポジトリ](https://github.com/technotut/technotut.net)で管理されています。Gitを使用することで、複数の人が同時に編集することが可能になります。また、IssueやPull Requestを活用することで、コードの品質を維持しながら、効率的に開発を進めることができます。

## GitHub ActionsによるCI/CDパイプライン
GitHub Actionsを使用することで、ホームページのビルドやデプロイを自動化しています。GitHub Actionsは、Push時にビルドを実行し、Cloudflare Pagesにデプロイすることで、ホームページの更新が自動的に行われます。以下に、GitHub Actionsのワークフローを示します。

```yaml
name: Publish to Cloudflare Pages

on: [push, workflow_dispatch]

jobs:
  publish:
    runs-on: ubuntu-latest
    if: github.repository == 'TechnoTUT/technotut.net'
    permissions:
      contents: read
      deployments: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
      - uses: actions/cache@v3
        id: node_modules_cache_id
        env:
          cache-name: cache-node-modules
        with:
          path: '**/node_modules'
          key: ${{ runner.os }}-build-${{ env.cache-name }}-${{ hashFiles('**/package-lock.json') }}
      - run: echo '${{ toJSON(steps.node_modules_cache_id.outputs) }}'
      - if: ${{ steps.node_modules_cache_id.outputs.cache-hit != 'true' }}
        run: npm install
      - name: export
        run: npm run export
      - name: Publish to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy out --project-name technotut
```
GitHub ActionsによるCloudflare Pagesへのデプロイについては、https://github.com/cloudflare/wrangler-action を参照してください。