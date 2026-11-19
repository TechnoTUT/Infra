import { useEffect, useRef } from 'react';

// 光ファイバ内を流れる光。タグラインの下を、画面の左外から右外へ緩やかな曲線を描いて流れる細い束。
// WDM(波長多重)を模して、1本のファイバ上を異なる波長(色)の光が同時に流れる。
// 負荷を抑えるため、光は帯(ポリゴン)+グラデーション1回で描き、静的な部分は一度だけ描画する。
const FIBERS = 9;
const SAMPLES = 160;
const FPS = 60;
// WDM チャネル(色相)。可視光の波長順 = 赤→紫
const CHANNELS = [352, 14, 38, 58, 120, 165, 190, 212, 250, 285];

const rand = (a, b) => a + Math.random() * (b - a);
// 遠近スケール: u=0(奥) → 小さく細く暗い / u=1(手前) → 大きく太く明るい
const scale = (u) => 0.8 + 0.3 * Math.sin(u * Math.PI); // 中央付近がわずかに太い

function bezier(p0, p1, p2, p3, u) {
  const m = 1 - u;
  return [
    m * m * m * p0[0] + 3 * m * m * u * p1[0] + 3 * m * u * u * p2[0] + u * u * u * p3[0],
    m * m * m * p0[1] + 3 * m * m * u * p1[1] + 3 * m * u * u * p2[1] + u * u * u * p3[1],
  ];
}

// 1本の中心線を作り、各ファイバはその法線方向に少しずつずらして細い束にする。
// baseY: 束を通す高さ(タグラインの下)
function buildFibers(w, h, baseY) {
  const p0 = [-w * 0.08, baseY + h * 0.02];
  const p1 = [w * 0.3, baseY - h * 0.035];
  const p2 = [w * 0.7, baseY + h * 0.035];
  const p3 = [w * 1.08, baseY - h * 0.01];
  const far = p0;
  const center = [];
  for (let k = 0; k <= SAMPLES; k++) center.push(bezier(p0, p1, p2, p3, k / SAMPLES));
  const K = Math.max(8, w / 160);
  const fibers = [];
  for (let i = 0; i < FIBERS; i++) {
    const lat = (i / (FIBERS - 1) - 0.5) * 2 + rand(-0.08, 0.08);
    const pts = [];
    const cum = [0];
    for (let k = 0; k <= SAMPLES; k++) {
      const a = center[Math.max(0, k - 1)];
      const b = center[Math.min(SAMPLES, k + 1)];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const off = lat * K * scale(k / SAMPLES);
      const x = center[k][0] - ((b[1] - a[1]) / d) * off;
      const y = center[k][1] + ((b[0] - a[0]) / d) * off;
      pts.push([x, y]);
      if (k) cum.push(cum[k - 1] + Math.hypot(x - pts[k - 1][0], y - pts[k - 1][1]));
    }
    fibers.push({ pts, cum, length: cum[SAMPLES] });
  }
  return { fibers, far };
}

// 弧長 s の位置 [x, y, 法線x, 法線y, u]
function pointAt(f, s) {
  const { cum, pts, length } = f;
  const c = Math.min(Math.max(s, 0), length);
  let lo = 0;
  let hi = SAMPLES;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= c) lo = mid;
    else hi = mid;
  }
  const seg = cum[hi] - cum[lo] || 1;
  const r = (c - cum[lo]) / seg;
  const dx = (pts[hi][0] - pts[lo][0]) / seg;
  const dy = (pts[hi][1] - pts[lo][1]) / seg;
  return [pts[lo][0] + dx * seg * r, pts[lo][1] + dy * seg * r, -dy, dx, c / length];
}

// 同一ファイバ・同一速度で、複数の波長が束になって流れる
function makeGroup(fibers, initial) {
  const fi = Math.floor(Math.random() * fibers.length);
  const n = 2 + Math.floor(Math.random() * 3);
  const start = Math.floor(Math.random() * CHANNELS.length);
  const chans = Array.from({ length: n }, (_, k) => (start + k * 2) % CHANNELS.length);
  return {
    fi,
    pos: initial ? rand(0, fibers[fi].length) : -rand(0, 400),
    speed: rand(0.6, 1.1),
    len: rand(0.07, 0.15), // 尾の長さ(ファイバ全長に対する比率)
    lights: chans.map((c, k) => ({ hue: CHANNELS[c], lane: (c - CHANNELS.length / 2) * 1.4, off: k * rand(10, 40) })),
  };
}

function makeSprite(hue) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, `hsla(${hue},100%,95%,.95)`);
  g.addColorStop(0.3, `hsla(${hue},100%,60%,.5)`);
  g.addColorStop(1, `hsla(${hue},100%,50%,0)`);
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  return c;
}

export default function FiberCanvas({ className }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const layer = document.createElement('canvas'); // 静的な背景(遠方の光源 + ファイバ本体)
    const lctx = layer.getContext('2d');
    const sprites = new Map(CHANNELS.map((hue) => [hue, makeSprite(hue)]));
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    let w = 0;
    let h = 0;
    let dpr = 1;
    let fibers = [];
    let groups = [];
    let raf = 0;
    let last = 0;
    let visible = true;
    const mouse = { x: 0, y: 0, sx: 0, sy: 0 };

    function drawStatic() {
      const c = lctx;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, w, h);
      // 不透明なグレーで描く(半透明を重ねると継ぎ目で濃くなるため)。太い方を先に全部、細い芯を後から。
      c.lineCap = 'round';
      c.lineJoin = 'round';
      const gray = (v) => `rgb(${Math.round(255 * v)},${Math.round(255 * v)},${Math.round(255 * v)})`;
      for (const f of fibers) {
        for (const pass of [0, 1]) {
          for (let k = 1; k <= SAMPLES; k++) {
            const sc = scale(k / SAMPLES);
            c.beginPath();
            c.moveTo(f.pts[k - 1][0], f.pts[k - 1][1]);
            c.lineTo(f.pts[k][0], f.pts[k][1]);
            c.strokeStyle = pass ? gray(0.05 + 0.07 * sc) : gray(0.015 + 0.02 * sc);
            c.lineWidth = pass ? 0.5 + 1.2 * sc : 5 * sc;
            c.stroke();
          }
        }
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = layer.width = Math.round(w * dpr);
      canvas.height = layer.height = Math.round(h * dpr);
      // タグラインとリンク(スマホでは下の行に回り込む)のうち低い方の下を通す
      const box = canvas.getBoundingClientRect();
      const bottoms = ['.hero-tagline', '.hero-link']
        .map((q) => document.querySelector(q)?.getBoundingClientRect().bottom)
        .filter((v) => v != null);
      const baseY = bottoms.length ? Math.max(...bottoms) - box.top + Math.max(36, h * 0.05) : h * 0.88;
      const built = buildFibers(w, h, baseY);
      fibers = built.fibers;
      drawStatic();
      groups = Array.from({ length: Math.round(Math.min(12, Math.max(5, w / 110))) }, () => makeGroup(fibers, true));
      draw();
    }

    // 光 = 先端が太く尾が細い帯を、先端→尾のグラデーションで塗る(線分の継ぎ目が出ない)
    function ribbon(pts, wMul, wAdd) {
      const M = pts.length - 1;
      ctx.beginPath();
      for (let k = 0; k <= M; k++) {
        const [x, y, nx, ny, sc] = pts[k];
        const hw = ((wMul * sc + wAdd) / 2) * (1 - 0.9 * (k / M));
        ctx.lineTo(x + nx * hw, y + ny * hw);
      }
      for (let k = M; k >= 0; k--) {
        const [x, y, nx, ny, sc] = pts[k];
        const hw = ((wMul * sc + wAdd) / 2) * (1 - 0.9 * (k / M));
        ctx.lineTo(x - nx * hw, y - ny * hw);
      }
      ctx.closePath();
    }

    function fade(pts, hue, light, alpha) {
      const a = pts[0];
      const b = pts[pts.length - 1];
      const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
      g.addColorStop(0, `hsla(${hue},100%,${light}%,${alpha})`);
      g.addColorStop(0.35, `hsla(${hue},100%,${light}%,${alpha * 0.45})`);
      g.addColorStop(0.7, `hsla(${hue},100%,${light}%,${alpha * 0.12})`);
      g.addColorStop(1, `hsla(${hue},100%,${light}%,0)`);
      return g;
    }

    function drawLight(f, head, tail, light) {
      const { hue, lane } = light;
      const M = 14;
      const pts = [];
      for (let k = 0; k <= M; k++) {
        const p = pointAt(f, head - (head - tail) * (k / M));
        const sc = scale(p[4]);
        pts.push([p[0] + p[2] * lane * sc, p[1] + p[3] * lane * sc, p[2], p[3], sc]);
      }
      const sc = pts[0][4];
      if (Math.hypot(pts[0][0] - pts[M][0], pts[0][1] - pts[M][1]) < 1) return;
      const b = Math.min(1, 0.25 + sc);
      ctx.fillStyle = fade(pts, hue, 55, 0.2 * b);
      ribbon(pts, 9, 1);
      ctx.fill();
      ctx.fillStyle = fade(pts, hue, 78, 0.85 * b);
      ribbon(pts, 1.6, 0.4);
      ctx.fill();
      const r = 14 * sc + 3;
      ctx.globalAlpha = 0.8;
      ctx.drawImage(sprites.get(hue), pts[0][0] - r, pts[0][1] - r, r * 2, r * 2);
      ctx.globalAlpha = 1;
    }

    function draw() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, mouse.sx * -16 * dpr, mouse.sy * -9 * dpr);
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(layer, 0, 0, w, h);
      ctx.lineCap = 'round';
      for (const g of groups) {
        const f = fibers[g.fi];
        const tailLen = g.len * f.length;
        for (const light of g.lights) {
          const head = g.pos - light.off;
          if (head < 0 || head - tailLen > f.length) continue;
          drawLight(f, head, Math.max(0, head - tailLen), light);
        }
      }
    }

    function tick(now) {
      raf = requestAnimationFrame(tick);
      if (!visible || now - last < 1000 / FPS - 2) return;
      const dt = Math.min(0.1, (now - last) / 1000 || 0);
      last = now;
      mouse.sx += (mouse.x - mouse.sx) * Math.min(1, dt * 3);
      mouse.sy += (mouse.y - mouse.sy) * Math.min(1, dt * 3);
      for (let i = 0; i < groups.length; i++) {
        const g = groups[i];
        const f = fibers[g.fi];
        // 手前ほど速く(遠近)
        g.pos += g.speed * f.length * 0.2 * dt;
        if (g.pos - 120 - g.len * f.length > f.length) groups[i] = makeGroup(fibers, false);
      }
      draw();
    }

    function start() {
      cancelAnimationFrame(raf);
      if (!reduce.matches) raf = requestAnimationFrame((t) => { last = t; tick(t); });
      else draw();
    }

    function onMove(e) {
      mouse.x = e.clientX / window.innerWidth - 0.5;
      mouse.y = e.clientY / window.innerHeight - 0.5;
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; });
    io.observe(canvas);
    window.addEventListener('pointermove', onMove, { passive: true });
    reduce.addEventListener('change', start);
    resize();
    start();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      reduce.removeEventListener('change', start);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
