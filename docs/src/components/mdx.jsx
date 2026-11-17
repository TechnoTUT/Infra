import { Link } from 'react-router';
import { Highlight } from 'prism-react-renderer';
import Mermaid from './Mermaid.jsx';
import reposData from '../data/repos.json';

function A({ href = '', children, ...rest }) {
  if (href.startsWith('/') && !href.startsWith('//')) {
    return <Link to={href} {...rest}>{children}</Link>;
  }
  const external = /^https?:/.test(href);
  return (
    <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>
      {children}
    </a>
  );
}

function Pre({ children }) {
  const code = children?.props;
  if (!code || typeof code.children !== 'string') return <pre>{children}</pre>;
  const lang = /language-(\S+)/.exec(code.className ?? '')?.[1] ?? 'text';
  const text = code.children.replace(/\n$/, '');
  if (lang === 'mermaid') return <Mermaid code={text} />;
  // テーマ色は CSS 変数側(.token.*)で制御するので、ここでは空テーマにする
  return (
    <Highlight theme={{ plain: {}, styles: [] }} code={text} language={lang}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <pre className={`code language-${lang}`}>
          <code>
            {tokens.map((line, i) => (
              <span key={i} {...getLineProps({ line })} className="line">
                {line.map((token, k) => {
                  const { style, ...p } = getTokenProps({ token });
                  return <span key={k} {...p} />;
                })}
                {'\n'}
              </span>
            ))}
          </code>
        </pre>
      )}
    </Highlight>
  );
}

export function Admonition({ type = 'note', title, children }) {
  return (
    <div className={`admonition admonition-${type}`}>
      <div className="admonition-title">{title ?? type.toUpperCase()}</div>
      {children}
    </div>
  );
}

export function RepoCard({ repo, href, description, languages }) {
  const meta = reposData[repo] ?? {};
  const url = href ?? `https://github.com/${repo}`;
  const [owner, name] = repo.includes('/') ? repo.split('/', 2) : ['', repo];
  const desc = description ?? meta.description;
  const langs = languages ?? meta.languages ?? [];
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="repo-card">
      <div className="repo-card-content">
        <div className="repo-card-header">
          <div className="repo-card-name">
            {owner && <span className="repo-card-owner">{owner}/</span>}
            <strong>{name}</strong>
          </div>
          <svg className="repo-card-icon" viewBox="0 0 16 16" width="24" height="24" aria-hidden="true" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
          </svg>
        </div>
        {desc && <p className="repo-card-desc">{desc}</p>}
        {langs.length > 0 && (
          <ul className="repo-card-langs">
            {langs.slice(0, 5).map((l) => (
              <li key={l.name}>
                <span className="repo-card-dot" style={{ backgroundColor: l.color }} />
                <span>{l.name}</span>
                <span className="repo-card-pct">{l.pct}%</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {langs.length > 0 && (
        <div className="repo-card-bar" aria-hidden="true">
          {langs.map((l) => (
            <span key={l.name} style={{ width: `${l.pct}%`, backgroundColor: l.color }} title={`${l.name} ${l.pct}%`} />
          ))}
        </div>
      )}
    </a>
  );
}

export default { a: A, pre: Pre, Admonition, RepoCard };
