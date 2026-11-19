# TechnoTUT Infra

TechnoTUT Network（部室および学内 DJ イベント The Utopia Tone で使う IP ネットワーク）と、その上で動く Kubernetes 基盤の構成・ドキュメントを管理するリポジトリです。

ドキュメント: https://network.technotut.net

## Mission
1. **安定したネットワークの提供**  
   TechnoTUT Network は、The Utopia Tone を運営する上での重要なインフラです。ネットワークサービスの停止は、DJ・VJ・照明・PA・映像配信に大きな影響を与えます。障害時にもサービスを継続し、演出への影響を最小限に抑えられる堅牢で安定したネットワークを目指します。
2. **演出支援・自動制御**  
   PRO DJ LINK や Ableton Link によって、DJ・VJ・照明システムの拍・テンポを同期します。異なる役割のシステムを連携させることで演出の一体感を高め、より没入感のある音楽体験を提供します。また、OSC（Open Sound Control）を活用して照明や映像を自動制御し、リアルタイムのパフォーマンスを支援します。
3. **会場内映像配信システムの提供**  
   NDI（Network Device Interface）や RTMP による高品質な映像の伝送環境を提供します。IP ネットワークで映像を送ることで撮影機材の映像ケーブルを減らし、ケーブル長に縛られない自由な機材配置と安価な配信システムを実現します。
4. **分散処理による高負荷処理の実行・高信頼性の確保**  
   複数の計算機に処理を分散し、1 台では不可能な大規模な映像処理などを可能にします。また、複数の計算機で同じ処理を動かすことで、1 台が故障してもサービスを継続できるシステムを構築します。

## 構成

### 通信基盤
DJ 機器の PRO DJ LINK、映像伝送の NDI・RTMP、テンポ同期の Ableton Link、照明制御の Art-Net、デジタルミキサーの制御通信などを、VLAN で 1 つの物理ネットワークに統合しています。スパニングツリーやリンクアグリゲーションによる L2 冗長化で、機器故障やケーブル断線の影響を最小限に抑えます。一部の機器は PoE による給電に対応しています。

詳細: [ネットワーク](https://network.technotut.net/network)

### 計算基盤
3 台のノード（becky, packard, marie）で Kubernetes クラスタ（`main`）を運用しています。NAS の ongeki は 1 台だけのクラスタ（`nas`）で Samba をコンテナで動かし、`main` と Cilium Cluster Mesh で接続します。クラスタの構築は Ansible、アプリケーションのデプロイは Argo CD による GitOps で行います。

| 項目 | 内容 |
| --- | --- |
| OS | Debian 13, AlmaLinux 10 |
| Kubernetes | kubeadm, containerd |
| CNI | Cilium, Multus |
| ストレージ | NFS, local PV |
| GitOps | Argo CD |

詳細: [構築方法](./docs/content/computing/deploy.mdx)

## ディレクトリ構成

| パス | 内容 |
| --- | --- |
| [`docs/`](./docs/) | ドキュメントサイト（React + Vite + MDX） |
| [`k8s/ansible/`](./k8s/ansible/) | Kubernetes クラスタを構築する Ansible。Podman による疑似クラスタ [`k8s/ansible/test/`](./k8s/ansible/test/) |
| [`k8s/manifest/`](./k8s/manifest/) | Argo CD がデプロイするマニフェスト。ディレクトリごとに 1 つの Application |
| [`network/`](./network/) | スイッチの設定（`config/`）、トポロジ図・配線図 |
| [`media/`](./media/) | 図などの素材 |
| `.devcontainer/` | ドキュメント編集用の Dev Container |
| `.github/` | CI |

### `k8s/manifest/` のアプリケーション

Argo CD に登録するアプリケーションは [`k8s/manifest/apps/`](./k8s/manifest/apps/) に Application の YAML として置いています (App of Apps)。`main` にマージすると、Argo CD が親の Application (`root`) から自動で登録します。

## よくある作業

| やりたいこと | 参照先 |
| --- | --- |
| ドキュメントを書く・プレビューする | [`docs/README.md`](./docs/README.md) |
| クラスタを構築・再構築する | [`k8s/ansible/README.md`](./k8s/ansible/README.md) |
| 実機に触れずに Ansible を試す | [`k8s/ansible/test/README.md`](./k8s/ansible/test/README.md) |
| AI にクラスタやネットワークの状態、使い方を聞く (承認ボタンで一部の操作も可) | http://ai.svc.technotut.net ([使い方](./docs/content/service/aichat.mdx)、[実装](./docs/content/computing/aichat.mdx)) |
| 監視と Discord への通知の仕組みを知る・直す | [`docs/content/computing/monitoring.mdx`](./docs/content/computing/monitoring.mdx) |
| アプリケーションを追加する | `k8s/manifest/<name>/` にマニフェストを置き、`k8s/manifest/apps/<name>.yaml` に Application を追加 |

push すると、ドキュメントは GitHub Actions で自動的にビルドされ、Cloudflare Pages にデプロイされます。
