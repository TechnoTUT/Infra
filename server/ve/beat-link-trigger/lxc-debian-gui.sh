#!/bin/bash
cd "$(dirname "$0")"
apt-get update -y && apt-get upgrade -y
apt-get install -y task-xfce-desktop dbus-x11 tigervnc-standalone-server xrdp novnc python3-websockify
systemctl enable --now xrdp

echo "You must set a password for the VNC server by 'vncpasswd' command."
echo "If you want to start the VNC server, run the following command:"
echo "tigervncserver -xstartup /usr/bin/xfce4-session -localhost no :1"