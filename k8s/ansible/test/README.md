# Podman による疑似クラスタのテスト

実機に触れずに `site.yml` を検証するための環境。becky / packard / FRR の 3 つの特権コンテナ (systemd) を作り、Ansible を `podman exec` 経由で流す。

## 前提
- **rootful の podman (`sudo`)**。kubeadm と Cilium が特権・cgroup・BPF を必要とするため。
- ホストのカーネルで `overlay` が使えること。カーネルモジュールの読み込みや `net.*` の sysctl がホストに影響する。
- メモリの空きが 4GB 程度。ノードコンテナは 1 つあたり最大 2.5GB。
- `ansible-core` と `containers.podman` コレクション:
  ```bash
  ansible-galaxy collection install -r requirements.yml
  ```
- **kubeconfig はコンテナ内のものだけを使う。** ホストの `kubectl` / `helm` は使わない。

## 使い方
```bash
./up.sh              # コンテナ・ネットワーク・FRR を作る
./run.sh stage1      # ノード準備 → kubeadm init / join
./run.sh stage2      # Cilium・BGP・Multus・NFS provisioner・ArgoCD
./run.sh stage3      # ExternalDNS (FortiGate の webhook)
./down.sh            # 全て削除（コンテナ・ネットワーク・ボリューム・イメージ）
```
同じ stage を 2 回流すと、冪等性（`changed=0`）を確認できる。

コンテナ内の kubectl は次のように使う。
```bash
sudo podman exec becky kubectl get pods -A
sudo podman exec frr vtysh -c 'show bgp summary'
sudo podman exec frr vtysh -c 'show ip bgp'
```

## CI
`k8s/ansible/` を変更する PR と `main` への push では、GitHub Actions ([`.github/workflows/ansible-test.yaml`](../../../.github/workflows/ansible-test.yaml)) が同じ手順を ubuntu のランナーで実行する。`up.sh` → stage1〜3 → ノード・Cilium・Argo CD・BGP の確認 → stage1 の再実行で冪等性 (`changed=0`) の確認、の順。Actions の画面から手動でも実行できる (workflow_dispatch)。

CI 固有の対処:
- Vault のパスワードは CI にないため、`vault.yml` を空のファイルに差し替える。テストに要る値は `vars.yml` にある。
- ランナーの Docker が `FORWARD` を DROP にするので、ポリシーを ACCEPT にし、ブリッジの通信を iptables に通さない (ノード間の Pod の通信のため)。

## 構成
| 名前 | IP | 役割 |
|---|---|---|
| becky | 172.31.99.200 | コントロールプレーン |
| packard | 172.31.99.201 | ワーカー |
| frr | 172.31.99.129 | FortiGate の代わり (iBGP, AS 64646, route-reflector) |

Pod CIDR は 10.15.0.0/16、Service CIDR (ClusterIP) は 10.96.0.0/12、LB の IP プールは 10.12.0.0/16 で、本番と同じ。

## 検証できること
`kubeadm init` / `join`、Pod / Service の CIDR、Cilium (kube-proxy 置き換え、Ingress、LB IP プール)、BGP (FRR での経路確認)、ArgoCD、ExternalDNS のチャートと webhook のサイドカーが入ること。

## 検証できないこと
実機の VLAN とブリッジ、FortiGate へのレコードの書き込み (FortiGate がないため、webhook は Ready にならない)、Multus の L2 通信、NFS provisioner の実動作 (NFS サーバがない)、network ロール、marie (packard と同じ設定)、Haswell でのメモリの余裕。

## テスト用の上書き (`vars.yml`)
コンテナ固有の事情に対処するために、次の変数を上書きしている。本番の値は変えない。

| 変数 | 理由 |
|---|---|
| `common_disable_swap`, `kubelet_fail_swap_on` | ホストの swap を止めないため |
| `common_kernel_modules`, `common_sysctls` | RHEL 系のホストカーネルには `br_netfilter` がないため |
| `kubeadm_ignore_preflight_errors` | 上記に伴う preflight の無視 |
| `argocd_network_policy` | 入れ子のコンテナでは NetworkPolicy 下の probe が通らないため |
| `node_dns_servers` | テストを動かす PC から TUT の DNS サーバに届かないため、公開 DNS を使う |
| `argocd_root_include` | メモリ節約のため、root から作る Application は `cam1` と `dmx` だけにする |
| `externaldns_helm_wait` | FortiGate がなく webhook が Ready にならないため、helm の完了を待たない |

`up.sh` は、Cilium が `/sys/fs/bpf` を使えるように bpffs を shared でマウントする。また、kubeadm の preflight がカーネルの設定を読めるように、ホストの `/lib/modules` と `/boot` を読み取り専用でマウントする (Ubuntu では設定が `/boot/config-*` にある)。

## 注意
- コンテナの DNS の search ドメインに podman のネットワーク由来の `dns.podman` が入る。CoreDNS の上流 (podman の DNS) が Pod から応答しないため、相対名の名前解決は遅くなる。
