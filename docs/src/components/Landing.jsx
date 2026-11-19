import { Link } from 'react-router';
import { site } from '../site.config.js';
import SiteHeader from './SiteHeader.jsx';
import FiberCanvas from './FiberCanvas.jsx';

// トップページ = ランディングのみ(hero 1画面)
export default function Landing() {
  return (
    <>
      <SiteHeader home />
      <section className="hero">
        <img src="/img/hero.png" alt="" className="hero-bg" fetchPriority="high" decoding="async" />
        <FiberCanvas className="hero-canvas" />
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-inner">
          <div className="hero-text">
            <h1 className="hero-title">TechnoTUT Network</h1>
            <p className="hero-tagline">{site.tagline}</p>
          </div>
          <Link to="/about" className="hero-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
              <path d="M3 12h18M14 5l7 7-7 7" />
            </svg>
            About our Network
          </Link>
        </div>
      </section>
    </>
  );
}
