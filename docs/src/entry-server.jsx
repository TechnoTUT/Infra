import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import App from './App.jsx';
import { pages, pageByPath } from './content.js';
import { site } from './site.config.js';

const EXTRA_TITLES = {
  '/': site.title,
  '/diagram': '会場内ネットワークの全体像',
};

export const routes = ['/', ...pages.map((p) => p.path), '/diagram'];

export function titleFor(url) {
  const page = pageByPath.get(url);
  const title = page?.title ?? EXTRA_TITLES[url];
  if (url === '/') return site.title;
  return title ? `${title} | ${site.title}` : `Page Not Found | ${site.title}`;
}

export function render(url) {
  return renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>,
  );
}
