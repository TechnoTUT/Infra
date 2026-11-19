import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { sectionStart } from '../content.js';
import { site } from '../site.config.js';
import Logo from './Logo.jsx';
import Search from './Search.jsx';
import ThemeToggle from './ThemeToggle.jsx';

// ナビ(リンク / ハンバーガー / ドロワー)は technotut.net の HeaderNav に合わせる。
// active: 現在のタブ(section id)。home: ランディング用(hero に重ねる透過ヘッダー)
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
    <header className={'navbar' + (home ? ' navbar-home' : '') + (open ? ' is-open' : '')}>
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
        <a href={site.github} className="nav-gh">GitHub</a>
        {!home && <div className="nav-tools"><ThemeToggle /></div>}
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
            {!home && <ThemeToggle />}
            <a href={site.github} className="mobile-gh">GitHub</a>
          </div>
        </div>
      )}
    </header>
  );
}
