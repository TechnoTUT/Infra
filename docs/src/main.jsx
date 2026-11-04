import { hydrateRoot, createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App.jsx';
import './styles.css';

const root = document.getElementById('root');
const tree = (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
// 本番はプリレンダリング済み HTML を hydrate、dev は通常 render
if (root.hasChildNodes()) hydrateRoot(root, tree);
else createRoot(root).render(tree);
