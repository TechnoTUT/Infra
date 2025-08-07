#!/bin/bash
cd "$(dirname "$0")"
./lxc-debian-gui.sh
openssl req -x509 -nodes -newkey ec:<(openssl ecparam -name prime256v1) -keyout novnc.pem -out novnc.pem -days 3650 -subj "/C=JP/ST=Aichi/L=Toyohashi/O=TechnoTUT/OU=NOC/CN=blt.intra.technotut.net"
websockify -D --web /usr/share/novnc/ --cert novnc.pem 443 localhost:5901
apt-get install -y openjdk-21-jdk
cd ~ && wget https://github.com/Deep-Symmetry/beat-link-trigger/releases/download/v7.3.0/beat-link-trigger-7.3.0.jar
cp config.blt ~/.blt/config.blt
cd ~/.blt && https://gist.githubusercontent.com/brunchboy/223f99e39d832e0ca94c09eab3b04134/raw/3f0cec096e09a0dbe7b5f3010cb061fdcbcd774f/overlay.html

echo "If you want to start the noVNC, run the following command:"
echo "websockify -D --web /usr/share/novnc/ --cert /<path>/novnc.pem 443 localhost:5901"