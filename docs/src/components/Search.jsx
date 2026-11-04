import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { loadIndex, snippet } from '../search.js';

export default function Search() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    let stale = false;
    loadIndex().then((idx) => {
      if (!stale) setResults(idx.search(q).slice(0, 8));
    });
    return () => { stale = true; };
  }, [q]);

  useEffect(() => {
    const close = (e) => { if (!box.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="search" ref={box}>
      <input
        type="search"
        placeholder="検索"
        aria-label="検索"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
      />
      {open && q.trim() && (
        <ul className="search-results">
          {results.length === 0 && <li className="empty">見つかりませんでした</li>}
          {results.map((r) => (
            <li key={r.id}>
              <Link to={r.path} onClick={() => { setOpen(false); setQ(''); }}>
                <strong>{r.title}</strong>
                <span>{snippet(r.body, q)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
