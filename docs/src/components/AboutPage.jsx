import { Link } from 'react-router';
import { overviewDiagram } from '../data/overviewDiagram.js';
import Footer from './Footer.jsx';
import Mermaid from './Mermaid.jsx';
import MissionList from './MissionList.jsx';
import { RepoCard } from './mdx.jsx';
import SiteHeader from './SiteHeader.jsx';

const mission = [
  {
    title: '安定したネットワークの提供',
    body: [
      'TechnoTUT Networkは、学内DJイベント "The Utopia Tone" を運営する上での重要なインフラです。ネットワークサービスの停止は、DJパフォーマンス・映像演出・映像配信・照明・音響制御に大きな影響を与えます。障害時にもサービスを継続し、演出への影響を最小限に抑えることができるような堅牢で安定したネットワークの構築を目指します。監視・ログ解析も行い、イベントの安全な運営を支えます。',
    ],
  },
  {
    title: '演出支援・自動制御',
    body: [
      '異なる役割のシステムを連携させることで、演出の一体感を向上させ、より没入感のある音楽体験を提供します。連携により、自動制御を可能にすることで、リアルタイムのパフォーマンスを支援します。',
    ],
  },
  {
    title: '会場内映像配信システムの提供',
    body: [
      'MoIP (Media over IP) を活用した高品質な映像の伝送環境を提供します。IPネットワークによる映像伝送によって、機材のケーブルを削減し、ケーブル長に縛られない自由な機材配置と安価な配信システムの構築を実現します。',
    ],
  },
  {
    title: '分散処理による高負荷処理の実行・高信頼性の確保',
    body: [
      'ネットワークを活用することで、複数台に処理を分散し1台の計算機では不可能な処理を実行できます。大規模な映像処理を可能にし、イベントの演出や技術的な革新を支援します。',
      'また、1台の計算機が故障してもサービスを継続できる高信頼性なシステムを構築します。',
    ],
  },
];

const c = (t) => <code>{t}</code>;
const overview = [
  {
    title: 'DJ・演出同期',
    tags: [{ label: 'PRO DJ LINK', to: '/service/prodjlink' }, { label: 'plmux', to: '/service/plmux' }, { label: 'Ableton Link' }, { label: 'OSC' }],
    body: <>DJ ブースの再生状態やテンポを Kubernetes 上のアプリケーションが取得し、Ableton Link や OSC で VJ ソフトや照明へ同期します。</>,
  },
  {
    title: '映像伝送',
    tags: [{ label: 'NDI', to: '/service/ndi' }, { label: 'utone-linux', to: '/service/utone-linux' }],
    body: <>映像は NDI で低遅延に伝送し、プロジェクタやブースディスプレイ、照明の色連動に活用します。</>,
  },
  {
    title: '映像配信',
    tags: [{ label: 'RTMP', to: '/service/live' }],
    body: <>カメラからの映像は Kubernetes 上の中継サーバへ RTMP で集約し、配信に利用します。</>,
  },
  {
    title: '照明制御',
    tags: [{ label: 'Art-Net', to: '/service/art-net' }, { label: 'dmxsim', to: '/service/dmxsim' }],
    body: <>Kubernetes 上のアプリケーションでDMX/Art-Net信号を送出し、 灯体を制御します。事前検証用の 3D シミュレータにも接続できます。</>,
  },
  {
    title: '音響制御',
    tags: [{ label: 'PA', to: '/service/pa' }],
    body: <>デジタルミキサーを、会場 Wi-Fi 経由で iPad や MCP経由でAIエージェントから操作します。</>,
  },
  {
    title: 'ネットワーク・コンテナ基盤',
    tags: [{ label: 'Network', to: '/network' }, { label: 'Compute', to: '/compute' }],
    body: <>コアスイッチが各 VLAN の制御とルーティングを担い、Kubernetes クラスタが各種サービスを冗長構成で提供します。</>,
  },
];

export default function AboutPage() {
  return (
    <div className="dark-page about">
      <SiteHeader active="about" />
      <section className="about-section about-first">
        <h1 className="about-h">Our Mission</h1>
        <MissionList items={mission} />
        <div className="about-cards">
          {mission.map((m, i) => (
            <article key={m.title} className="about-card">
              <span className="about-card-no">{String(i + 1).padStart(2, '0')}</span>
              <h3>{m.title}</h3>
              {m.body.map((t) => <p key={t}>{t}</p>)}
            </article>
          ))}
        </div>
      </section>

      <section className="about-section">
        <h2 className="about-h">ネットワークの全体像</h2>
        <p className="about-intro">
          用途ごとに分割した VLAN と <Link to="/compute">Kubernetes コンテナ基盤</Link> を中心に、DJ・映像・照明・音響制御の各システムが連携して動作しています。
        </p>
        <Mermaid code={overviewDiagram} fullPageTo="/diagram" forceTheme="dark" />
        <ul className="about-list">
          {overview.map((o) => (
            <li key={o.title}>
              <div className="about-list-head">
                <h3>{o.title}</h3>
                <div className="about-tags">
                  {o.tags.map((t) => (t.to
                    ? <Link key={t.label} to={t.to} className="about-tag">{t.label}</Link>
                    : <span key={t.label} className="about-tag is-plain">{t.label}</span>))}
                </div>
              </div>
              <p>{o.body}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="about-section">
        <h2 className="about-h">Source</h2>
        <p className="about-intro">このページは、TechnoTUTのGitHubリポジトリで管理されています。</p>
        <div className="about-repo"><RepoCard repo="TechnoTUT/Infra" /></div>
      </section>
      <Footer />
    </div>
  );
}
