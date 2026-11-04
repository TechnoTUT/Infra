import { Link, Outlet, useLocation } from 'react-router';
import { pageByPath, sectionPages, sectionStart } from '../content.js';
import { site } from '../site.config.js';
import Search from './Search.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export default function Layout() {
  const { pathname } = useLocation();
  const key = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
  const current = pageByPath.get(key);
  const section = current?.section ?? null;
  const items = section ? sectionPages(section) : [];

  return (
    <>
      <header className="navbar">
        <Link to="/" className="brand">
          <img src={site.logo} alt="TechnoTUT Logo" height="32" />
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
      <div className={'main' + (items.length ? ' has-sidebar' : '')}>
        {items.length > 0 && (
          <aside className="sidebar">
            <ul>
              {items.map((p) => (
                <li key={p.path}>
                  <Link to={p.path} className={p.path === key ? 'active' : ''}>{p.title}</Link>
                </li>
              ))}
            </ul>
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
