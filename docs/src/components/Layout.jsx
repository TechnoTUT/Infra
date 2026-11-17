import { Link, Outlet, useLocation } from 'react-router';
import { pageByPath, sectionGroups, sectionPages, sectionStart } from '../content.js';
import { site } from '../site.config.js';
import Logo from './Logo.jsx';
import Search from './Search.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export default function Layout() {
  const { pathname } = useLocation();
  const key = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
  const current = pageByPath.get(key);
  const section = current?.section ?? null;
  // 1ページだけのセクションではサイドバーを出さない
  const all = section ? sectionPages(section) : [];
  const groups = all.length > 1 ? sectionGroups(section) : [];

  return (
    <>
      <header className="navbar">
        <Link to="/" className="brand">
          <Logo height={32} />
          <strong>{site.navTitle}</strong>
        </Link>
        <nav className="nav-links">
          {site.sections.map((s) => (
            <Link key={s.id} to={sectionStart(s.id)} className={s.id === section ? 'active' : ''}>
              {s.label}
            </Link>
          ))}
        </nav>
        <div className="nav-right">
          <Search />
          <a href={site.github} className="nav-gh">GitHub</a>
          <ThemeToggle />
        </div>
      </header>
      <div className={'main' + (groups.length ? ' has-sidebar' : '')}>
        {groups.length > 0 && (
          <aside className="sidebar">
            {groups.map((g, i) => (
              <div key={g.label ?? i} className="sidebar-group">
                {g.label && <div className="sidebar-group-title">{g.label}</div>}
                <ul>
                  {g.pages.map((p) => (
                    <li key={p.path}>
                      <Link to={p.path} className={p.path === key ? 'active' : ''}>{p.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </aside>
        )}
        <main className="content">
          <Outlet />
        </main>
      </div>
      <footer className="footer">
        <div className="footer-links">
          {site.footerLinks.map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
        </div>
        <div>Copyright © {new Date().getFullYear()} TechnoTUT.</div>
      </footer>
    </>
  );
}
