export default function ThemeToggle() {
  const toggle = () => {
    const el = document.documentElement;
    const next = el.dataset.theme === 'dark' ? 'light' : 'dark';
    el.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch {}
    window.dispatchEvent(new Event('themechange'));
  };
  // アイコンは CSS で切り替える(SSR/hydration のずれ防止)
  return (
    <button className="theme-toggle" onClick={toggle} aria-label="Toggle dark mode">
      <span className="only-light">☀️</span>
      <span className="only-dark">🌙</span>
    </button>
  );
}
