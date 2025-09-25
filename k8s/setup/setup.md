# k3s setup
## Environment
Operating System: Oracle Linux 9.3
It will work on any Linux distribution.
## Install k3s
Install k3s on a single node (master and worker) with the following command:
```bash
curl -sfL https://get.k3s.io | K3S_KUBECONFIG_MODE="644" INSTALL_K3S_EXEC="--flannel-backend=none --cluster-cidr=10.244.0.0/16 --disable-network-policy --disable=traefik --disable=servicelb" sh -
```
## Network settings
Install Calico
```bash
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.28.1/manifests/tigera-operator.yaml
kubectl create -f https://raw.githubusercontent.com/technotut/k3s/main/setup/calico-manifest/custom-resources.yaml
```
Confirm that all of the pods are running using the following command:
```bash
watch kubectl get pods --all-namespaces
```
Install Calicoctl and configure
```bash
cd /usr/local/bin
curl -L https://github.com/projectcalico/calico/releases/download/v3.28.1/calicoctl-linux-amd64 -o calicoctl
chmod +x ./calicoctl
ln -s /etc/rancher/k3s/k3s.yaml ~/.kube/config
cd
wget https://raw.githubusercontent.com/technotut/k3s/main/setup/calico-manifest/bgppeer.yaml
wget https://raw.githubusercontent.com/technotut/k3s/main/setup/calico-manifest/bgpconfig.yaml
calicoctl apply -f bgppeer.yaml
calicoctl apply -f bgpconfig.yaml
firewall-cmd --add-port=179/tcp --permanent
firewall-cmd --add-port=6443/tcp --permanent
firewall-cmd --add-port=10250/tcp --permanent
firewall-cmd --zone=trusted --add-source=10.33.0.0/16 --permanent
firewall-cmd --zone=trusted --add-source=10.43.0.0/16 --permanent
firewall-cmd --zone=trusted --add-source=10.244.0.0/16 --permanent
firewall-cmd --zone=trusted --add-source=<client-cidr> --permanent
firewall-cmd --reload
```
Configure Router
```
## NEC IX, Cisco IOS
router bgp 65000
neighbor <server-ip> remote-as 65000
exit
write memory
show ip bgp summary
```
Router says "ESTABLISHED", It works!

Confirm network settings
```bash
calicoctl get nodes -o wide
calicoctl get bgpPeer -o wide
calicoctl get ippool -o wide
calicoctl get bgpConfiguration -o wide
watch kubectl get pod -A -o wide
ip route
```

## Setup Persistent Volume using nfs-subdir-external-provisioner
nfs-subdir-external-provisioner: https://github.com/kubernetes-sigs/nfs-subdir-external-provisioner  
Install nfs server
```bash
mkdir /nfs
dnf install nfs-utils
systemctl enable --now nfs-server
vim /etc/exports
```
``` /etc/exports
/nfs localhost(rw,no_root_squash)
```
```bash
exportfs -a
exportfs
firewall-cmd --add-service=nfs --permanent
firewall-cmd --reload
```
Install Helm
```bash
cd /usr/local/bin
wget https://get.helm.sh/helm-v3.13.2-linux-amd64.tar.gz
tar -zxvf helm-v3.13.2-linux-amd64.tar.gz
mv linux-amd64/helm /usr/local/bin/helm 
```
Install nfs-subdir-external-provisioner
```bash
helm repo add nfs-subdir-external-provisioner https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner/
helm install nfs-subdir-external-provisioner nfs-subdir-external-provisioner/nfs-subdir-external-provisioner --set nfs.server=localhost --set nfs.path=/nfs
```

## Setup MetalLB
```bash
kubectl apply -f https://raw.githubusercontent.com/technotut/k3s/main/setup/metallb/metallb.yaml
kubectl apply -f https://raw.githubusercontent.com/technotut/k3s/main/setup/metallb/metallb-ipaddresspool.yaml
```

## Setup Ingress Controller
Use ingress-nginx
```bash
helm upgrade --install ingress-nginx ingress-nginx \
  --repo https://kubernetes.github.io/ingress-nginx \
  --namespace ingress-nginx --create-namespace
```

## Install Kompose
Kompose is convert docker-compose to kubernetes manifest
```bash
cd /usr/local/bin
curl -L https://github.com/kubernetes/kompose/releases/download/v1.31.2/kompose-linux-amd64 -o kompose
chmod +x kompose
```

## Install ExternalDNS
 Confidure Outside BIND Server
```bash
ssh root@192.168.99.51
tsig-keygen -a hmac-sha256 externaldns
## Copy secret
vi /etc/named.conf
```
``` /etc/named.conf
key "externaldns" {
        algorithm hmac-sha256;
        secret "<secret>";
};

zone "kube.technotut.net" IN {
    type master;
    file "kube.technotut.net.zone";
    allow-transfer {
        key "externaldns";
    };
    update-policy {
        grant externaldns zonesub ANY;
    };
};
```
```bash
vi /var/named/kube.technotut.net.zone
```
``` /var/named/kube.technotut.net.zone
$TTL 60 ; 1 minute
kube.technotut.net.         IN SOA  kube.technotut.net. root.kube.technotut.net. (
                                16         ; serial
                                60         ; refresh (1 minute)
                                60         ; retry (1 minute)
                                60         ; expire (1 minute)
                                60         ; minimum (1 minute)
                                )
                        NS      ns.kube.technotut.net.
			A	192.168.99.51
ns                      A       192.168.99.51
```
Restart named
```bash
systemctl restart named
```
Install ExternalDNS
```bash
wget https://raw.githubusercontent.com/technotut/k3s/main/setup/externaldns/externaldns.yaml
## Edit secret
kubectl apply -f externaldns.yaml
```

## Install ArgoCD
```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'
kubectl patch svc argocd-server -n argocd -p '{"metadata": {"annotations": {"external-dns.alpha.kubernetes.io/hostname": "argocd.kube.technotut.net"}}}'
cd /usr/local/bin
curl -L https://github.com/argoproj/argo-cd/releases/download/v2.11.8/argocd-linux-amd64 -o argocd
chmod +x argocd
argocd admin initial-password -n argocd
argocd login argocd.kube.technotut.net
argocd account update-password
```
Access `https://cd.kube.technotut.net` and login `admin` with password
If you can't login, check [this](https://github.com/argoproj/argo-cd/issues/10708)

## Install Rancher
```bash
helm repo add rancher-stable https://releases.rancher.com/server-charts/stable
kubectl create namespace cattle-system
```
Install cert-manager
```bash
helm repo add jetstack https://charts.jetstack.io --force-update
helm install \
cert-manager jetstack/cert-manager \
--namespace cert-manager \
--create-namespace \
--version v1.15.3 \
--set crds.enabled=true
```
```bash
helm install rancher rancher-stable/rancher --namespace cattle-system --set hostname=rancher.kube.technotut.net --set bootstrapPassword=admin
kubectl patch svc rancher -n cattle-system -p '{"spec": {"type": "LoadBalancer"}}'
kubectl patch svc rancher -n cattle-system -p '{"metadata": {"annotations": {"external-dns.alpha.kubernetes.io/hostname": "rancher.kube.technotut.net"}}}'
```

## if you want to reset
k3s uninstall and retry install
```bash
/usr/local/bin/k3s-uninstall.sh
```
