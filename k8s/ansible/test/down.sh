#!/bin/bash
# テスト環境を全て消す（コンテナ・ネットワーク・ボリューム・ビルドしたイメージ）。
set -uo pipefail
P="sudo -n podman"
$P rm -f -t 1 becky packard frr >/dev/null 2>&1
$P volume rm -f becky-containerd becky-kubelet packard-containerd packard-kubelet >/dev/null 2>&1
$P network rm -f k8s-test >/dev/null 2>&1
$P rmi -f k8s-node-test >/dev/null 2>&1
echo "down: done"
