import React, { useMemo, useState } from 'react';
import type { Entity, EntityType } from '../../shared/types';
import { ENTITY_TYPE_LABEL } from '../../shared/types';
import { useCampaign } from '../state/CampaignContext';
import { segmentText, unlinkedSuggestionsIn, collectTextBlobs, countBlobsMentioning } from '../lib/linking';
import LinkedText from './LinkedText';
import BacklinkRail from './BacklinkRail';
import Tag from './Tag';
import { SparkleIcon } from './icons';

const TYPES: EntityType[] = ['character', 'place', 'faction', 'note', 'object'];

export default function ArticleView({
  entity,
  onNavigate,
  onCreateFromSuggestion
}: {
  entity: Entity;
  onNavigate: (id: string) => void;
  onCreateFromSuggestion: (phrase: string) => void;
}) {
  const { campaign, matcher, updateEntity, deleteEntity } = useCampaign();
  const [editing, setEditing] = useState(entity.body.trim() === '');
  const [tagDraft, setTagDraft] = useState('');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const segments = useMemo(() => segmentText(entity.body, matcher, entity.id), [entity.body, entity.id, matcher]);
  const suggestions = useMemo(
    () => unlinkedSuggestionsIn(segments).filter((s) => !dismissed.has(s)),
    [segments, dismissed]
  );
  const blobs = useMemo(() => collectTextBlobs(campaign), [campaign]);
  const bannerPhrase = suggestions[0];
  const bannerCount = bannerPhrase ? countBlobsMentioning(blobs, bannerPhrase, entity.id) : 0;

  return (
    <div className="app-layout" style={{ flex: 1, minHeight: 0 }}>
      <div className="article-pane">
        <div className="article-max">
          <div className="kicker">
            <select
              className="reset-btn"
              style={{ background: 'none', color: 'inherit', fontWeight: 500, letterSpacing: 'inherit', textTransform: 'uppercase', fontSize: 10, border: 'none' }}
              value={entity.type}
              onChange={(e) => updateEntity(entity.id, { type: e.target.value as EntityType })}
            >
              {TYPES.map((t) => <option key={t} value={t}>{ENTITY_TYPE_LABEL[t]}</option>)}
            </select>
            {entity.type === 'character' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: 'inherit', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={entity.isPC}
                  onChange={(e) => updateEntity(entity.id, { isPC: e.target.checked })}
                />
                my PC
              </label>
            )}
          </div>

          <div className="article-title-row">
            <input
              className="article-title"
              value={entity.title}
              placeholder="Untitled"
              onChange={(e) => updateEntity(entity.id, { title: e.target.value })}
            />
          </div>
          <input
            className="article-subtitle"
            value={entity.subtitle}
            placeholder="Add a short subtitle…"
            onChange={(e) => updateEntity(entity.id, { subtitle: e.target.value })}
          />

          <div className="tag-row">
            {entity.tags.map((tag) => (
              <Tag key={tag} tone="neutral" onRemove={() => updateEntity(entity.id, { tags: entity.tags.filter((t) => t !== tag) })}>
                {tag}
              </Tag>
            ))}
            <input
              className="tag-add reset-btn"
              style={{ background: 'none', outline: 'none', width: 90 }}
              placeholder="+ tag"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tagDraft.trim()) {
                  updateEntity(entity.id, { tags: [...entity.tags, tagDraft.trim()] });
                  setTagDraft('');
                }
              }}
            />
          </div>

          <input
            className="article-subtitle"
            style={{ marginBottom: 18, fontSize: 12 }}
            value={entity.aliases.join(', ')}
            placeholder="aka: alternate names, comma separated (matched for auto-linking too)"
            onChange={(e) => updateEntity(entity.id, { aliases: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
          />

          <div className="article-toolbar">
            <button className="btn btn-secondary" onClick={() => setEditing((v) => !v)}>{editing ? 'Done' : 'Edit'}</button>
            <button className="btn btn-ghost" onClick={() => { if (confirm(`Delete "${entity.title}"? This can't be undone.`)) deleteEntity(entity.id); }}>
              Delete
            </button>
          </div>

          {editing ? (
            <textarea
              className="article-editor"
              autoFocus
              value={entity.body}
              placeholder="Write the article. Mentioning another article's name links it automatically."
              onChange={(e) => updateEntity(entity.id, { body: e.target.value })}
            />
          ) : (
            <div className="article-body">
              <LinkedText
                text={entity.body || '_No content yet — click Edit to write something._'}
                excludeId={entity.id}
                onNavigate={onNavigate}
                onSuggestion={onCreateFromSuggestion}
              />
            </div>
          )}

          {bannerPhrase && !editing && (
            <div className="suggestion-banner">
              <SparkleIcon size={17} className="icon" />
              <div className="body">
                <div className="title">1 name in this note isn't linked yet</div>
                <div className="detail">
                  “{bannerPhrase}” — appears in {bannerCount} other {bannerCount === 1 ? 'note' : 'notes'}. Create an article and link them?
                </div>
              </div>
              <button className="btn btn-secondary" onClick={() => setDismissed((d) => new Set(d).add(bannerPhrase))}>Ignore</button>
              <button className="btn btn-primary" onClick={() => onCreateFromSuggestion(bannerPhrase)}>Create &amp; link</button>
            </div>
          )}
        </div>
      </div>

      <BacklinkRail entity={entity} onNavigate={onNavigate} onSuggestion={onCreateFromSuggestion} />
    </div>
  );
}
