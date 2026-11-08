# Ansible によるクラスタ構築

管理用のマシンから SSH で実行する。ノード (becky, packard, marie) には Ansible を入れない。ノードは最小かつ同一の構成に保つ。

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
ansible-playbook playbooks/site.yml          # 構築
ansible-playbook playbooks/reset.yml         # 全消去（RESET と入力）
```

## 構成
| ロール | 対象 | 内容 |
|---|---|---|
| network | 全ノード | VLAN 10・20 とブリッジ br10・br20（DHCP）。管理用 VLAN は手動 |
| common | 全ノード | 不要パッケージの削除、swap 無効化、カーネルモジュール、sysctl、nfs-common |
| containerd | 全ノード | Docker の apt から containerd.io（hold） |
| nfs | becky | NFS サーバ（/nfs） |
| kubeadm | 全ノード | kubelet/kubeadm/kubectl、`kubeadm init` / `join` |
| addons | becky | Helm、Cilium（LB IP プール、BGP）、Multus と NAD、NFS provisioner、KubeVirt と CDI、ArgoCD と各 Application、bind9 と ExternalDNS |

ノードに Python ライブラリは入れず、`helm` と `kubectl` のコマンドだけで操作する。
バージョンと CIDR は `inventory/group_vars/all/main.yml` に集約している。

## 手動で行うこと
- 管理用ネットワーク（NIC と VLAN 100 の IP・ゲートウェイ・DNS）。
- Cilium BGP の相手（FortiGate）側の設定。

## テスト
実機に触れずに検証する手順は [test/README.md](test/README.md)。
