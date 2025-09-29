---
title: Beat Link Trigger
sidebar_position: 21
---
## Beat Link Trigger とは
Beat Link Trigger は、AlphaTheta(Pioneer DJ)のDJ機器と連携し、曲情報を取得するためのツールです。  
コンピュータで仮想的なCDJを作成し、[PRO DJ LINK](/service/prodjlink)を用いて情報を取得します。  
[![Deep-Symmetry/beat-link-trigger - GitHub](https://gh-card.dev/repos/Deep-Symmetry/beat-link-trigger.svg?fullname=)](https://github.com/Deep-Symmetry/beat-link-trigger)  
[TechnoTUT Network](/)では、[コンテナ基盤](/computing)上で動作するDebian GUI環境を提供しており、その環境でBeat Link Triggerを利用することができます。  

## 機能
Beat Link Trigger は以下の機能を提供します。  
- 曲情報・波形情報の取得・表示
- [OSCによる対応外部機器との取得情報の共有](/service/osc)
- httpによる取得情報の共有

## 使用方法
1. [TechnoTUT Network](/)に接続します。  
2. Debian GUI環境に接続します。  
   `blt.svc.technotut.net`へリモートデスクトップ接続を行います。
3. デスクトップの`start.sh`を実行してBeat Link Triggerを起動します。  
    起動すると、自動で曲情報・波形情報が表示されます。  
   ![Beat Link Trigger](/img/service/beat-link-trigger_trackinfo.jpg)

何らかの不具合が発生した場合は、一度ウィンドウを閉じて再度`start.sh`を実行してください。  

## 開発者向け情報
### 各種機能の起動自動化

[Triggers Global Expressions :: Beat Link Trigger User Guide](https://blt-guide.deepsymmetry.org/beat-link-trigger/0.6.3/Expressions_TriggerGlobal.html)

Global Setup Expression

```clojure
(set-overlay-background-color (Color. 0 0 0 0))
(swap! globals assoc :player-status-always-on-top true)
(swap! globals assoc :player-status-columns 2)
(when (.isRunning (VirtualCdj/getInstance))
  (beat-link-trigger.triggers/show-player-status))
```

Came Online Expression

```clojure
(triggers/show-player-status)
(overlay/run-server)
(beat-link-trigger.carabiner/show-window nil)  
(beat-link-trigger.carabiner/connect)  
(beat-link-trigger.carabiner/sync-mode :passive)  
(beat-link-trigger.carabiner/sync-link true)  
(beat-link-trigger.carabiner/align-bars true)
```

### OSCによるBPM情報の送信

[Example: Send OSC message on each beat](https://github.com/Deep-Symmetry/beat-link-trigger/wiki/Example:-Send-OSC-message-on-each-beat)

Master PlayerのExpressionを設定します.

Setup Expression

```clojure
(swap! locals assoc :restap (osc/osc-client "<IP>" <PORT>))
```

Beat Expression

```clojure
(when trigger-active?
  (osc/osc-send (:restap @locals) "/osc/path" 1.0))
```

Shutdown Expression

```clojure
(osc/osc-close (:restap @locals))
```

### OSCによる曲名情報の送信

Master PlayerのExpressionを設定します.

Setup Expression

```clojure
(swap! locals assoc :oscblt (osc/osc-client "<IP>" <PORT>)) 
```

Tracked Update Expression

```clojure
(let [metadata track-metadata]
	(swap! locals update-in [:oscmetadata]
		(fn [old-metadata]
			(when (not= metadata old-metadata)
				(osc/osc-send (:oscblt @locals) "/osc/path" track-artist track-title))
			metadata)))
```

Shutdown Expression

```clojure
(osc/osc-close (:oscblt @locals))
```