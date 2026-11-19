import { useEffect, useRef, useState } from 'react';
import MissionFibers from './MissionFibers.jsx';

// Our Mission: スクロールに連動して 1 項目ずつ開閉する。
// リストが「読み込み時の位置」から「ヘッダーのすぐ下」まで上がる間に、01 → 04 の順に開く。
// 切り替わる位置は開き始めからのスクロール距離で固定(50px から 110px 間隔)。1 ノッチ(約 100px)で 1 項目ずつ進み、
// 上の余白を削っても間隔が縮まない。最後の項目では、上の項目がヘッダーの下に少し隠れることがある。
// リストがヘッダーより上に出る前に最後の項目まで開き切るので見切れず、固定用の余白も要らない。
// 開いた項目の分だけ高さを先に確保するので、開閉でレイアウトが動かない。
// ホイール 1 ノッチで複数の項目を飛び越えても、開閉は 1 項目ずつ順に進める(最初の 1 項目は即時)。
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const STEP_MS = 300; // 項目を 1 つ進める最短間隔

export default function MissionList({ items }) {
  const [active, setActive] = useState(0);
  const [reserve, setReserve] = useState(0);
  const listRef = useRef(null);
  const targetRef = useRef(0); // スクロール位置から決まる、開きたい項目
  const activeRef = useRef(0); // いま開いている項目
  const timerRef = useRef(null);
  const n = items.length;

  // 全項目を閉じた高さ + 最も長い本文の高さ
  useEffect(() => {
    const measure = () => {
      const ul = listRef.current;
      if (!ul) return;
      const rows = [...ul.querySelectorAll('button')].reduce((sum, b) => sum + b.offsetHeight, 0);
      const bodies = [...ul.querySelectorAll('.mission-body > div')].map((d) => d.scrollHeight);
      setReserve(Math.ceil(rows + Math.max(0, ...bodies)));
    };
    measure();
    window.addEventListener('resize', measure, { passive: true });
    document.fonts?.ready.then(measure);
    return () => window.removeEventListener('resize', measure);
  }, [items]);

  // 開き始めの位置(リスト上端の画面内の高さ)と、切り替わるスクロール距離
  const range = () => {
    const ul = listRef.current;
    if (!ul) return null;
    const top = ul.getBoundingClientRect().top;
    const start = Math.min(top + window.scrollY, window.innerHeight * 0.6);
    const thresholds = Array.from({ length: n - 1 }, (_, i) => 50 + i * 110);
    return { top, start, thresholds };
  };

  // 開いている項目を、目標の項目へ 1 つずつ近づける
  const advance = () => {
    if (timerRef.current || activeRef.current === targetRef.current) return;
    activeRef.current += Math.sign(targetRef.current - activeRef.current);
    setActive(activeRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      advance();
    }, STEP_MS);
  };

  // スクロールイベントごとに目標を更新する(rAF を挟むと 1 フレーム遅れる)
  useEffect(() => {
    const update = () => {
      const r = range();
      if (!r) return;
      const d = r.start - r.top; // 開き始めの位置から上がった距離
      targetRef.current = r.thresholds.filter((t) => t <= d).length;
      advance();
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [n]);

  // 項目をクリックしたら、その項目が開くスクロール位置まで移動する
  const pick = (i) => {
    const r = range();
    if (!r) return;
    const d = i === 0 ? 0 : r.thresholds[i - 1] + 4;
    window.scrollTo({
      top: window.scrollY + r.top - (r.start - d),
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  };

  return (
    <div className="mission-area">
      <MissionFibers className="mission-fibers" />
      <ul className="mission-list" ref={listRef} style={reserve ? { minHeight: reserve } : undefined}>
      {items.map((m, i) => (
        <li key={m.title} className={i === active ? 'is-active' : ''}>
          <button type="button" aria-expanded={i === active} onClick={() => pick(i)}>
            <span className="mission-no">{String(i + 1).padStart(2, '0')}</span>
            <span className="mission-title">{m.title}</span>
          </button>
          <div className="mission-body">
            <div>{m.body.map((t) => <p key={t}>{t}</p>)}</div>
          </div>
        </li>
      ))}
      </ul>
    </div>
  );
}
