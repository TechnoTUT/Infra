# aichat

TechnoTUT のインフラについて、Gemini (無料枠の `gemini-4-hydrogen`) が日本語で答える Web チャットです。
クラスタは読み取り専用の ServiceAccount で読み、リポジトリは git-sync が取り込んだものを読みます。

- 使い方: [docs/content/service/aichat.mdx](../docs/content/service/aichat.mdx)
- 仕組みと運用: [docs/content/computing/aichat.mdx](../docs/content/computing/aichat.mdx)
- マニフェスト: [k8s/manifest/aichat/](../k8s/manifest/aichat/)

| ファイル | 内容 |
| --- | --- |
| `app/main.py` | API (ジョブの作成とポーリング) と Gemini とのやりとり |
| `app/tools.py` | Gemini に渡すツール (クラスタとリポジトリの読み取り) |
| `app/prompt.py` | システムプロンプト |
| `app/static/index.html` | チャットの画面 |

## 手元で動かす
```bash
uv sync
GEMINI_API_KEY=<キー> REPO_DIR=.. uv run uvicorn app.main:app --reload
```
