#!/bin/bash
cd "$(dirname "$0")"
dnf update -y
dnf install -y bind bind-utils firewalld
cat <<EOF >> /etc/sysconfig/named
OPTIONS="-4"
EOF
cp ./named.conf /etc/named.conf
cp ./intra.technotut.net.zone /var/named/intra.technotut.net.zone
cp ./99.168.192.in-addr.arpa.zone /var/named/99.168.192.in-addr.arpa.zone
systemctl enable -now named
firewall-cmd --add-service=dns --permanent
firewall-cmd --reload