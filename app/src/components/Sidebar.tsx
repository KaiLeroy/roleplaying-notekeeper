import React, { useMemo, useState } from 'react';
import type { EntityType } from '../../shared/types';
import { ENTITY_TYPE_PLURAL } from '../../shared/types';
import { useCampaign } from '../state/CampaignContext';
import { computeBacklinks } from '../lib/linking';
import { PlusIcon } from './icons';

type TypeFilter = 'thread' | 'character' | 'place' | 'faction' | 'unsorted';

const TOP_ROWS: { key: TypeFilter; label: string }[] = [
  { key: 'thread', label: 'Threads' },
  { key: 'character', label: 'Characters' },
  { key: 'place', label: 'Places' },
  { key: 'faction', label: 'Factions' },
  { key: 'unsorted', label: 'Unsorted' }
];

export default function Sidebar({
  selectedId,
  onSelect,
  onCreate
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (type: EntityType) => void;
}) {
  const { campaign } = useCampaign();
  const [activeFilter, setActiveFilter] = useState<TypeFilter>('character');

  const counts = useMemo(() => {
    const c: Record<TypeFilter, number> = { thread: 0, character: 0, place: 0, faction: 0, unsorted: 0 };
    for (const e of campaign.entities) {
      if (e.type === 'note' || e.type === 'object') c.unsorted++;
      else c[e.type]++;
    }
    return c;
  }, [campaign.entities]);

  const listed = useMemo(() => {
    const items = campaign.entities.filter((e) =>
      activeFilter === 'unsorted' ? e.type === 'note' || e.type === 'object' : e.type === activeFilter
    );
    return items.sort((a, b) => a.title.localeCompare(b.title));
  }, [campaign.entities, activeFilter]);

  const totals = useMemo(() => {
    const notes = campaign.entities.length;
    let links = 0;
    for (const e of campaign.entities) links += computeBacklinks(campaign, e.id).length;
    return { notes, links };
  }, [campaign]);

  const createType: EntityType = activeFilter === 'unsorted' ? 'note' : activeFilter;

  return (
    <div className="sidebar">
      <div className="sidebar-top">
        {TOP_ROWS.map((row) => (
          <button
            key={row.key}
            className={`reset-btn sidebar-row${activeFilter === row.key ? ' active' : ''}`}
            onClick={() => setActiveFilter(row.key)}
          >
            {row.label}
            <span className="count">{counts[row.key]}</span>
          </button>
        ))}
      </div>

      <div className="divider-fade" />

      <div className="sidebar-groups">
        <div className="sidebar-group">
          <div className="sidebar-group-label eyebrow">
            {activeFilter === 'unsorted' ? 'Unsorted' : ENTITY_TYPE_PLURAL[activeFilter]}
            <button className="reset-btn add" title={`New ${createType}`} onClick={() => onCreate(createType)}>
              <PlusIcon size={12} />
            </button>
          </div>
          {listed.length === 0 && <div className="sidebar-empty">Nothing here yet.</div>}
          {listed.map((e) => (
            <button
              key={e.id}
              className={`reset-btn sidebar-item${selectedId === e.id ? ' active' : ''}`}
              onClick={() => onSelect(e.id)}
            >
              <span className="sidebar-dot" />
              <span>{e.title || 'Untitled'}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-footer">{totals.notes} notes · {totals.links} links</div>
    </div>
  );
}
