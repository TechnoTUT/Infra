# Ansible によるクラスタ構築

管理用のマシンから SSH で実行する。ノードには Ansible を入れない。ノードは最小かつ同一の構成に保つ。

クラスタは 2 つあり、inventory を分けている。2 つのクラスタは Cilium Cluster Mesh でつなぐ。

| クラスタ | inventory | ノード | OS |
|---|---|---|---|
| `main` | `inventory/hosts.yml` (既定) | becky, packard, marie | Debian 13 |
| `nas` | `inventory/nas.yml` | ongeki | AlmaLinux 10 |

ロールは Debian と RHEL 系の両方に対応している (OS ごとの違いは `<ロール>/tasks/<debian|redhat>.yml`)。\
`nas` の変数は `inventory/group_vars/all` (共通) を `inventory/group_vars/nas_cluster.yml` で上書きする。

## 準備（管理用マシン）
```bash
pip install ansible-core            # もしくは OS のパッケージ
ansible-galaxy collection install -r requirements.yml
# Vault のパスワード（Git に入れない）
install -m 600 /dev/null ~/.vault_pass && $EDITOR ~/.vault_pass
export ANSIBLE_VAULT_PASSWORD_FILE=~/.vault_pass
ansible-vault create inventory/group_vars/all/vault.yml   # 例は vault.yml.example
```
ノードには `technotut` ユーザーで鍵認証の SSH ができ、sudo がパスワードなしで使えること。

## 実行
```bash
ansible-playbook playbooks/site.yml          # 構築、設定変更の反映（何度流してもよい）
ansible-playbook -i inventory/nas.yml playbooks/site.yml   # nas のクラスタ (ongeki)
ansible-playbook playbooks/reset.yml         # 全消去（RESET と入力）
```

## 構成
| ロール | 対象 | 内容 |
|---|---|---|
| network | main の全ノード | VLAN 10・20 とブリッジ br10・br20（DHCP）。管理用 VLAN は手動 |
| common | 全ノード | 不要パッケージの削除（Debian）、DNS の固定、swap 無効化、カーネルモジュール、sysctl、NFS クライアント。RHEL 系は NetworkManager の設定と firewalld の停止も |
| containerd | 全ノード | Docker の apt / dnf リポジトリから containerd.io（更新は手動） |
| nas | ongeki | `/nas` の確認、ホストの Samba の停止、SELinux のラベル（container_file_t） |
| nfs | becky (`nfs_enabled`) | NFS サーバ（/nfs） |
| kubeadm | 全ノード | kubelet/kubeadm/kubectl、`kubeadm init` / `join` |
| addons | control plane (becky / ongeki) | Helm、Cilium（LB IP プール、BGP、Cluster Mesh）、Multus と NAD、NFS provisioner、Samba の Secret、KubeVirt と CDI、ArgoCD と各 Application（nas は main の Argo CD に登録）、bind9 と ExternalDNS。nas では使わないものを `*_enabled` で止める |

ノードに Python ライブラリは入れず、`helm` と `kubectl` のコマンドだけで操作する。
バージョンと CIDR は `inventory/group_vars/all/main.yml` に集約している。

## 手動で行うこと
- 管理用ネットワーク（NIC と VLAN 100 の IP・ゲートウェイ・DNS）。ongeki は port9 の 192.168.98.2/30。
- Cilium BGP の相手（FortiGate）側の設定。main と nas の間のポリシーと DNS（[NAS と Cluster Mesh の手順](https://network.technotut.net/computing/deploy)）。

## テスト
実機に触れずに検証する手順は [test/README.md](test/README.md)。
