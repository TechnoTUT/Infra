import { useEffect, useId, useState } from 'react';

export default function Mermaid({ code }) {
  const id = 'mmd' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const [svg, setSvg] = useState('');
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const read = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
    read();
    window.addEventListener('themechange', read);
    return () => window.removeEventListener('themechange', read);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { default: mermaid } = await import('mermaid');
      mermaid.initialize({ startOnLoad: false, theme: theme === 'dark' ? 'dark' : 'default' });
      try {
        const { svg } = await mermaid.render(id + theme, code);
        if (!cancelled) setSvg(svg);
      } catch (e) {
        if (!cancelled) setSvg(`<pre>${String(e.message).replace(/</g, '&lt;')}</pre>`);
      }
    })();
    return () => { cancelled = true; };
  }, [code, theme, id]);

  return <div className="mermaid" dangerouslySetInnerHTML={{ __html: svg }} />;
}
