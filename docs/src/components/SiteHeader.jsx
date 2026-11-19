import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { sectionStart } from '../content.js';
import { site } from '../site.config.js';
import Logo from './Logo.jsx';
import Search from './Search.jsx';

// ナビ(リンク / ハンバーガー / ドロワー)は technotut.net の HeaderNav に合わせる。
// 全ページ共通のヘッダー(暗色固定)。active: 現在のタブ(section id)。home: ランディング用(hero に重ねる・検索なし)
export default function SiteHeader({ active, home = false }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && close();
    const onResize = () => window.innerWidth >= 768 && close();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  const items = site.sections.map((s) => ({ ...s, to: s.href ?? sectionStart(s.id) }));

  return (
    <header className={'navbar navbar-top' + (home ? ' is-overlay' : '') + (open ? ' is-open' : '')}>
      <Link to="/" className="brand" aria-label="TechnoTUT Home" onClick={close}>
        <Logo />
      </Link>
      <nav className="nav-links" aria-label="Main Navigation">
        {items.map((s) => (
          <Link key={s.id} to={s.to} className={s.id === active ? 'active' : ''}>
            {s.label}
          </Link>
        ))}
      </nav>
      <div className="nav-right">
        {!home && <div className="nav-tools"><Search /></div>}
        <a href={site.github} className="nav-gh" aria-label="GitHub" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 16 16" width="24" height="24" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
          </svg>
        </a>
        <button
          type="button"
          className={'hamburger-btn' + (open ? ' is-active' : '')}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? 'メニューを閉じる' : 'メニューを開く'}
          onClick={() => setOpen(!open)}
        >
          <span className="hamburger-line" aria-hidden="true" />
          <span className="hamburger-line" aria-hidden="true" />
          <span className="hamburger-line" aria-hidden="true" />
        </button>
      </div>
      {open && (
        <div id="mobile-navigation" className="mobile-drawer" aria-label="Mobile Navigation">
          <nav>
            {items.map((s) => (
              <Link key={s.id} to={s.to} className={'mobile-link' + (s.id === active ? ' active' : '')} onClick={close}>
                <span>{s.label}</span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </nav>
          <div className="mobile-tools">
            {!home && <Search />}
            <a href={site.github} className="mobile-gh">GitHub</a>
          </div>
        </div>
      )}
    </header>
  );
}
