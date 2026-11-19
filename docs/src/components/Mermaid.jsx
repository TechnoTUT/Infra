import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';

const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
const STEP_SCALE = 0.25;

function clampScale(value) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(value * 100) / 100));
}

function DiagramCanvas({ svg, allowWheelZoom = false, toolbarExtra = null }) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(null);
  const stageRef = useRef(null);

  const reset = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const zoomBy = useCallback((delta) => {
    setScale((prev) => clampScale(prev + delta));
  }, []);

  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX - offset.x,
      startY: e.clientY - offset.y,
    };
    setDragging(true);
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current) return;
    setOffset({
      x: e.clientX - dragRef.current.startX,
      y: e.clientY - dragRef.current.startY,
    });
  };

  const handlePointerUp = (e) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  useEffect(() => {
    const el = stageRef.current;
    if (!el || !allowWheelZoom) return;
    const onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? STEP_SCALE : -STEP_SCALE;
      setScale((prev) => clampScale(prev + delta));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [allowWheelZoom]);

  const isModified = scale !== 1 || offset.x !== 0 || offset.y !== 0;

  return (
    <>
      <div className="mermaid-toolbar" role="toolbar" aria-label="図の拡大縮小">
        <button
          type="button"
          className="mermaid-btn"
          onClick={() => zoomBy(-STEP_SCALE)}
          disabled={scale <= MIN_SCALE}
          title="縮小"
          aria-label="縮小"
        >
          −
        </button>
        <span className="mermaid-zoom-label">{Math.round(scale * 100)}%</span>
        <button
          type="button"
          className="mermaid-btn"
          onClick={() => zoomBy(STEP_SCALE)}
          disabled={scale >= MAX_SCALE}
          title="拡大"
          aria-label="拡大"
        >
          ＋
        </button>
        <button
          type="button"
          className="mermaid-btn"
          onClick={reset}
          disabled={!isModified}
          title="表示をリセット"
        >
          リセット
        </button>
        {toolbarExtra}
      </div>
      <div
        ref={stageRef}
        className={`mermaid-stage${dragging ? ' is-dragging' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className="mermaid-inner"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </>
  );
}

export default function Mermaid({ code, fullPage = false, backTo = '/', fullPageTo = null, forceTheme = null }) {
  const id = 'mmd' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const [svg, setSvg] = useState('');
  const [theme, setTheme] = useState(forceTheme ?? 'light');
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (forceTheme) return undefined; // 暗色固定ページなどでテーマ追従を止める
    const read = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
    read();
    window.addEventListener('themechange', read);
    return () => window.removeEventListener('themechange', read);
  }, [forceTheme]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { default: mermaid } = await import('mermaid');
      mermaid.initialize({ startOnLoad: false, theme: theme === 'dark' ? 'dark' : 'default' });
      try {
        const { svg } = await mermaid.render(id + theme, code);
        if (!cancelled) setSvg(svg);
      } catch (e) {
        if (!cancelled) setSvg(`<pre>${String(e.message).replace(/</g, '&lt;')}</pre>`);
      }
    })();
    return () => { cancelled = true; };
  }, [code, theme, id]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [fullscreen]);

  if (fullPage) {
    return (
      <div className="mermaid-fullpage">
        <DiagramCanvas
          svg={svg}
          allowWheelZoom
          toolbarExtra={
            <Link to={backTo} className="mermaid-btn mermaid-back-link">
              ← About に戻る
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <>
      <div className="mermaid">
        <DiagramCanvas
          svg={svg}
          toolbarExtra={
            fullPageTo ? (
              <Link
                to={fullPageTo}
                className="mermaid-btn mermaid-back-link"
                title="全画面で表示"
                aria-label="全画面で表示"
              >
                全画面
              </Link>
            ) : (
              <button
                type="button"
                className="mermaid-btn"
                onClick={() => setFullscreen(true)}
                title="全画面で表示"
                aria-label="全画面で表示"
              >
                全画面
              </button>
            )
          }
        />
      </div>
      {fullscreen && (
        <div
          className="mermaid-modal"
          role="dialog"
          aria-modal="true"
          aria-label="図の全画面表示"
          onClick={(e) => {
            if (e.target === e.currentTarget) setFullscreen(false);
          }}
        >
          <div className="mermaid-modal-body">
            <DiagramCanvas
              svg={svg}
              allowWheelZoom
              toolbarExtra={
                <button
                  type="button"
                  className="mermaid-btn"
                  onClick={() => setFullscreen(false)}
                  title="閉じる (Esc)"
                  aria-label="閉じる"
                >
                  閉じる
                </button>
              }
            />
          </div>
        </div>
      )}
    </>
  );
}
