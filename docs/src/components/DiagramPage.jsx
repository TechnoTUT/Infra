import Mermaid from './Mermaid.jsx';
import { overviewDiagram } from '../data/overviewDiagram.js';

export default function DiagramPage() {
  return <Mermaid code={overviewDiagram} fullPage backTo="/" />;
}
