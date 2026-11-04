import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import App from './App.jsx';
import { pages, pageByPath } from './content.js';
import { site } from './site.config.js';

export const routes = pages.map((p) => p.path);

export function titleFor(url) {
  const page = pageByPath.get(url);
  return page ? `${page.title} | ${site.title}` : `Page Not Found | ${site.title}`;
}

export function render(url) {
  return renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>,
  );
}
