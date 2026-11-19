import { Link, Outlet, useLocation } from 'react-router';
import { pageByPath, sectionGroups, sectionPages } from '../content.js';

import SiteHeader from './SiteHeader.jsx';
import Footer from './Footer.jsx';

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
      <SiteHeader active={section} />
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
      <Footer />
    </>
  );
}
