import { Link } from 'react-router';
import { sectionPages, editUrl } from '../content.js';
import mdxComponents from './mdx.jsx';

export default function DocPage({ page }) {
  const { Component } = page;
  const siblings = page.section ? sectionPages(page.section) : [];
  const i = siblings.indexOf(page);
  const prev = i > 0 ? siblings[i - 1] : null;
  const next = i >= 0 && i < siblings.length - 1 ? siblings[i + 1] : null;
  return (
    <>
      <article className="markdown">
        <h1>{page.title}</h1>
        <Component components={mdxComponents} />
      </article>
      <div className="edit"><a href={editUrl(page)}>Edit this page</a></div>
      {(prev || next) && (
        <nav className="pager">
          {prev ? <Link to={prev.path}><small>前へ</small><span>« {prev.label}</span></Link> : <span />}
          {next ? <Link to={next.path} className="next"><small>次へ</small><span>{next.label} »</span></Link> : <span />}
        </nav>
      )}
    </>
  );
}
