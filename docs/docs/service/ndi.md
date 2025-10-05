---
title: NDI
sidebar_position: 22
---
## NDIとは
- IPネットワーク上で伝送するためのプロトコル
- 超低遅延で伝送できる
- 長距離伝送が可能 (HDMIでは長くても15~20m程度)
- 複数のデバイスで映像を取り込むことが可能である
- 複製が容易

## キャプチャーボードとの違い
キャプチャーボードは、1チャネルの映像をUSB経由でパソコンに送信しますが、NDIでは、1本のLANケーブルに帯域の許す限り無限チャネルの映像を送受信することができます。よって、NDIを利用することで、ネットワークケーブルのみで、複数のカメラの映像を1台のコンピュータで同時に受信したり、1台のコンピュータ内の複数のアプリケーションの映像をLANケーブル1本で他のパソコンで受信したりすることができます。  

## NDIを利用する
### 必要なもの
- カテゴリー5e以上のLANケーブル
- Gigabit Ethernet以上のスイッチ
- NDI対応のソフトウェア (OBS Studio, Resolume Avenue など)
:::info
- NDIは、1本のLANケーブルに帯域の許す限り無限チャネルの映像を送受信することができますが、帯域が不足した場合、映像が不安定になることがあります。
- スイッチングファブリックを確認してください。スイッチングファブリックの低いスイッチでは、帯域が不足する可能性があります。
- NDIでは、mDNSを利用してネットワーク上のコンピュータを検索します。よって、コンピュータ同士は同セグメントに属している必要があります。マルチキャストを利用するため、IGMPスヌーピングが正しく設定されている必要があります。QuerierをVLAN内に1台設定するか、すべてのスイッチのIGMPスヌーピングを無効にします。
- NDIでは、コンピュータ同士が通信を行うことによって、映像を送受信します。ファイアウォールによって通信がブロックされていると機能しません。映像の送受信が上手くいかない場合は、ファイアウォールの設定を確認します。Windowsの場合は、接続されているネットワークがプライベートネットワークに設定されているか確認します。
:::
### utone-linuxの場合
utone-linuxは、標準でNDIの送受信機能を搭載しています。またLive環境で動作するため、OSのインストールは不要です。  
使用方法は [TechnoTUT/utone-linux](https://github.com/TechnoTUT/utone-linux)を参照してください。  

### Resolume Avenueの場合
Resolume Avenueの場合、標準でNDIの送受信ができます。NDI出力を行う場合は、[配線図](/network/design)を参考にしてAVネットワーク(VLAN30)に接続し`Output` > `Network streaming (NewTek NDI)`を選択してNDI出力を有効にします。  
詳細は、[Resolume AvenueのNDIについて](https://resolume.com/support/ja/NDI_inputs_and_outputs)を参照してください。

### OBS Studioの場合
OBS Studioの場合、[DistroAV](https://github.com/DistroAV/DistroAV)をインストールすることで、NDIの送受信ができます。OBSのバージョンと環境にあったものをダウンロードしてください。  
動作しない場合、NDIのランタイムがインストールされていない可能性があります。インストール方法は以下をご覧ください。
https://github.com/DistroAV/DistroAV/wiki/1.-Installation

Ubuntuの場合は、以下のコマンドで一括インストールができます。
```
curl https://raw.githubusercontent.com/TechnoTUT/OBS-Temprate/refs/heads/main/install.sh | bash
```
#### 送信
- OBS Studioを起動し、`Tools` > `NDI Output Settings`を選択し、`Main Output`を有効にします。
#### 受信
- OBS Studioを起動し、Sourceの追加から`NDI Source`を選択し、`Source Name`を選択します。`Latency Mode`は`Lowest (Unbuffered)`を選択します。

## NDI on L3 Network
NDIは通常mDNSを利用して同一セグメント内の機器を検出しますが、ネットワークを超えてNDIを利用することができます。  
L3ネットワークでNDIを利用する場合、以下の設定が必要です。
- NDI Discovery Serverを設置する
- NDI Discovery ServerのIPアドレスを各機器に設定する
### NDI Discovery Serverの設置
NDI Discovery Serverは、NDIの機器を名前解決するためのサーバです。  
TechnoTUT Networkでは、コンテナ基盤上でNDI Discovery Serverを提供しています。  
[![TechnoTUT/ndi-discovery-server - GitHub](https://gh-card.dev/repos/TechnoTUT/ndi-discovery-server.svg?fullname=)](https://github.com/TechnoTUT/ndi-discovery-server/pkgs/container/ndi-discovery-server)
### NDI Discovery ServerのIPアドレスを各機器に設定する
NDI Discovery ServerのIPアドレスは`10.11.230.254 (ndi.svc.technotut.net)`です。
#### utone-linuxの場合
utone-linuxでは、予めNDI Discovery ServerのIPアドレスが設定されています。設定は不要です。
#### Windows/Macの場合
Windowsの場合、[NDI Tools](https://www.ndi.tv/tools/)をインストールし、`NDI Access Manager`から設定を変更します。
#### Linuxの場合
`~/.ndi/ndi-config.v1.json`を編集します。設定例を以下に示します。  
https://docs.ndi.video/all/getting-started/white-paper/discovery-and-registration/discovery-server  
```json
{
  "ndi" : {
    "rudp" : {
      "recv" : {
        "enable" : true
      }
    },
    "tcp" : {
      "recv" : {
        "enable" : false
      }
    },
    "networks" : {
      "ips" : "",
      "discovery" : "10.11.230.254"
    },
    "groups" : {
      "recv" : "public",
      "send" : "public"
    },
    "multicast" : {
      "send" : {
        "enable" : true,
        "netprefix" : "239.255.0.0",
        "netmask" : "255.255.0.0"
      }
    },
    "unicast" : {
      "recv" : {
        "enable" : true
      }
    }
  }
}
```

## トラブルシューティング
以下のページを参考にしてください。
- [2. Troubleshooting | DistroAV/DistroAV Wiki](https://github.com/DistroAV/DistroAV/wiki/2.-Troubleshooting)

Ubuntuでufwを利用している場合、以下のコマンドでNDIの通信を許可します。
```bash
sudo ufw allow 5353/udp
sudo ufw allow 5959:5969/tcp
sudo ufw allow 5959:5969/udp
sudo ufw allow 6960:6970/tcp
sudo ufw allow 6960:6970/udp
sudo ufw allow 7960:7970/tcp
sudo ufw allow 7960:7970/udp
sudo ufw allow 5960/tcp
sudo ufw --force enable
sudo ufw status
```
