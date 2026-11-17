;; plmux の Clojure の式: TechnoTUT/dmxctl で照明を曲に合わせる。
;; dmxctl の README「Beat Link Trigger との連携」と同じことを、BLT なしで plmux から行う。
;; 書き方は plmux の README (Clojure expressions) を参照。
;;
;; kustomization.yaml の configMapGenerator が ConfigMap plmux-expressions にし、plmux の /config にマウントする。
;; このファイルを main にマージすると、Argo CD が ConfigMap を更新し、plmux が数十秒で読み込み直す (Pod は作り直さない)。
;; 読み込みのエラーや、フックごとの実行回数は plmux の GUI の Expressions タブで見られる。
;;
;; dmxctl 側: 「MIDI/OSC」タブで OSC を受信、「オート」タブでオートを ON。テンポの元は Ableton Link
;; (dmxctl の PC を VJ/AV の VLAN20 につなぐ。plmux の Link は VLAN20 に広報している)。
;;
;; OSC は plmux の Pod から送る。Pod の通信はノードの IP (dmz) に SNAT されて FortiGate を通るので、
;; FortiGate に dmz から dmxctl の PC への UDP 9000 を許可するポリシーが必要。

(def dmxctl-host "192.0.2.10")    ; TODO: dmxctl を動かしている PC の IP アドレス (192.0.2.10 はどこにも届かない仮の値)
(def dmxctl-port 9000)             ; dmxctl の OSC 受信ポート (UDP)

(global-setup
  (swap! globals assoc :dmx (osc/osc-client dmxctl-host dmxctl-port)))

;; 波形の色・大きさを LEAD 秒先読みして、照明が光る (LIGHT 秒遅れる) ときにちょうどその色・明るさになるよう送る。
;; 色は GUI の表示の形式 (3-Band など) とは関係なく、rekordbox の RGB 波形から取る。
(every 40
  (when playing?
    (let [lead  0.15
          light 0.05
          s     (waveform-sample device-number (+ track-time-reached (* lead 1000 pitch-multiplier)))]
      (when s
        (when (:r s)
          (osc/osc-send (:dmx @globals) "/dmx/main/rgb/at"
                        (float (:r s)) (float (:g s)) (float (:b s)) (float (- lead light))))
        (osc/osc-send (:dmx @globals) "/dmx/level/at" (float (:level s)) (float (- lead light)))))))

;; rekordbox のフレーズ (intro / verse / bridge / chorus / up / down / outro) で見た目を切り替える。
(phrase-started
  (when phrase-kind
    (osc/osc-send (:dmx @globals) "/dmx/phrase" phrase-kind)))

;; Ableton Link (UDP マルチキャスト) が dmxctl の PC まで届かないときだけ、テンポと小節の頭を OSC で送る。
;; (beat
;;   (osc/osc-send (:dmx @globals) "/dmx/bpm" (float effective-tempo))
;;   (when (= beat-within-bar 1)
;;     (osc/osc-send (:dmx @globals) "/dmx/resync")))

(global-shutdown
  (osc/osc-close (:dmx @globals)))
