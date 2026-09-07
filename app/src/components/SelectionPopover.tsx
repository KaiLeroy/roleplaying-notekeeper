import React, { useMemo, useState } from 'react';
import type { Entity } from '../../shared/types';
import { LinkIcon, AliasIcon, QuoteIcon, PlusIcon } from './icons';

export default function SelectionPopover({
  text,
  x,
  y,
  entities,
  onClose,
  onCreateCharacter,
  onLinkExisting,
  onQuote
}: {
  text: string;
  x: number;
  y: number;
  entities: Entity[];
  onClose: () => void;
  onCreateCharacter: () => void;
  onLinkExisting: (entityId: string) => void;
  onQuote: () => void;
}) {
  const [linking, setLinking] = useState(false);
  const [query, setQuery] = useState('');

  const nearMatches = useMemo(() => {
    const lower = text.toLowerCase();
    return entities
      .filter((e) => e.title.toLowerCase().includes(lower) || lower.includes(e.title.toLowerCase()))
      .slice(0, 3);
  }, [entities, text]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? entities.filter((e) => e.title.toLowerCase().includes(q)) : entities;
    return list.slice(0, 8);
  }, [entities, query]);

  const style: React.CSSProperties = {
    left: Math.min(x, window.innerWidth - 300),
    top: Math.min(y, window.innerHeight - 260)
  };

  return (
    <div className="selection-popover" style={style} onMouseDown={(e) => e.stopPropagation()}>
      <div className="popover-head">
        <div className="popover-label">Selected</div>
        <div className="popover-value">{text}</div>
      </div>
      <div className="divider-fade" style={{ margin: 0 }} />

      {!linking ? (
        <div className="popover-list">
          <button className="reset-btn popover-item primary" onClick={onCreateCharacter}>
            <PlusIcon size={15} />
            New character article
            <span className="popover-hint">↵</span>
          </button>
          <button className="reset-btn popover-item" onClick={() => setLinking(true)}>
            <LinkIcon size={15} />
            Link to existing…
            {nearMatches.length > 0 && <span className="muted-2" style={{ marginLeft: 'auto', fontSize: 11 }}>{nearMatches.length} near match{nearMatches.length > 1 ? 'es' : ''}</span>}
          </button>
          {nearMatches[0] && (
            <button className="reset-btn popover-item" onClick={() => onLinkExisting(nearMatches[0].id)}>
              <AliasIcon size={15} />
              Add as alias of <span className="match">{nearMatches[0].title}</span>
            </button>
          )}
          <button className="reset-btn popover-item" onClick={onQuote}>
            <QuoteIcon size={15} />
            Quote into a loose note
            <span className="popover-hint">⇧↵</span>
          </button>
        </div>
      ) : (
        <div className="popover-list">
          <input
            className="input"
            style={{ margin: '2px 4px 6px', width: 'calc(100% - 8px)' }}
            autoFocus
            placeholder="Find an article…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {filtered.map((e) => (
            <button key={e.id} className="reset-btn popover-item" onClick={() => onLinkExisting(e.id)}>
              <span className="sidebar-dot" />
              {e.title}
              <span className="muted-2" style={{ marginLeft: 'auto', fontSize: 11 }}>{e.type}</span>
            </button>
          ))}
          {filtered.length === 0 && <div className="muted-2" style={{ fontSize: 12, padding: '6px 9px' }}>No matches.</div>}
        </div>
      )}
      <button className="reset-btn" style={{ position: 'absolute', top: 8, right: 8, opacity: 0.5 }} onClick={onClose} aria-label="Close">✕</button>
    </div>
  );
}
