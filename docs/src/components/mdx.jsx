import { Link } from 'react-router';
import { Highlight } from 'prism-react-renderer';
import Mermaid from './Mermaid.jsx';

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

export default { a: A, pre: Pre, Admonition };
