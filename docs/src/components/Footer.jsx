import { site } from '../site.config.js';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-links">
        {site.footerLinks.map((l) => (
          <a key={l.href} href={l.href}>{l.label}</a>
        ))}
      </div>
      <div>Copyright © {new Date().getFullYear()} TechnoTUT.</div>
    </footer>
  );
}
