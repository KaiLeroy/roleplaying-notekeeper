import React, { useMemo, useState } from 'react';
import type { Entity } from '../../shared/types';
import { useCampaign } from '../state/CampaignContext';
import { computeGraph } from '../lib/graph';
import { computeBacklinks } from '../lib/linking';
import { assetUrl } from '../lib/assets';
import LinkedText from './LinkedText';
import Tag from './Tag';

export default function MapView({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { campaign, getEntity, upsertRelation } = useCampaign();
  const { nodes, edges } = useMemo(() => computeGraph(campaign), [campaign]);
  const [selectedId, setSelectedId] = useState<string | null>(nodes[0]?.id ?? null);
  const [trace, setTrace] = useState(false);

  const selected = selectedId ? getEntity(selectedId) ?? null : null;
  const connected = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const s = new Set<string>();
    for (const e of edges) {
      if (e.a === selectedId) s.add(e.b);
      if (e.b === selectedId) s.add(e.a);
    }
    return s;
  }, [edges, selectedId]);

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  return (
    <div className="map-shell">
      <div className="map-canvas">
        {nodes.length === 0 ? (
          <div className="empty-pane" style={{ position: 'absolute', inset: 0 }}>
            No connections yet — mention two characters or factions together in the same thread post to see them here.
          </div>
        ) : (
          <>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <g fill="none">
                {edges.map((edge, i) => {
                  const a = byId.get(edge.a), b = byId.get(edge.b);
                  if (!a || !b) return null;
                  const dim = trace && selectedId && !(edge.a === selectedId || edge.b === selectedId);
                  return (
                    <path
                      key={i}
                      d={`M${a.x} ${a.y} L${b.x} ${b.y}`}
                      stroke="#5d5294"
                      strokeWidth={0.3}
                      opacity={dim ? 0.12 : edge.kind === 'met' ? 0.75 : 0.4}
                      strokeDasharray={edge.kind === 'mentioned' ? '1.2 1.4' : undefined}
                    />
                  );
                })}
              </g>
            </svg>
            {nodes.map((n) => {
              const dim = trace && selectedId && n.id !== selectedId && !connected.has(n.id);
              return (
                <button
                  key={n.id}
                  className={`reset-btn map-node${n.type === 'faction' ? ' faction' : ''}${n.id === selectedId ? ' selected' : ''}`}
                  style={{ left: `${n.x}%`, top: `${n.y}%`, opacity: dim ? 0.25 : 1 }}
                  onClick={() => setSelectedId(n.id)}
                >
                  {n.name}
                </button>
              );
            })}
          </>
        )}
        <div className="map-legend">
          <div><span className="map-legend-line" /> appears together in a thread</div>
          <div><span className="map-legend-dash" /> mentioned but never met</div>
        </div>
      </div>

      <Dossier
        entity={selected}
        allEntities={campaign.entities}
        onNavigate={onNavigate}
        onTrace={() => setTrace((t) => !t)}
        tracing={trace}
        onAddRelation={(toId, label, strength) => selected && upsertRelation(selected.id, { toId, label, strength })}
      />
    </div>
  );
}

function Dossier({
  entity,
  allEntities,
  onNavigate,
  onTrace,
  tracing,
  onAddRelation
}: {
  entity: Entity | null;
  allEntities: Entity[];
  onNavigate: (id: string) => void;
  onTrace: () => void;
  tracing: boolean;
  onAddRelation: (toId: string, label: string, strength: number) => void;
}) {
  const { campaign } = useCampaign();
  const backlinks = useMemo(() => (entity ? computeBacklinks(campaign, entity.id) : []), [campaign, entity]);
  const threadHits = backlinks.filter((b) => b.kind === 'thread');
  const [addingTo, setAddingTo] = useState('');
  const [addingLabel, setAddingLabel] = useState('');

  if (!entity) {
    return <div className="dossier"><div className="dossier-empty">Select a node to see their dossier.</div></div>;
  }

  const byId = new Map(allEntities.map((e) => [e.id, e]));
  const otherLinkable = allEntities.filter((e) => e.id !== entity.id && (e.type === 'character' || e.type === 'faction'));

  return (
    <div className="dossier">
      <div className="dossier-head">
        <div className={`dossier-portrait${entity.images[0] ? ' has-image' : ''}`}>
          {entity.images[0]
            ? <img src={assetUrl(campaign.id, entity.images[0].filename)} alt={entity.images[0].caption || entity.title} />
            : <>portrait<br />placeholder</>}
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="kicker" style={{ marginBottom: 7 }}>
            {entity.type === 'character' ? 'Character' : 'Faction'}{entity.isPC ? ' · my PC' : ''}
          </div>
          <div className="dossier-name">{entity.title}</div>
          {entity.subtitle && <div className="dossier-sub">{entity.subtitle}</div>}
          <div className="dossier-tags">
            <Tag tone="neutral">{backlinks.length} links</Tag>
            <Tag tone="neutral">{threadHits.length} threads</Tag>
          </div>
        </div>
      </div>

      <div className="divider-fade" />

      <div>
        <span className="eyebrow rail-label">Standing with</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entity.relations.map((r) => {
            const target = byId.get(r.toId);
            return (
              <div className="relation-row" key={r.id}>
                <span className="relation-name">{target?.title ?? 'Unknown'}</span>
                <span className="relation-bar-track"><span className="relation-bar-fill" style={{ width: `${r.strength}%` }} /></span>
                <span className="relation-label">{r.label}</span>
              </div>
            );
          })}
          {entity.relations.length === 0 && <div className="muted-2" style={{ fontSize: 12 }}>No standing recorded yet.</div>}
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <select className="input" style={{ height: 30, minHeight: 30, fontSize: 12, flex: 1 }} value={addingTo} onChange={(e) => setAddingTo(e.target.value)}>
              <option value="">Add standing with…</option>
              {otherLinkable.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
            <input
              className="input" style={{ height: 30, minHeight: 30, fontSize: 12, width: 90 }}
              placeholder="label" value={addingLabel} onChange={(e) => setAddingLabel(e.target.value)}
            />
            <button
              className="btn btn-secondary btn-icon" style={{ width: 30, height: 30 }}
              disabled={!addingTo || !addingLabel.trim()}
              onClick={() => { onAddRelation(addingTo, addingLabel.trim(), 50); setAddingTo(''); setAddingLabel(''); }}
            >+</button>
          </div>
        </div>
      </div>

      {threadHits.length > 0 && (
        <div>
          <span className="eyebrow rail-label">Open threads mentioning them</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {threadHits.map((b) => (
              <button key={b.id} className="reset-btn thread-mini" style={{ width: '100%' }} onClick={() => onNavigate(b.id.split(':')[0])}>
                <LinkedText text={b.quote} paragraphs={false} onNavigate={onNavigate} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="dossier-actions">
        <button className="btn btn-primary" onClick={() => onNavigate(entity.id)}>Open article</button>
        <button className={`btn btn-secondary${tracing ? '' : ''}`} onClick={onTrace} style={tracing ? { color: 'var(--color-accent-200)', background: 'rgba(145,132,217,.14)' } : undefined}>
          {tracing ? 'Tracing…' : 'Trace links'}
        </button>
      </div>
    </div>
  );
}
