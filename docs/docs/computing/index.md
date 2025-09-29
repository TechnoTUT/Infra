---
title: Computing
slug: /computing
sidebar_position: 1
---
[TechnoTUT Network](/) では、コンテナ型の仮想化手法を採用し、計算資源を提供しています。
仮想化技術を活用することで、ソフトウェアとハードウェアの間に抽象化レイヤーを設け効率的に利用できるようにしています。    

コンテナ型仮想化は、Linux カーネルの機能を利用してプロセスを隔離する方式です。Linux カーネルを共有することで、仮想マシンよりも軽量で高速に動作します。
TechnoTUT Network では、Kubernetes をコンテナオーケストレーションツールとして採用しています。Infrastructure as Code (IaC) による運用が可能であり、運用の効率化を実現します。

構築方法については、[GitHub](https://github.com/TechnoTUT/Infra/blob/main/k8s/k8s.md) を参照してください。

## Kubernetes とは
Kubernetesは、複数サーバで複数のコンテナを管理するためのツールです。  
  
TechnoTUTでは、以下のリポジトリでKubernetesの管理を行っています。  
[![TechnoTUT/Infra - GitHub](https://gh-card.dev/repos/TechnoTUT/Infra.svg?fullname=)](https://github.com/TechnoTUT/Infra)

## クラスタ構成
Kubernetesのクラスタは、3台の物理サーバ(pjsekai, maimai, chunithm)で構成されています。各ノードには、Debian 13 trixieがインストールされ、Kubeadmでクラスタが構築されています。
Kubernetesのバージョンは、1.34です。

| Node | CPU | Memory | IP Address | Role |
|------|-----|--------|------------|------|
| pjsekai | 4CPU | 8GB | 192.168.30.200/24 | Control-Plane |
| maimai | 2CPU | 12GB | 192.168.30.201/24 | Worker |
| chunithm | 2CPU | 12GB | 192.168.30.202/24 | Worker |

Control-Planeノードは、Kubernetesの管理を担当し、APIサーバ、スケジューラー、コントローラマネージャなどのコンポーネントが動作しています。  
Workerノードは、実際にコンテナが動作するノードであり、Podがスケジュールされます。

### ArgoCD
ArgoCDを使用すれば、GitHubリポジトリに配置されたマニフェストを自動で適用することができます。  
GitHubリポジトリのマニフェストに更新があれば、自動で適用されます。  
  
使用するには、ArgoCDのWebUIにアクセスし、GitHub上のマニフェストを同期します。  
https://cd.svc.technotut.net/
