import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router';
import { pages, pageByPath } from './content.js';
import { site } from './site.config.js';
import Layout from './components/Layout.jsx';
import DocPage from './components/DocPage.jsx';
import NotFound from './components/NotFound.jsx';

function useDocumentTitle() {
  const { pathname } = useLocation();
  const key = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
  const page = pageByPath.get(key);
  useEffect(() => {
    document.title = page ? `${page.title} | ${site.title}` : `Page Not Found | ${site.title}`;
  }, [page]);
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
      <Route element={<Layout />}>
        {pages.map((p) => (
          <Route key={p.path} path={p.path} element={<DocPage page={p} />} />
        ))}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
