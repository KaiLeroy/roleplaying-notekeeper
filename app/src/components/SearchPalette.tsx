import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useCampaign } from '../state/CampaignContext';
import { searchCampaign } from '../lib/search';
import { computeBacklinks } from '../lib/linking';
import { ENTITY_TYPE_LABEL } from '../../shared/types';
import { SearchIcon, PlusIcon } from './icons';

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="hit">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

type Row =
  | { kind: 'entity'; id: string }
  | { kind: 'post'; id: string }
  | { kind: 'create' };

export default function SearchPalette({
  onClose,
  onNavigate,
  onCreate
}: {
  onClose: () => void;
  onNavigate: (id: string) => void;
  onCreate: (title: string) => void;
}) {
  const { campaign } = useCampaign();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const result = useMemo(() => searchCampaign(campaign, query), [campaign, query]);
  const exactTitleMatch = result.entityHits.some((h) => h.entity.title.toLowerCase() === query.trim().toLowerCase());

  const rows: Row[] = useMemo(() => {
    const r: Row[] = result.entityHits.map((h) => ({ kind: 'entity', id: h.entity.id }));
    result.postHits.forEach((h, i) => r.push({ kind: 'post', id: `${h.entityId}:${h.postId ?? i}` }));
    if (query.trim() && !exactTitleMatch) r.push({ kind: 'create' });
    return r;
  }, [result, query, exactTitleMatch]);

  useEffect(() => { setActive(0); }, [query]);

  const activate = (row: Row | undefined) => {
    if (!row) return;
    if (row.kind === 'entity') onNavigate(row.id);
    else if (row.kind === 'post') onNavigate(row.id.split(':')[0]);
    else onCreate(query.trim());
  };

  const activeRow = rows[active];
  const activeEntity = activeRow?.kind === 'entity' ? campaign.entities.find((e) => e.id === activeRow.id) : null;
  const activeBacklinks = activeEntity ? computeBacklinks(campaign, activeEntity.id) : [];
  const activePost = activeRow?.kind === 'post'
    ? result.postHits.find((h, i) => `${h.entityId}:${h.postId ?? i}` === activeRow.id)
    : null;

  return (
    <div className="palette-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="palette">
        <div className="palette-input-row">
          <SearchIcon size={18} className="muted-2" />
          <input
            ref={inputRef}
            className="palette-input"
            value={query}
            placeholder="Search articles, threads, everything…"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, rows.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              if (e.key === 'Enter') activate(rows[active]);
            }}
          />
          <span className="palette-meta">{rows.length} result{rows.length === 1 ? '' : 's'}</span>
        </div>
        <div className="divider-fade" style={{ margin: 0 }} />

        <div className="palette-body">
          <div className="palette-results">
            {result.entityHits.length > 0 && <span className="eyebrow palette-section-label">Articles</span>}
            {result.entityHits.map((h) => {
              const rowIndex = rows.findIndex((r) => r.kind === 'entity' && r.id === h.entity.id);
              return (
                <button
                  key={h.entity.id}
                  className={`reset-btn palette-result${rowIndex === active ? ' active' : ''}`}
                  onMouseEnter={() => setActive(rowIndex)}
                  onClick={() => activate({ kind: 'entity', id: h.entity.id })}
                >
                  <span className="palette-result-dot" />
                  <span className="palette-result-title">{highlight(h.entity.title, query)}</span>
                  <span className="palette-result-meta">{ENTITY_TYPE_LABEL[h.entity.type].toLowerCase()} · {h.backlinkCount}</span>
                </button>
              );
            })}

            {result.postHits.length > 0 && <span className="eyebrow palette-section-label">In post text</span>}
            {result.postHits.map((h, i) => {
              const rowId = `${h.entityId}:${h.postId ?? i}`;
              const rowIndex = rows.findIndex((r) => r.kind === 'post' && r.id === rowId);
              return (
                <button
                  key={rowId}
                  className={`reset-btn palette-hit${rowIndex === active ? ' active' : ''}`}
                  onMouseEnter={() => setActive(rowIndex)}
                  onClick={() => activate({ kind: 'post', id: rowId })}
                >
                  <div className="palette-hit-title">{h.entityTitle}</div>
                  <div className="palette-hit-quote">{highlight(h.quote, query)}</div>
                </button>
              );
            })}

            {rows.length === 0 && query.trim() && (
              <div className="muted-2" style={{ fontSize: 12.5, padding: '16px 10px' }}>Nothing found.</div>
            )}

            {query.trim() && !exactTitleMatch && (
              <button
                className={`reset-btn palette-create${rows[active]?.kind === 'create' ? '' : ''}`}
                style={rows[active]?.kind === 'create' ? { background: 'rgba(145,132,217,.1)' } : undefined}
                onMouseEnter={() => setActive(rows.length - 1)}
                onClick={() => activate({ kind: 'create' })}
              >
                <PlusIcon size={14} />
                Create article “{query.trim()}”
                <span className="popover-hint">⌘↵</span>
              </button>
            )}
          </div>

          <div className="palette-preview">
            {activeEntity ? (
              <>
                <div>
                  <div className="kicker">{ENTITY_TYPE_LABEL[activeEntity.type]}</div>
                  <div style={{ fontSize: 21, fontWeight: 500 }}>{activeEntity.title}</div>
                </div>
                {activeEntity.body && (
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(233,233,237,.78)' }}>
                    {activeEntity.body.slice(0, 260)}{activeEntity.body.length > 260 ? '…' : ''}
                  </div>
                )}
                <div>
                  <span className="eyebrow rail-label">Backlinks · {activeBacklinks.length}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {activeBacklinks.slice(0, 6).map((b) => (
                      <div key={b.id} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 12 }}>
                        <span style={{ color: 'rgba(233,233,237,.8)' }}>{b.title}</span>
                        <span className="muted-3" style={{ marginLeft: 'auto', fontSize: 11 }}>{b.kind}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="muted-3" style={{ marginTop: 'auto', fontSize: 11 }}>↵ open</div>
              </>
            ) : activePost ? (
              <>
                <div>
                  <div className="kicker">In post text</div>
                  <div style={{ fontSize: 18, fontWeight: 500 }}>{activePost.entityTitle}</div>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(233,233,237,.78)' }}>{highlight(activePost.quote, query)}</div>
              </>
            ) : (
              <div className="palette-empty">{query.trim() ? 'Press ⌘↵ to create this article.' : 'Start typing to search the whole campaign.'}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
