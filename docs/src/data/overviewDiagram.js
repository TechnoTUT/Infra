export const overviewDiagram = `flowchart LR
    subgraph SG_NET["ネットワーク基盤 / 対外接続"]
        direction TB
        IX["IX3110<br/>対外接続"]
        FG["FortiGate 100D<br/>L3 ルーティング / DHCP / DNS / FW"]
        IX <-- "iBGP" --> FG
    end

    subgraph SG_DJ["DJ ブース (VLAN 10: dj)"]
        direction TB
        CDJ["CDJ / XDJ<br/>(XDJ-AZ 等)"]
        RB["DJ PC / スマホ<br/>(rekordbox LINK Export)"]
        RB <-- "PRO DJ LINK" --> CDJ
    end

    subgraph SG_CAM["カメラ (VLAN 44/45: cam1/cam2)"]
        direction TB
        CAM1["ソニー製カメラ 1<br/>(Wi-Fi / cam1)"]
        CAM2["ソニー製カメラ 2<br/>(Wi-Fi / cam2)"]
    end

    subgraph SG_PA["PA 音響 (VLAN 40: pa)"]
        direction TB
        IPAD["操作端末 (iPad / PC)<br/>soundcraft-ui-mcp"]
        MIXER["デジタルミキサー<br/>(Soundcraft Ui12)"]
        IPAD <-- "Web UI / WebSocket" --> MIXER
    end

    subgraph SG_K8S["Kubernetes 基盤 (VLAN 100: sv)"]
        direction TB
        BIND["bind9<br/>(内部 DNS)"]
        PLMUX["plmux<br/>楽曲情報 / オーバーレイ"]
        NDIDS["NDI Discovery Server<br/>ソース登録・検索"]
        RTMP["rtmp-live-server &amp;<br/>sony-camera-rtmp-relay"]
        DMXGW["dmx (Art-Net → DMX)<br/>dmxsim (3D シミュレータ)"]
        CORE["Argo CD / Samba (nas)"]
    end

    subgraph SG_AV["AV・映像伝送 (VLAN 20: av)"]
        direction TB
        VJ["VJ PC<br/>(Resolume)"]
        STREAM["配信 PC<br/>(OBS Studio)"]
        UT_TX["utone-linux<br/>音声・HDMI → NDI"]
        UT_RX["utone-linux<br/>NDI → HDMI"]
        UT_BTH["utone-linux<br/>booth-display"]
        UT_DMX["utone-linux<br/>dmxctl"]
    end

    subgraph SG_OUT["会場出力・演出機器"]
        direction TB
        DISP["プロジェクタ / モニタ"]
        BTH["ブースディスプレイ × 3<br/>(VLAN 43: ldisp)"]
        LBAR["LED BAR<br/>(VLAN 30: lbar)"]
        LPAR["LED PAR / Moving Head<br/>(DMX512)"]
        ENT["入口フライヤー表示<br/>utone-linux (VLAN 42: ent)"]
    end

    %% 基盤との接続
    FG -- "DNS クエリ転送" --> BIND
    FG --- SG_PA

    %% PRO DJ LINK & Ableton Link / OSC
    CDJ -- "PRO DJ LINK<br/>(Multus VLAN 10)" --> PLMUX
    PLMUX -- "Ableton Link<br/>(Multus VLAN 20)" --> VJ
    PLMUX -- "Ableton Link / OSC" --> UT_DMX
    PLMUX -- "HTTP オーバーレイ" --> STREAM

    %% RTMP 配信
    CAM1 -- "RTMP" --> RTMP
    CAM2 -- "RTMP" --> RTMP
    RTMP -- "RTMP 配信/視聴" --> STREAM
    RTMP -- "RTMP 外部配信" --> IX

    %% NDI 映像・音声伝送
    MIXER -- "音声" --> UT_TX
    VJ -- "HDMI" --> UT_TX
    UT_TX -- "NDI (映像・音声)" --> STREAM
    UT_TX -- "NDI" --> UT_RX
    UT_RX -- "HDMI" --> DISP
    UT_TX -- "NDI" --> UT_BTH
    UT_TX -- "NDI (色連動)" --> UT_DMX
    UT_TX -. "NDI ソース登録・検索" .-> NDIDS

    %% ブースディスプレイ・サイネージ
    ADMIN["操作端末<br/>(PC / スマホ)"]
    UT_BTH -- "UDP H.264" --> BTH
    ADMIN -. "Web GUI (画像更新)" .-> ENT

    %% Art-Net 照明制御
    UT_DMX -- "Art-Net" --> LBAR
    UT_DMX -- "Art-Net" --> DMXGW
    DMXGW -- "DMX" --> LPAR
    UT_DMX -- "USB-DMX" --> LPAR
`;
