import React, { useEffect, useRef, useState } from 'react';
import type { EntityType } from '../../shared/types';
import { ENTITY_TYPE_LABEL } from '../../shared/types';

const TYPES: EntityType[] = ['character', 'place', 'faction', 'thread', 'note', 'object'];

export default function NewEntityDialog({
  initialType,
  initialTitle = '',
  onCancel,
  onCreate
}: {
  initialType: EntityType;
  initialTitle?: string;
  onCancel: () => void;
  onCreate: (title: string, type: EntityType) => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [type, setType] = useState<EntityType>(initialType);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  const submit = () => {
    const t = title.trim();
    if (!t) return;
    onCreate(t, type);
  };

  return (
    <div className="dialog-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="dialog">
        <div className="dialog-title">New article</div>
        <div className="field">
          <label>Title</label>
          <input
            ref={inputRef}
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
              if (e.key === 'Escape') onCancel();
            }}
            placeholder="Name it…"
          />
        </div>
        <div className="field">
          <label>Type</label>
          <div className="seg" style={{ flexWrap: 'wrap' }}>
            {TYPES.map((t) => (
              <label key={t} className="seg-opt">
                <input type="radio" checked={type === t} onChange={() => setType(t)} />
                {ENTITY_TYPE_LABEL[t]}
              </label>
            ))}
          </div>
        </div>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={!title.trim()}>Create</button>
        </div>
      </div>
    </div>
  );
}
