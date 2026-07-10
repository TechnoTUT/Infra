---
title: 構築方法
sidebar_position: 2
---
# Kubernetes (k8s) 構築方法
## Special thanks  
[@launchpencil](https://github.com/launchpencil): Kubernetes入門支援．

## 環境
Operating System: Debian GNU/Linux 13 (Trixie) 
Nodes: 3 (pjsekai, maimai, chunithm)

| Node | CPU | Memory | Disk | IP Address | Role |
|------|-----|--------|------|------------|------|
| pjsekai | 4CPU | 8GB | 500GB HDD | 192.168.99.200/24 | Control-Plane |
| maimai | 2CPU | 12GB | 320GB HDD | 192.168.99.201/24 | Worker |
| chunithm | 2CPU | 12GB | 500GB HDD | 192.168.99.202/24 | Worker |

## Kubernetesのインストール
コンテナランタイム containerd をインストールする．  
https://kubernetes.io/ja/docs/setup/production-environment/tools/kubeadm/install-kubeadm/  
https://kubernetes.io/ja/docs/setup/production-environment/container-runtimes/  
https://github.com/cri-o/packaging/blob/main/README.md#usage

## クラスタの作成
Control-Planeノード (pjsekai) で以下のコマンドを実行してクラスタを作成する．  
https://kubernetes.io/ja/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/
```bash
kubeadm init --pod-network-cidr=10.11.0.0/16
```

コマンドの実行が成功すると、Workerノードをクラスタに参加させるためのコマンドが表示される。
Workerノード (maimai, chunithm) で、Control-Planeノードから表示されたコマンドを実行してクラスタに参加させる．
```bash
kubeadm join ... 
```

## kubectlの設定
kubeadm joinコマンドの実行後、Control-Planeノードでkubectlを使用できるようにするためのコマンドが表示される．
```bash
## Login as normal user
## Copy kubeconfig file to user's home directory
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

## ネットワーク(CNI)のインストール
KubernetesのネットワークはCNI (Container Network Interface) プラグインによって実装されている．  
今回はCiliumを使用する．  
https://docs.cilium.io/en/stable/gettingstarted/k8s-install-default/#k8s-install-quick
https://docs.cilium.io/en/stable/installation/k8s-install-kubeadm/

Cilium CLIをインストールする．  
https://docs.cilium.io/en/stable/gettingstarted/k8s-install-default/#install-the-cilium-cli
```bash
CILIUM_CLI_VERSION=$(curl -s https://raw.githubusercontent.com/cilium/cilium-cli/main/stable.txt)
CLI_ARCH=amd64
if [ "$(uname -m)" = "aarch64" ]; then CLI_ARCH=arm64; fi
curl -L --fail --remote-name-all https://github.com/cilium/cilium-cli/releases/download/${CILIUM_CLI_VERSION}/cilium-linux-${CLI_ARCH}.tar.gz{,.sha256sum}
sha256sum --check cilium-linux-${CLI_ARCH}.tar.gz.sha256sum
sudo tar xzvfC cilium-linux-${CLI_ARCH}.tar.gz /usr/local/bin
rm cilium-linux-${CLI_ARCH}.tar.gz{,.sha256sum}
```

Ciliumをインストールする．
```bash
cilium install \
  --version 1.19.5 \
  --set ipv4.enabled=true \
  --set routingMode=native \
  --set ipam.mode=kubernetes \
  --set ipv4NativeRoutingCIDR="10.11.0.0/16" \
  --set autoDirectNodeRoutes=true \
  --set kubeProxyReplacement=true \
  --set bgpControlPlane.enabled=true \
  --set k8sRequireIPv4PodCIDR=true \
  --set hubble.relay.enabled=true \
  --set hubble.ui.enabled=true \
  --set enableIPv4Masquerade=false \
  --set k8sServiceHost=192.168.99.200 \
  --set k8sServicePort=6443 \
  --set ingressController.enabled=true \
  --set ingressController.loadbalancerMode=shared
  ```

CiliumがIngress ServiceをBGPでアナウンスするように設定する．
```bash
kubectl patch service cilium-ingress -n kube-system -p '{"metadata": {"labels": {"announce": "bgp"}}}'
``` 

## ストレージの準備
Persistent Volume (PV) をNFSで提供するためのプロビジョナー nfs-subdir-external-provisioner をインストールする．  
nfs-subdir-external-provisioner: https://github.com/kubernetes-sigs/nfs-subdir-external-provisioner  

NFSサーバを構築する．  
https://www.server-world.info/query?os=Debian_13&p=nfs&f=1
``` /etc/exports
/nfs 192.168.99.0/24(rw,no_root_squash)
```

全てのノードにnfs-commonをインストールする．
```bash
sudo apt install nfs-common
```

KubernetesのパッケージマネージャであるHelmをインストールする．
```bash
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
chmod 700 get_helm.sh
./get_helm.sh
```
nfs-subdir-external-provisioner をHelmでインストールする． 
```bash
helm repo add nfs-subdir-external-provisioner https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner/
helm install nfs-subdir-external-provisioner nfs-subdir-external-provisioner/nfs-subdir-external-provisioner --set nfs.server=192.168.99.200 --set nfs.path=/nfs --namespace nfs-provisioner --create-namespace
```

## ExternalDNS の導入
https://github.com/kubernetes-sigs/external-dns/blob/master/docs/tutorials/rfc2136.md

```bash
## Create TSIG key for RFC2136 and copy to secret.yaml
tsig-keygen -a hmac-sha256 externaldns
```
参照: [secret.yaml](https://github.com/TechnoTUT/Infra/blob/main/k8s/setup/bind9/secret.yaml) [externaldns.yaml](https://github.com/TechnoTUT/Infra/blob/main/k8s/setup/bind9/externaldns.yaml)
```bash
kubectl create namespace bind
vim secret.yaml  ## paste the key you generated
vim externaldns.yaml  ## edit the secret
kubectl apply -f secret.yaml
kubectl apply -f externaldns.yaml
```
Deploy BIND9
```bash
kubectl apply -f .
```

## GitOpsの導入
ArgoCDをインストールする．  
ArgoCD CLIは以下からダウンロードする．  
https://github.com/argoproj/argo-cd/releases/latest
```bash
ARGOCD_VERSION=v3.4.4
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'
kubectl patch 
curl -L https://github.com/argoproj/argo-cd/releases/download/${ARGOCD_VERSION}/argocd-linux-amd64 -o argocd
chmod +x argocd
sudo mv argocd /usr/local/bin/argocd
argocd admin initial-password -n argocd
argocd login cd.svc.technotut.net
argocd account update-password
```
`cd.svc.technotut.net` にアクセスして `admin` ユーザでログインできるか確認する．

## Install KubeVirt
https://kubevirt.io/user-guide/cluster_admin/installation/#installing-kubevirt-on-kubernetes
```bash
export RELEASE=$(curl https://storage.googleapis.com/kubevirt-prow/release/kubevirt/kubevirt/stable.txt)
kubectl apply -f https://github.com/kubevirt/kubevirt/releases/download/${RELEASE}/kubevirt-operator.yaml
kubectl apply -f https://github.com/kubevirt/kubevirt/releases/download/${RELEASE}/kubevirt-cr.yaml
```
Install virtctl
https://kubevirt.io/user-guide/user_workloads/virtctl_client_tool/
```bash
export VERSION=$(curl https://storage.googleapis.com/kubevirt-prow/release/kubevirt/kubevirt/stable.txt)
curl -L https://github.com/kubevirt/kubevirt/releases/download/${VERSION}/virtctl-${VERSION}-linux-amd64 -o virtctl
sudo mv virtctl /usr/local/bin/
sudo chmod +x /usr/local/bin/virtctl
```
Install Containerized Data Importer (CDI)
https://kubevirt.io/labs/kubernetes/lab2.html
```bash
export VERSION=$(basename $(curl -s -w %{redirect_url} https://github.com/kubevirt/containerized-data-importer/releases/latest))
kubectl create -f https://github.com/kubevirt/containerized-data-importer/releases/download/$VERSION/cdi-operator.yaml
kubectl create -f https://github.com/kubevirt/containerized-data-importer/releases/download/$VERSION/cdi-cr.yaml
```

## Install Multus
If you want to use L2 connection between PRO DJ LINK or Ableton Link Network, install Multus.

Create bridge interface at all nodes. Configure `/etc/network/interfaces`.  
Sample:
```
# This file describes the network interfaces available on your system
# and how to activate them. For more information, see interfaces(5).

source /etc/network/interfaces.d/*

# The loopback network interface
auto lo
iface lo inet loopback

# The primary network interface
allow-hotplug eno1
iface eno1 inet manual
        ## avoid Intel NIC e1000e hardware unit hang
        ## post-up /sbin/ethtool -K eno1 gro off tso off gso off rx off tx off rxvlan off txvlan off sg off

# vlan setting
auto eno1.10
iface eno1.10 inet manual
        vlan-raw-device eno1

auto eno1.30
iface eno1.30 inet manual
        vlan-raw-device eno1

auto eno1.100
iface eno1.100 inet static
        vlan-raw-device eno1
        address 192.168.99.200/24
        gateway 192.168.99.1
        dns-nameservers 192.168.99.1
        dns-search srv.utone.technotut.net

auto br10
allow-hotplug br10
iface br10 inet manual
  bridge_ports eno1.10
  bridge_stp off
  bridge_maxwait 1

auto br30
allow-hotplug br30
iface br30 inet manual
  bridge_ports eno1.30
  bridge_stp off
  bridge_maxwait 1

```

Install Multus
```bash
kubectl apply -f https://raw.githubusercontent.com/k8snetworkplumbingwg/multus-cni/master/deployments/multus-daemonset-thick.yml
```

Create NetworkAttachmentDefinition for vlan10
```yaml
apiVersion: "k8s.cni.cncf.io/v1"
kind: NetworkAttachmentDefinition
metadata:
  name: vlan10-bridge
  namespace: kube-public
spec:
  config: |
    {
      "cniVersion": "0.3.1",
      "name": "vlan10",
      "type": "bridge",
      "bridge": "br10",
      "ipam": {
          "type": "host-local",
          "subnet": "10.10.0.0/16"
      }
    }
```

## if you want to reset
Uninstall and retry install  
https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/#remove-the-node  

at Control-Plane node:
```bash
kubectl drain <node name> --delete-emptydir-data --force --ignore-daemonsets
```

at all nodes:
```bash
kubeadm reset
iptables -F && iptables -t nat -F && iptables -t mangle -F && iptables -X
ipvsadm -C
kubectl delete node <node name>
```
