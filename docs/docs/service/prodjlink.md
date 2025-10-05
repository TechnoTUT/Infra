---
title: PRO DJ LINK
sidebar_position: 11
---
## PRO DJ LINK とは
AlphaTheta(Pioneer DJ)のDJ機器同士をネットワークで接続し、曲情報や再生状態を共有します。  
LINK Export機能を利用すれば、PC/Mac/iPhone/iPad/Android端末から直接DJ機器に曲を送信することもできます。

## LINK Export 使用方法
1. お使いの端末でrekordboxを起動します。  
   rekordboxは[こちら](https://rekordbox.com/ja/)からダウンロードできます。
2. DJネットワークに接続します。  
   DJブースのLANケーブルを端末に接続するか、無線接続の場合は`TechnoTUT_DJ_5G`というSSIDに接続します。
3. PC/Macの場合は、`Export`モードに切り替え、左下の`LINK`ボタンをクリックします。  
   iPhone/iPad/Android端末の場合は、`rekordbox`アプリを起動し、`CDJ/XDJに接続`をタップします。 
4. CDJ/XDJの`rekordbox`ボタンを押し、接続した端末名を選択すると、USB同様に利用できます。  
   または、端末上で再生したい曲を選択し、画面下部の`Deck`にドラッグ&ドロップすることで曲のロードができます。  

## トラブルシューティング
- rekordboxがPerformanceモードになっている → Exportモードに変更する
- IPアドレスの取得が手動設定になっている → 自動(DHCP)に変更する
- VPNが有効になっている → 無効にするか, `192.168.13.0/24`を除外するようにスプリットトンネルを設定する
- rekordbox以外のソフトウェアがUDP 50000, 50002ポートを使用している → Rekordbox以外をすべて閉じる, 再起動してからRekordboxだけ起動する
- FirewallでUDP 50000, 50002を許可する, rekordboxの通信を許可する
- LANケーブルで接続している場合は、Wi-Fiをオフにする

macOSの場合、ファイアウォールの設定を確認する必要があります。
1. 左上からシステム設定を選択
2. ネットワークを選択
3. ファイアウォールがオンの場合はオプションを選択して設定を確認します (オフの場合以下の手順は必要ありません)
4. Rekordbox, Rekordbox Agentは`外部からの 接続を許可`に設定します (※外部からの接続をすべてブロックに設定すると接続できません！)
5. OKを選択してPRO DJ LINK 接続ができるようになったことを確認します  
設定変更後も接続できない場合は再起動を行います。

### 簡易的なPRO DJ LINK環境の構築 (部室運用)
iPhone、iPad、Android端末を使用しない 或いは 波形情報を取得する必要がない、VJ機器との連携をする必要がない場合はスイッチのみでPRO DJ LINK環境を構築することができます。  
1. スイッチを電源に接続し起動する。スイッチが完全に起動するまで待つ。
2. XDJ-XZ及び、PC接続用のLANケーブルをスイッチに接続する。   
XDJ-XZはポート1に、PC接続用LANケーブルはポート3、4に接続する。
3. XDJ-XZを起動する。