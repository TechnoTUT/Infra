---
title: 仕様
sidebar_position: 2
---

# ネットワーク仕様

## 主要ネットワーク機器の役割

本ネットワークを構成する主要な機器とその役割は以下の通りです。

- **対外接続ルータ**: [NEC UNIVERGE IX3110](https://github.com/TechnoTUT/Infra/blob/main/network/config/IX3110.txt)
- **コアスイッチ**: [Allied Telesis AT-SH510-28GTX](https://github.com/TechnoTUT/Infra/blob/main/network/config/AT-SH510-28GTX.txt)
  - 会場内スイッチング・ルーティングの中心。各VLANのゲートウェイ（SVI）やDHCPサーバー機能を提供。
- **NGFW (次世代ファイアウォール)**: Fortinet FortiGate 60D
  - 対外接続ルータとコアスイッチの間で、セキュリティ制御を行う。


---

## 構成図
![topology](https://github.com/TechnoTUT/Infra/blob/main/network/topology.drawio.svg?raw=true)
![wire](https://github.com/TechnoTUT/Infra/blob/main/network/wire.drawio.svg?raw=true)

---

## 機材一覧

### L3
[NEC UNIVERGE IX3110](https://jpn.nec.com/univerge/ix/Info/ix3110.html)  
[Allied Telesis AT-SH510-28GTX](https://www.allied-telesis.co.jp/support/list/switch/x510/manual.html)  
[Allied Telesis AT-x600-48Ts](https://www.allied-telesis.co.jp/support/list/switch/x600/manual.html)

### Security
[Fortinet FortiGate 60D](https://www.fgshop.jp/product/hanbaisyuryo/fortigate-60d/)

### L2
[Allied Telesis AT-x210-24GT](https://www.allied-telesis.co.jp/support/list/switch/x210/manual.html)  
[Allied Telesis GS924M V2 x2](https://www.allied-telesis.co.jp/support/list/switch/gs900mv2/manual.html)  
[ApresiaLightGM110GT-PoE](https://www.apresia.jp/products/apresialight/aplgm110gtpoe2.html)  
[Cisco Catalyst 2960 Plus 24TC-L](https://www.cisco.com/c/ja_jp/support/switches/catalyst-2960-plus-24tc-l-switch/model.html)  


### AP
[Cisco Aironet 2700](https://www.cisco.com/c/ja_jp/support/wireless/aironet-2700-series-access-point/series.html)  
[ELECOM WAB-I1750-PS](https://www.elecom.co.jp/products/WAB-I1750-PS.html)  
[TP-Link Archer A2600](https://www.tp-link.com/jp/home-networking/wifi-router/archer-a2600/)  
[TP-Link RE305](https://www.tp-link.com/jp/home-networking/range-extender/re305/)  
[GL.iNet GL-AR300M16-EXT](https://www.gl-inet.com/products/gl-ar300m16-ext/)  