import React, { useState } from 'react';
import type { CampaignSummary } from '../../shared/types';
import { relativeTime } from '../lib/id';
import { WikiIcon } from './icons';

export default function Welcome({
  campaigns,
  onOpen,
  onCreate
}: {
  campaigns: CampaignSummary[];
  onOpen: (id: string) => void;
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState('');

  return (
    <div className="welcome-shell">
      <div className="welcome-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <WikiIcon size={22} className="muted-2" />
          <h1 className="welcome-title">Roleplay Notes</h1>
        </div>
        <p className="muted" style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6 }}>
          A wiki for your play-by-post and Discord campaigns — mention a name and it links itself,
          select a word to spin up an article without losing your place.
        </p>

        {campaigns.length > 0 && (
          <div className="campaign-list">
            {campaigns.map((c) => (
              <button key={c.id} className="reset-btn campaign-row" onClick={() => onOpen(c.id)}>
                <div>
                  <div className="campaign-row-name">{c.name}</div>
                  <div className="campaign-row-meta">{c.entityCount} article{c.entityCount === 1 ? '' : 's'} · edited {relativeTime(c.updatedAt)}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="divider-fade" />

        <div className="field">
          <label>Start a new campaign</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              placeholder="Campaign name…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onCreate(name.trim()); }}
            />
            <button className="btn btn-primary" disabled={!name.trim()} onClick={() => onCreate(name.trim())}>Create</button>
          </div>
        </div>
      </div>
    </div>
  );
}
