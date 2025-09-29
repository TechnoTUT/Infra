---
title: Art-Net
sidebar_position: 31
---
網内では、LED通信設備を提供しています。使用するプロトコルはArt-Netです。

## LED BAR
LED BARは電源を投入するとAPに接続され、任意のVLANからLED基盤に対して通信を行うことができるようになります。  
LED BARはVLAN50に接続されています。[(参照)](/network/design)  
IPアドレスは`192.168.11.xxx`です。  
xxxの部分は各LED BARごとに異なります。各基盤を参照してください。  

## LED PAR・Moving Head
LED PAR・Moving HeadはDMX信号で制御します。網内で提供しているコンテナ基盤では、Art-Net信号をDMX信号に変換するサービスを提供しています。  
変換サービスは`10.11.240.254`にて提供しています。

詳細は、[TechnoTUT/qlcplus-artnet-to-dmx-converter](https://github.com/TechnoTUT/qlcplus-artnet-to-dmx-converter)を参照してください。