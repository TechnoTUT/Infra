import { Fragment, useState } from 'react';

export const VLANS = {
  '10': {
    id: '10',
    label: 'DJ',
    name: 'dj',
    vlanTag: 'VLAN 10',
    subnet: '10.10.0.0/20',
    desc: 'DJ機器 (PRO DJ LINK)',
  },
  '20': {
    id: '20',
    label: 'AV',
    name: 'av',
    vlanTag: 'VLAN 20',
    subnet: '10.10.16.0/20',
    desc: 'VJ・映像伝送 (NDI / Ableton Link)',
  },
  '40': {
    id: '40',
    label: 'PA',
    name: 'pa',
    vlanTag: 'VLAN 40',
    subnet: '192.168.12.0/27',
    desc: 'PA機器 (ミキサー・iPad)',
  },
  '99': {
    id: '99',
    label: 'MGMT',
    name: 'mgmt',
    vlanTag: 'VLAN 99',
    subnet: '192.168.99.0/25',
    desc: '機器管理',
  },
  '100': {
    id: '100',
    label: 'SV',
    name: 'sv',
    vlanTag: 'VLAN 100',
    subnet: '192.168.99.128/25',
    desc: 'サーバ・Kubernetes',
  },
  trunk: {
    id: 'trunk',
    label: 'TRUNK',
    name: 'trunk',
    vlanTag: '全 VLAN (Tagged)',
    subnet: 'VLAN 10, 20, 30, 40, 42-45, 99, 100',
    desc: '全 VLAN トランク',
  },
  unused: {
    id: 'unused',
    label: '未使用',
    name: 'unused',
    vlanTag: '未割当',
    subnet: '-',
    desc: '未割当ポート',
  },
};

const VLAN_ORDER = ['10', '20', '40', '99', '100', 'trunk', 'unused'];

function buildPorts(totalPorts, rules, portPrefix = '') {
  const ports = Array.from({ length: totalPorts }, (_, i) => {
    const num = i + 1;
    return {
      num,
      ifName: portPrefix ? `${portPrefix}${num}` : null,
      vlan: 'unused',
      tagged: false,
      media: 'rj45',
      poe: false,
      lag: null,
      comboNote: null,
      desc: '未割当',
    };
  });

  for (const rule of rules) {
    const [start, end] = Array.isArray(rule.range) ? rule.range : [rule.range, rule.range];
    for (let num = start; num <= end; num++) {
      const idx = num - 1;
      if (idx < 0 || idx >= ports.length) continue;
      ports[idx] = {
        ...ports[idx],
        ...rule,
        num,
        ifName: rule.ifName ?? ports[idx].ifName,
        tagged: rule.tagged ?? rule.vlan === 'trunk',
      };
    }
  }
  return ports;
}

export const SWITCH_PRESETS = {
  'N-1': {
    id: 'N-1',
    name: 'N-1',
    model: 'Allied Telesis AT-SH510-28GTX',
    role: 'コアスイッチ・ラック',
    mgmtIp: '192.168.99.2',
    features: ['IGMP Snooping Querier (VLAN 10, 20)', 'RSTP'],
    ports: buildPorts(
      28,
      [
        { range: 1, vlan: 'trunk', desc: 'Kubernetes ノード (main)' },
        { range: 2, vlan: 'trunk', desc: 'トランク (部室運用時は N-3 ポート 7 等)' },
        { range: 3, vlan: '100', tagged: false, desc: 'FortiGate dmz (SV)' },
        { range: 4, vlan: '99', tagged: false, desc: 'FortiGate mgmt (管理)' },
        {
          range: [5, 12],
          vlan: 'trunk',
          lag: { name: 'po1', mode: 'LACP' },
          desc: 'FortiGate po1 (上流トランク)',
        },
        {
          range: [13, 20],
          vlan: 'trunk',
          lag: { name: 'po2', mode: 'LACP' },
          desc: 'N-4 po1 (PA卓へのトランク)',
        },
        {
          range: [21, 22],
          vlan: 'trunk',
          lag: { name: 'sa1', mode: '静的' },
          desc: 'N-5 / N-6 sa1 (エリアへのトランク)',
        },
        { range: [23, 24], vlan: 'trunk', desc: 'Kubernetes ノード (main)' },
        { range: [25, 28], vlan: 'unused', media: 'sfp+', desc: 'SFP+ スロット (未使用)' },
      ],
      'port2.0.',
    ),
  },
  'N-3': {
    id: 'N-3',
    name: 'N-3',
    model: 'APRESIA ApresiaLightGM110GT-PoE',
    role: 'DJ・VJ 用スイッチ',
    mgmtIp: '192.168.99.3',
    poeBudget: 'PoE 125W (最大 31.2W/port)',
    features: ['MSTP (instance 0)', 'BPDU Guard'],
    ports: buildPorts(10, [
      { range: [1, 4], vlan: '10', tagged: false, poe: true, desc: 'PRO DJ LINK (CDJ / XDJ)' },
      { range: [5, 6], vlan: '20', tagged: false, poe: true, desc: 'VJ 機器' },
      { range: 7, vlan: 'trunk', poe: true, desc: 'サーバ (部室運用時は N-1 ポート 2 接続)' },
      { range: 8, vlan: 'trunk', poe: true, desc: '無線 AP (PoE 給電)' },
      {
        range: 9,
        vlan: 'trunk',
        media: 'sfp',
        comboNote: 'コンボポート (SFP 側を使用)',
        desc: '上流トランク (SFP 光)',
      },
      {
        range: 10,
        vlan: '99',
        tagged: false,
        media: 'rj45',
        comboNote: 'コンボポート (RJ-45 側を使用)',
        desc: '管理用 (MGMT)',
      },
    ]),
  },
  'N-4': {
    id: 'N-4',
    name: 'N-4',
    model: 'Allied Telesis AT-x210-24GT',
    role: 'PA 用スイッチ (PA 卓)',
    mgmtIp: '192.168.99.4',
    features: ['RSTP'],
    ports: buildPorts(
      24,
      [
        { range: [1, 2], vlan: '40', tagged: false, desc: 'PA 機器 (ミキサー・iPad)' },
        { range: [3, 8], vlan: '20', tagged: false, desc: 'AV 機器 (NDI / VJ)' },
        {
          range: [9, 10],
          vlan: '20',
          tagged: false,
          lag: { name: 'po2', mode: 'LACP' },
          desc: 'AV 機器 (LACP)',
        },
        {
          range: [11, 12],
          vlan: '20',
          tagged: false,
          lag: { name: 'po3', mode: 'LACP' },
          desc: 'AV 機器 (LACP)',
        },
        { range: [13, 14], vlan: '99', tagged: false, desc: '管理用 (MGMT)' },
        { range: [15, 16], vlan: 'trunk', desc: 'トランク (下流スイッチ等)' },
        {
          range: [17, 24],
          vlan: 'trunk',
          lag: { name: 'po1', mode: 'LACP' },
          desc: '上流 (N-1 po2) へのトランク (LACP)',
        },
      ],
      'port1.0.',
    ),
  },
  'N-5': {
    id: 'N-5',
    name: 'N-5 / N-6',
    model: 'Allied Telesis GS924M V2',
    role: 'エリアスイッチ (PA・AV)',
    mgmtIp: '192.168.99.5 / .6',
    features: ['IGMP Snooping', 'bclimit=on', 'MSTP (N-6 トランク)'],
    ports: buildPorts(24, [
      { range: [1, 2], vlan: '40', tagged: false, desc: 'PA 機器 (ミキサー・iPad)' },
      { range: [3, 14], vlan: '20', tagged: false, desc: 'AV 機器 (NDI / 映像)' },
      { range: [15, 16], vlan: 'trunk', desc: 'トランク' },
      { range: [17, 20], vlan: 'unused', desc: '未使用 (未割当)' },
      { range: [21, 22], vlan: '99', tagged: false, desc: '管理用 (MGMT)' },
      {
        range: [23, 24],
        vlan: 'trunk',
        lag: { name: 'sa1', mode: '静的' },
        desc: '上流 (N-1 sa1) へのトランク (静的 LAG)',
      },
    ]),
  },
};

function normalizePorts(rawPorts) {
  return rawPorts.map((p, i) => {
    const vlan = p.vlan ?? 'unused';
    return {
      num: p.num ?? i + 1,
      ifName: p.ifName ?? null,
      vlan,
      tagged: p.tagged ?? vlan === 'trunk',
      media: p.media ?? 'rj45',
      poe: Boolean(p.poe),
      lag: p.lag ?? null,
      comboNote: p.comboNote ?? null,
      desc: p.desc ?? VLANS[vlan]?.desc ?? '',
    };
  });
}

function getColumnLagGroups(columns) {
  const groups = [];
  let current = null;
  columns.forEach((col, colIdx) => {
    const topLag = col.top?.lag;
    const bottomLag = col.bottom?.lag;
    const lag = topLag && bottomLag && topLag.name === bottomLag.name ? topLag : topLag ?? bottomLag;
    if (lag && current && current.name === lag.name) {
      current.endColIdx = colIdx;
      current.span += 1;
    } else {
      if (current) groups.push(current);
      current = lag
        ? {
            name: lag.name,
            mode: lag.mode,
            startColIdx: colIdx,
            endColIdx: colIdx,
            span: 1,
          }
        : null;
    }
  });
  if (current) groups.push(current);
  return groups;
}

function portMatchState(port, activeVlan) {
  if (!activeVlan) return 'normal';
  if (port.vlan === activeVlan) return 'match';
  if (activeVlan !== 'unused' && activeVlan !== 'trunk' && port.vlan === 'trunk') {
    return 'match-trunk';
  }
  return 'dim';
}

function Rj45Jack({ isTop }) {
  return (
    <svg className="sw-jack-svg" viewBox="0 0 28 22" width="28" height="22" aria-hidden="true">
      <rect x="2" y="2" width="24" height="18" rx="2.5" className="sw-jack-outer" />
      {isTop ? (
        <>
          <path d="M6 17 V7 H10 V4.5 H18 V7 H22 V17 Z" className="sw-jack-inner" />
          <g className="sw-jack-pins">
            <line x1="8.5" y1="14.5" x2="8.5" y2="17" />
            <line x1="10.5" y1="14.5" x2="10.5" y2="17" />
            <line x1="12.5" y1="14.5" x2="12.5" y2="17" />
            <line x1="14" y1="14.5" x2="14" y2="17" />
            <line x1="15.5" y1="14.5" x2="15.5" y2="17" />
            <line x1="17.5" y1="14.5" x2="17.5" y2="17" />
            <line x1="19.5" y1="14.5" x2="19.5" y2="17" />
          </g>
        </>
      ) : (
        <>
          <path d="M6 5 V15 H10 V17.5 H18 V15 H22 V5 Z" className="sw-jack-inner" />
          <g className="sw-jack-pins">
            <line x1="8.5" y1="5" x2="8.5" y2="7.5" />
            <line x1="10.5" y1="5" x2="10.5" y2="7.5" />
            <line x1="12.5" y1="5" x2="12.5" y2="7.5" />
            <line x1="14" y1="5" x2="14" y2="7.5" />
            <line x1="15.5" y1="5" x2="15.5" y2="7.5" />
            <line x1="17.5" y1="5" x2="17.5" y2="7.5" />
            <line x1="19.5" y1="5" x2="19.5" y2="7.5" />
          </g>
        </>
      )}
    </svg>
  );
}

function SfpCage() {
  return (
    <svg className="sw-jack-svg" viewBox="0 0 28 22" width="28" height="22" aria-hidden="true">
      <rect x="1.5" y="2.5" width="25" height="17" rx="2" className="sw-jack-outer sw-sfp-outer" />
      <rect x="4.5" y="5.5" width="8.5" height="11" rx="1" className="sw-jack-inner" />
      <rect x="15" y="5.5" width="8.5" height="11" rx="1" className="sw-jack-inner" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg className="sw-poe-icon" viewBox="0 0 12 14" width="9" height="11" aria-label="PoE">
      <path d="M6.8 0.5 L1.5 7.8 H5.5 L4.6 13.5 L10.5 6 H6.3 Z" fill="currentColor" />
    </svg>
  );
}

function PortButton({ port, colIndex, isTop, matchState, isSelected, onHover, onSelect, bankStart }) {
  const meta = VLANS[port.vlan] ?? VLANS.unused;
  const tagText = port.vlan === 'unused' ? '' : port.tagged ? 'T' : 'U';
  const isSfp = port.media === 'sfp' || port.media === 'sfp+';
  const titleParts = [
    `Port ${port.num}${port.ifName ? ` (${port.ifName})` : ''}`,
    `${meta.vlanTag}${port.vlan !== 'unused' ? (port.tagged ? ' · Tagged' : ' · Untagged') : ''}`,
    port.lag ? `LAG: ${port.lag.name} (${port.lag.mode})` : null,
    port.poe ? 'PoE給電' : null,
    port.desc,
  ].filter(Boolean);

  return (
    <button
      type="button"
      className={[
        'sw-port',
        `sw-vlan-${meta.id}`,
        `sw-state-${matchState}`,
        port.lag ? 'sw-has-lag' : '',
        isSfp ? 'sw-is-sfp' : '',
        isSelected ? 'sw-selected' : '',
        bankStart ? 'sw-bank-start' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ gridColumn: colIndex + 1, gridRow: isTop ? 2 : 3 }}
      title={titleParts.join(' | ')}
      aria-pressed={isSelected}
      onMouseEnter={() => onHover(port)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(port)}
      onBlur={() => onHover(null)}
      onClick={() => onSelect(port)}
    >
      <span className="sw-port-top">
        <span className="sw-port-num">{port.num}</span>
        <span className="sw-port-flags">
          {port.poe && <BoltIcon />}
          {tagText && <span className={`sw-tag-badge ${port.tagged ? 'is-tagged' : 'is-untagged'}`}>{tagText}</span>}
        </span>
      </span>
      <span className="sw-port-jack">
        {isSfp ? <SfpCage /> : <Rj45Jack isTop={isTop} />}
      </span>
      <span className="sw-port-vlan">{isSfp && port.vlan === 'unused' ? 'SFP+' : meta.shortLabel}</span>
    </button>
  );
}

export function SwitchPanel({
  preset,
  name,
  model,
  role,
  mgmtIp,
  poeBudget,
  features,
  ports: customPorts,
  selectedVlan: controlledVlan,
  onSelectVlan,
  showLegend = true,
}) {
  const base = preset ? SWITCH_PRESETS[preset] : null;
  const swName = name ?? base?.name ?? 'Switch';
  const swModel = model ?? base?.model ?? '';
  const swRole = role ?? base?.role ?? '';
  const swMgmtIp = mgmtIp ?? base?.mgmtIp ?? '';
  const swPoeBudget = poeBudget ?? base?.poeBudget ?? null;
  const swFeatures = features ?? base?.features ?? [];
  const ports = customPorts ? normalizePorts(customPorts) : base?.ports ?? [];

  const [internalVlan, setInternalVlan] = useState(null);
  const [hoveredPort, setHoveredPort] = useState(null);
  const [pinnedPort, setPinnedPort] = useState(null);

  const isControlled = controlledVlan !== undefined;
  const activeVlan = isControlled ? controlledVlan : internalVlan;

  const toggleVlan = (vid) => {
    const next = activeVlan === vid ? null : vid;
    if (onSelectVlan) onSelectVlan(next);
    if (!isControlled) setInternalVlan(next);
  };

  const handleSelectPort = (port) => {
    setPinnedPort((prev) => (prev?.num === port.num ? null : port));
  };

  const colCount = Math.ceil(ports.length / 2);
  const columns = Array.from({ length: colCount }, (_, c) => ({
    top: ports[c * 2] ?? null,
    bottom: ports[c * 2 + 1] ?? null,
    bankStart: c > 0 && c % 4 === 0,
  }));
  const lagGroups = getColumnLagGroups(columns);

  const presentVlans = VLAN_ORDER.filter((vid) => ports.some((p) => p.vlan === vid));
  const inspectedPort = hoveredPort ?? pinnedPort;
  const inspectedMeta = inspectedPort ? VLANS[inspectedPort.vlan] ?? VLANS.unused : null;

  return (
    <section className="switch-panel" aria-label={`${swName} ポート VLAN 割り当て`}>
      <header className="sw-header">
        <div className="sw-title-wrap">
          <span className="sw-badge">{swName}</span>
          <div>
            <div className="sw-model">{swModel}</div>
            {(swRole || swPoeBudget) && (
              <div className="sw-sub">
                {swRole}
                {swRole && swPoeBudget ? ' · ' : ''}
                {swPoeBudget}
              </div>
            )}
          </div>
        </div>
        <div className="sw-meta-chips">
          {swMgmtIp && <span className="sw-chip">MGMT {swMgmtIp}</span>}
          {swFeatures.map((f) => (
            <span key={f} className="sw-chip">{f}</span>
          ))}
        </div>
      </header>

      {showLegend && (
        <div className="sw-legend" role="group" aria-label="VLAN フィルタ">
          {presentVlans.map((vid) => {
            const v = VLANS[vid];
            const active = activeVlan === vid;
            return (
              <button
                key={vid}
                type="button"
                className={`sw-legend-pill sw-vlan-${vid}${active ? ' is-active' : ''}`}
                aria-pressed={active}
                onClick={() => toggleVlan(vid)}
              >
                <span className="sw-legend-dot" aria-hidden="true" />
                <span>{vid === 'trunk' || vid === 'unused' ? v.label : `VLAN ${vid} ${v.label}`}</span>
              </button>
            );
          })}
          {activeVlan && (
            <button type="button" className="sw-legend-reset" onClick={() => toggleVlan(activeVlan)}>
              解除
            </button>
          )}
        </div>
      )}

      <div className="sw-chassis-scroll">
        <div className="sw-chassis">
          <div
            className="sw-grid"
            style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 52px))` }}
          >
            {lagGroups.map((g) => {
              const fullLabel = `${g.name} (${g.mode})`;
              return (
                <div
                  key={`${g.name}-${g.startColIdx}`}
                  className="sw-lag-bracket"
                  title={fullLabel}
                  style={{ gridColumn: `${g.startColIdx + 1} / span ${g.span}`, gridRow: 1 }}
                >
                  <span className="sw-lag-label">{g.span === 1 ? g.name : fullLabel}</span>
                </div>
              );
            })}

            {columns.map((col, c) => (
              <Fragment key={c}>
                {col.top && (
                  <PortButton
                    port={col.top}
                    colIndex={c}
                    isTop
                    bankStart={col.bankStart}
                    matchState={portMatchState(col.top, activeVlan)}
                    isSelected={pinnedPort?.num === col.top.num}
                    onHover={setHoveredPort}
                    onSelect={handleSelectPort}
                  />
                )}
                {col.bottom && (
                  <PortButton
                    port={col.bottom}
                    colIndex={c}
                    isTop={false}
                    bankStart={col.bankStart}
                    matchState={portMatchState(col.bottom, activeVlan)}
                    isSelected={pinnedPort?.num === col.bottom.num}
                    onHover={setHoveredPort}
                    onSelect={handleSelectPort}
                  />
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      <footer className="sw-detail-bar" aria-live="polite">
        {inspectedPort ? (
          <div className="sw-detail-content">
            <span className={`sw-detail-vlan sw-vlan-${inspectedMeta.id}`}>
              {inspectedMeta.vlanTag}
              {inspectedPort.vlan !== 'unused' && (inspectedPort.tagged ? ' (Tagged)' : ' (Untagged)')}
            </span>
            <strong className="sw-detail-port">
              Port {inspectedPort.num}
              {inspectedPort.ifName ? ` (${inspectedPort.ifName})` : ''}
            </strong>
            <span className="sw-detail-desc">{inspectedPort.desc}</span>
            <span className="sw-detail-tags">
              {inspectedPort.lag && (
                <span className="sw-detail-tag">LAG: {inspectedPort.lag.name} ({inspectedPort.lag.mode})</span>
              )}
              {inspectedPort.poe && <span className="sw-detail-tag">PoE 給電</span>}
              {inspectedPort.media !== 'rj45' && (
                <span className="sw-detail-tag">{inspectedPort.media.toUpperCase()}</span>
              )}
              {inspectedPort.comboNote && <span className="sw-detail-tag">{inspectedPort.comboNote}</span>}
            </span>
          </div>
        ) : (
          <div className="sw-detail-hint">
            <span>ポートにカーソルを合わせるかクリックすると割り当て詳細を表示します</span>
            <span className="sw-detail-key">
              <span className="sw-tag-badge is-untagged">U</span> Untagged
              <span aria-hidden="true">/</span>
              <span className="sw-tag-badge is-tagged">T</span> Tagged (全 VLAN)
              <span aria-hidden="true">/</span>
              <BoltIcon /> PoE
            </span>
          </div>
        )}
      </footer>
    </section>
  );
}

const OVERVIEW_SWITCHES = ['N-1', 'N-3', 'N-4', 'N-5'];
const OVERVIEW_VLANS = ['10', '20', '40', '99', '100', 'trunk'];

export function SwitchVlanOverview() {
  const [selectedVlan, setSelectedVlan] = useState(null);
  const [selectedSwitch, setSelectedSwitch] = useState('all');

  const visibleSwitches =
    selectedSwitch === 'all' ? OVERVIEW_SWITCHES : OVERVIEW_SWITCHES.filter((id) => id === selectedSwitch);
  const selectedMeta = selectedVlan ? VLANS[selectedVlan] : null;

  return (
    <div className="switch-overview">
      <div className="sw-overview-controls">
        <div className="sw-overview-group" role="group" aria-label="VLAN でハイライト">
          <button
            type="button"
            className={`sw-filter-btn${selectedVlan === null ? ' is-active' : ''}`}
            aria-pressed={selectedVlan === null}
            onClick={() => setSelectedVlan(null)}
          >
            全 VLAN
          </button>
          {OVERVIEW_VLANS.map((vid) => {
            const v = VLANS[vid];
            const active = selectedVlan === vid;
            return (
              <button
                key={vid}
                type="button"
                className={`sw-legend-pill sw-vlan-${vid}${active ? ' is-active' : ''}`}
                aria-pressed={active}
                onClick={() => setSelectedVlan(active ? null : vid)}
              >
                <span className="sw-legend-dot" aria-hidden="true" />
                <span>{vid === 'trunk' ? 'TRUNK' : `VLAN ${vid} ${v.label}`}</span>
              </button>
            );
          })}
        </div>

        <div className="sw-overview-group sw-switch-tabs" role="group" aria-label="スイッチ表示切替">
          <button
            type="button"
            className={`sw-filter-btn${selectedSwitch === 'all' ? ' is-active' : ''}`}
            aria-pressed={selectedSwitch === 'all'}
            onClick={() => setSelectedSwitch('all')}
          >
            全スイッチ (4)
          </button>
          {OVERVIEW_SWITCHES.map((id) => {
            const active = selectedSwitch === id;
            return (
              <button
                key={id}
                type="button"
                className={`sw-filter-btn${active ? ' is-active' : ''}`}
                aria-pressed={active}
                onClick={() => setSelectedSwitch(active ? 'all' : id)}
              >
                {SWITCH_PRESETS[id].name}
              </button>
            );
          })}
        </div>
      </div>

      {selectedMeta && (
        <div className={`sw-vlan-banner sw-vlan-${selectedMeta.id}`}>
          <strong>{selectedMeta.vlanTag} ({selectedMeta.name})</strong>
          <span>{selectedMeta.subnet}</span>
          <span>
            — {selectedMeta.desc}
            {selectedMeta.id !== 'trunk' && '（該当ポートとトランクをハイライト中）'}
          </span>
        </div>
      )}

      <div className="sw-overview-list">
        {visibleSwitches.map((id) => (
          <SwitchPanel
            key={id}
            preset={id}
            selectedVlan={selectedVlan}
            onSelectVlan={setSelectedVlan}
            showLegend={false}
          />
        ))}
      </div>
    </div>
  );
}
