import React, { useMemo } from 'react';
import type { Entity } from '../../shared/types';
import { useCampaign } from '../state/CampaignContext';
import { computeBacklinks, segmentText, mentionedEntityIds, unlinkedSuggestionsIn } from '../lib/linking';
import { relativeTime } from '../lib/id';
import Tag from './Tag';

export default function BacklinkRail({
  entity,
  onNavigate,
  onSuggestion
}: {
  entity: Entity;
  onNavigate: (id: string) => void;
  onSuggestion: (phrase: string) => void;
}) {
  const { campaign, matcher, getEntity } = useCampaign();

  const backlinks = useMemo(() => computeBacklinks(campaign, entity.id), [campaign, entity.id]);
  const segments = useMemo(() => segmentText(entity.body, matcher, entity.id), [entity.body, entity.id, matcher]);
  const mentioned = useMemo(() => mentionedEntityIds(segments), [segments]);
  const unlinked = useMemo(() => unlinkedSuggestionsIn(segments), [segments]);

  return (
    <div className="backlink-rail">
      <div>
        <span className="eyebrow rail-label">Linked from · {backlinks.length}</span>
        <div className="rail-list">
          {backlinks.length === 0 && <div className="muted-2" style={{ fontSize: 12 }}>Nothing links here yet.</div>}
          {backlinks.map((b) => (
            <button key={b.id} className="reset-btn rail-card" onClick={() => onNavigate(b.id.split(':')[0])}>
              <div className="rail-card-top">
                <span className="rail-card-title">{b.title}</span>
                <span className="rail-card-kind">{b.kind}</span>
              </div>
              <div className="rail-card-quote">{b.quote}</div>
            </button>
          ))}
        </div>
      </div>

      {(mentioned.length > 0 || unlinked.length > 0) && (
        <div>
          <span className="eyebrow rail-label">Mentioned here</span>
          <div className="mentioned-wrap">
            {mentioned.map((id) => {
              const e = getEntity(id);
              if (!e) return null;
              return <Tag key={id} tone="accent" onClick={() => onNavigate(id)}>{e.title}</Tag>;
            })}
            {unlinked.map((phrase) => (
              <Tag key={phrase} tone="outline" onClick={() => onSuggestion(phrase)}>{phrase} ?</Tag>
            ))}
          </div>
        </div>
      )}

      <div className="rail-footer">Last edited {relativeTime(entity.updatedAt)}</div>
    </div>
  );
}
