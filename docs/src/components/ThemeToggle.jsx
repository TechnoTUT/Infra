import { useEffect, useState } from 'react';

const Sun = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
const Moon = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);

export default function ThemeToggle() {
  // SSR 時点ではテーマ不明なので、マウント後に実際の値を読む(見た目は CSS 側で切替)
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.dataset.theme === 'dark'), []);

  const toggle = () => {
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch {}
    setDark(!dark);
    window.dispatchEvent(new Event('themechange'));
  };

  return (
    <button type="button" role="switch" aria-checked={dark} aria-label="ダークモード" className="theme-switch" onClick={toggle}>
      <span className="ts-icon ts-sun"><Sun /></span>
      <span className="ts-icon ts-moon"><Moon /></span>
      <span className="ts-knob" />
    </button>
  );
}
