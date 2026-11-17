import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router';
import { pages, pageByPath } from './content.js';
import { site } from './site.config.js';
import Layout from './components/Layout.jsx';
import DocPage from './components/DocPage.jsx';
import DiagramPage from './components/DiagramPage.jsx';
import NotFound from './components/NotFound.jsx';

const EXTRA_TITLES = {
  '/diagram': '会場内ネットワークの全体像',
};

function useDocumentTitle() {
  const { pathname } = useLocation();
  const key = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
  const page = pageByPath.get(key);
  const title = page?.title ?? EXTRA_TITLES[key];
  useEffect(() => {
    document.title = title ? `${title} | ${site.title}` : `Page Not Found | ${site.title}`;
  }, [title]);
}

function useScroll() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
}

export default function App() {
  useDocumentTitle();
  useScroll();
  return (
    <Routes>
      <Route path="/diagram" element={<DiagramPage />} />
      <Route element={<Layout />}>
        {pages.map((p) => (
          <Route key={p.path} path={p.path} element={<DocPage page={p} />} />
        ))}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
