# Ansible によるクラスタ構築

becky（コントロールプレーン）で実行する。becky 自身は local 接続、packard と marie には SSH で接続する。

## 準備
```bash
sudo apt install -y ansible-core
ansible-galaxy collection install -r requirements.yml
# Vault のパスワード（Git に入れない）
install -m 600 /dev/null ~/.vault_pass && $EDITOR ~/.vault_pass
export ANSIBLE_VAULT_PASSWORD_FILE=~/.vault_pass   # vault.yml を使うときだけ必要
```
Secret は `inventory/group_vars/all/vault.yml`（`ansible-vault create` で作成）に置く。例は `vault.yml.example`。

## 実行
```bash
ansible-playbook playbooks/site.yml          # 構築
ansible-playbook playbooks/reset.yml         # 全消去（RESET と入力）
```

## 構成
| ロール | 内容 |
|---|---|
| common | swap 無効化、カーネルモジュール、sysctl、nfs-common |
| containerd | Docker の apt から containerd.io（hold） |
| kubeadm | kubelet/kubeadm/kubectl、`kubeadm init` / `join` |
| addons | Helm、Cilium、Multus、NFS provisioner、ArgoCD と各 Application |

バージョンと CIDR は `inventory/group_vars/all/main.yml` に集約している。

## 未対応
- network ロール（`/etc/network/interfaces`）: 手動設定が完成してから追加する。
- ExternalDNS / bind9。
- KubeVirt / CDI（`kubevirt_enabled: false`）。BLT のコンテナ化が済むまで入れない。
- Cilium BGP のピア設定（`cilium_bgp_enabled: false`）。値が確定してから有効にする。
