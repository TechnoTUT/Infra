import { useEffect, useRef } from 'react';

// Our Mission の右横の演出。画面外の上から降りて、緩やかな曲線を描いて画面外の右へ抜ける細いファイバの束。
// 形は固定(スクロールでは伸縮しない)で、波長ごとの色の光だけが流れる。
const FIBERS = 7;
const N = 140;
const FPS = 30;
const HUES = [352, 14, 38, 58, 120, 165, 190, 212, 250, 285];
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const sc = (u) => 0.55 + 1.3 * u ** 1.2; // 先へ行くほど手前に来て太く明るい

function bezier(p0, p1, p2, p3, u) {
  const m = 1 - u;
  return [
    m * m * m * p0[0] + 3 * m * m * u * p1[0] + 3 * m * u * u * p2[0] + u * u * u * p3[0],
    m * m * m * p0[1] + 3 * m * m * u * p1[1] + 3 * m * u * u * p2[1] + u * u * u * p3[1],
  ];
}

function build(w, h) {
  const p0 = [w * 0.02, -h * 0.08];
  const p1 = [w * 0.26, h * 0.3];
  const p2 = [w * 0.62, h * 0.56];
  const p3 = [w * 1.1, h * 0.7];
  const center = Array.from({ length: N + 1 }, (_, k) => bezier(p0, p1, p2, p3, k / N));
  const K = Math.max(7, w / 70);
  return Array.from({ length: FIBERS }, (_, i) => {
    const lat = (i / (FIBERS - 1) - 0.5) * 2;
    return center.map((c, k) => {
      const a = center[Math.max(0, k - 1)];
      const b = center[Math.min(N, k + 1)];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const nx = -(b[1] - a[1]) / d;
      const ny = (b[0] - a[0]) / d;
      const off = lat * K * sc(k / N);
      return [c[0] + nx * off, c[1] + ny * off, nx, ny];
    });
  });
}

// 曲線上の位置 u(0..1) の [x, y, nx, ny]
function at(f, u) {
  const t = clamp(u, 0, 1) * N;
  const i = Math.min(N - 1, Math.floor(t));
  const r = t - i;
  const a = f[i];
  const b = f[i + 1];
  return [a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r, a[2], a[3]];
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

// 先頭(配列の先頭)から尾へ細くなる帯
function ribbon(c, pts, wMul, wAdd) {
  const M = pts.length - 1;
  c.beginPath();
  for (let k = 0; k <= M; k++) {
    const [x, y, nx, ny, s] = pts[k];
    const hw = ((wMul * s + wAdd) / 2) * (1 - 0.9 * (k / M));
    c.lineTo(x + nx * hw, y + ny * hw);
  }
  for (let k = M; k >= 0; k--) {
    const [x, y, nx, ny, s] = pts[k];
    const hw = ((wMul * s + wAdd) / 2) * (1 - 0.9 * (k / M));
    c.lineTo(x - nx * hw, y - ny * hw);
  }
  c.closePath();
}

export default function MissionFibers({ className }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const layer = document.createElement('canvas'); // ファイバ本体(静的)のキャッシュ
    const lctx = layer.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const sprites = new Map(HUES.map((hue) => [hue, makeSprite(hue)]));
    let w = 0;
    let h = 0;
    let dpr = 1;
    let fibers = [];
    let raf = 0;
    let last = 0;
    let visible = true;
    const pulses = Array.from({ length: 10 }, (_, i) => ({
      fi: i % FIBERS, u: rand(0, 1.2), speed: rand(0.16, 0.34), len: rand(0.08, 0.16), hue: HUES[Math.floor(Math.random() * HUES.length)],
    }));

    function drawStatic() {
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lctx.clearRect(0, 0, w, h);
      // 太く薄い帯 + 細い芯
      for (const [wMul, wAdd, a] of [[5, 0, 0.04], [1.2, 0.5, 0.17]]) {
        lctx.fillStyle = `rgba(255,255,255,${a})`;
        for (const f of fibers) {
          const pts = [];
          for (let k = N; k >= 0; k -= 2) pts.push([f[k][0], f[k][1], f[k][2], f[k][3], sc(k / N)]);
          ribbon(lctx, pts, wMul, wAdd);
          lctx.fill();
        }
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      // 狭い画面では非表示(display: none)で大きさが 0 になる。0 のキャンバスを drawImage すると
      // iOS Safari は例外を投げ、React ツリーごと落ちてページが真っ白になるので描画しない
      if (!w || !h) return;
      canvas.width = layer.width = Math.round(w * dpr);
      canvas.height = layer.height = Math.round(h * dpr);
      fibers = build(w, h);
      drawStatic();
      draw();
    }

    function fade(a, b, hue, light, alpha) {
      const gr = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
      gr.addColorStop(0, `hsla(${hue},100%,${light}%,${alpha})`);
      gr.addColorStop(0.35, `hsla(${hue},100%,${light}%,${alpha * 0.45})`);
      gr.addColorStop(0.7, `hsla(${hue},100%,${light}%,${alpha * 0.12})`);
      gr.addColorStop(1, `hsla(${hue},100%,${light}%,0)`);
      return gr;
    }

    function draw() {
      if (!layer.width || !layer.height) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(layer, 0, 0);
      if (reduce.matches) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const p of pulses) {
        const f = fibers[p.fi];
        const head = Math.min(p.u, 1);
        const tail = Math.max(0, p.u - p.len);
        if (head - tail < 0.01) continue;
        const pts = [];
        for (let k = 0; k <= 12; k++) {
          const u = head - (head - tail) * (k / 12);
          const q = at(f, u);
          pts.push([q[0], q[1], q[2], q[3], sc(u)]);
        }
        const b = Math.min(1, 0.3 + sc(head));
        ctx.fillStyle = fade(pts[0], pts[12], p.hue, 55, 0.22 * b);
        ribbon(ctx, pts, 8, 1);
        ctx.fill();
        ctx.fillStyle = fade(pts[0], pts[12], p.hue, 78, 0.9 * b);
        ribbon(ctx, pts, 1.5, 0.4);
        ctx.fill();
        const r = 12 * sc(head) + 3;
        ctx.globalAlpha = 0.8;
        ctx.drawImage(sprites.get(p.hue), pts[0][0] - r, pts[0][1] - r, r * 2, r * 2);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }

    function tick(now) {
      raf = requestAnimationFrame(tick);
      if (!visible || now - last < 1000 / FPS - 2) return;
      const dt = Math.min(0.1, (now - last) / 1000 || 0);
      last = now;
      for (const p of pulses) {
        p.u += p.speed * dt;
        if (p.u - p.len > 1) {
          p.u = -rand(0, 0.5);
          p.fi = Math.floor(Math.random() * FIBERS);
          p.hue = HUES[Math.floor(Math.random() * HUES.length)];
        }
      }
      draw();
    }

    function start() {
      cancelAnimationFrame(raf);
      if (!reduce.matches) raf = requestAnimationFrame((t) => { last = t; tick(t); });
      else draw();
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; });
    io.observe(canvas);
    reduce.addEventListener('change', start);
    resize();
    start();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      reduce.removeEventListener('change', start);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
