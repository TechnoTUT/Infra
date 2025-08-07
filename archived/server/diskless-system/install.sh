#!/bin/bash
apt-get update -y && apt-get upgrade -y
apt-get install -y --install-recommends ltsp ltsp-binaries dnsmasq nfs-kernel-server openssh-server squashfs-tools ethtool net-tools epoptes
gpasswd -a administrator epoptes
ltsp dnsmasq --proxy-dhcp=0
echo "Diskless System is Installed"
echo "Please execute create-image.sh"