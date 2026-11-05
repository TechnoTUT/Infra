#!/bin/bash
# テスト環境（becky / packard / FRR のコンテナ）を作る。rootful の podman (sudo) が必要。
set -euo pipefail
cd "$(dirname "$0")"
P="sudo -n podman"
NET=k8s-test
IMG=k8s-node-test

$P build -q -t "$IMG" -f Containerfile . >/dev/null
$P network exists "$NET" || $P network create --subnet 172.31.99.0/24 --gateway 172.31.99.1 "$NET" >/dev/null

for n in becky:200 packard:201; do
  h=${n%%:*}; ip=172.31.99.${n##*:}
  $P rm -f "$h" >/dev/null 2>&1 || true
  $P run -d --name "$h" --hostname "$h" --privileged --systemd=always --cgroupns=private \
    --network "$NET" --ip "$ip" --memory 2500m \
    -v "$h-containerd:/var/lib/containerd" -v "$h-kubelet:/var/lib/kubelet" \
    -v /lib/modules:/lib/modules:ro "$IMG" >/dev/null
done

# Cilium が /sys/fs/bpf を使えるように、bpffs を shared にする（コンテナ固有の対処）
sleep 5
for h in becky packard; do
  $P exec "$h" sh -c 'mount --make-rshared /; mountpoint -q /sys/fs/bpf || mount -t bpf bpf /sys/fs/bpf; mount --make-shared /sys/fs/bpf'
done

# FortiGate の代わりの FRR（iBGP, AS 64646）
$P rm -f frr >/dev/null 2>&1 || true
$P run -d --name frr --hostname fortigate-test --privileged --network "$NET" --ip 172.31.99.129 \
  -v "$PWD/frr/daemons:/etc/frr/daemons:ro,Z" -v "$PWD/frr/frr.conf:/etc/frr/frr.conf:Z" \
  -v "$PWD/frr/vtysh.conf:/etc/frr/vtysh.conf:ro,Z" docker.io/frrouting/frr:latest >/dev/null
echo "up: becky packard frr"
