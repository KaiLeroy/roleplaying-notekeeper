import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Entity } from '../../shared/types';
import { useCampaign } from '../state/CampaignContext';
import { segmentText, mentionedEntityIds, unlinkedSuggestionsIn } from '../lib/linking';
import { initials, relativeTime } from '../lib/id';
import LinkedText from './LinkedText';
import Tag from './Tag';
import SelectionPopover from './SelectionPopover';
import MentionHighlightTextarea from './MentionHighlightTextarea';

interface PopoverState { text: string; x: number; y: number; }

export default function ThreadView({
  entity,
  onNavigate
}: {
  entity: Entity;
  onNavigate: (id: string) => void;
}) {
  const { campaign, matcher, updateEntity, addPost, createEntity, getEntity } = useCampaign();
  const columnRef = useRef<HTMLDivElement>(null);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [composeAuthor, setComposeAuthor] = useState('you');
  const [composeBody, setComposeBody] = useState('');

  useEffect(() => {
    if (!popover) return;
    const close = () => setPopover(null);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [popover]);

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
    const text = sel.toString().trim();
    if (!text || text.length > 100) return;
    const range = sel.getRangeAt(0);
    if (!columnRef.current?.contains(range.commonAncestorContainer)) return;
    const rect = range.getBoundingClientRect();
    setPopover({ text, x: rect.left, y: rect.bottom + 8 });
  };

  const draftSegments = useMemo(() => segmentText(entity.body, matcher, entity.id), [entity.body, entity.id, matcher]);
  const draftLinked = useMemo(() => mentionedEntityIds(draftSegments), [draftSegments]);
  const draftSuggested = useMemo(() => unlinkedSuggestionsIn(draftSegments), [draftSegments]);

  const saveToThread = () => {
    if (!composeBody.trim() && !entity.body.trim()) return;
    const body = entity.body.trim() || composeBody;
    addPost(entity.id, { author: composeAuthor || 'you', when: 'just now', body });
    updateEntity(entity.id, { body: '' });
    setComposeBody('');
  };

  const openAsArticle = () => {
    if (!entity.body.trim()) return;
    const title = entity.body.trim().split(/\n/)[0].slice(0, 60) || 'Untitled note';
    const created = createEntity({ type: 'note', title, body: entity.body, tags: [`from:${entity.title}`] });
    updateEntity(entity.id, { body: '' });
    onNavigate(created.id);
  };

  const submitPost = () => {
    if (!composeBody.trim()) return;
    addPost(entity.id, { author: composeAuthor || 'you', when: 'just now', body: composeBody.trim() });
    setComposeBody('');
  };

  return (
    <div className="thread-shell">
      <div className="thread-column" ref={columnRef} onMouseUp={handleMouseUp}>
        <div style={{ maxWidth: 720 }}>
          <div className="kicker">Thread · {entity.posts.length} post{entity.posts.length === 1 ? '' : 's'}</div>
          <input
            className="article-title"
            style={{ fontSize: 26 }}
            value={entity.title}
            placeholder="Untitled thread"
            onChange={(e) => updateEntity(entity.id, { title: e.target.value })}
          />
          <input
            className="article-subtitle"
            style={{ marginBottom: 14 }}
            value={entity.subtitle}
            placeholder="What's this scene? (optional)"
            onChange={(e) => updateEntity(entity.id, { subtitle: e.target.value })}
          />
        </div>

        {entity.posts.length === 0 && (
          <div className="muted-2" style={{ fontSize: 13 }}>No posts logged yet. Paste the session below as it happens, or write directly into the draft on the right.</div>
        )}

        {entity.posts.map((post) => (
          <div className="post" key={post.id}>
            <div className="post-avatar">{initials(post.author)}</div>
            <div className="post-min0">
              <div className="post-head">
                <span className="post-author">{post.author}</span>
                <span className="post-when">{post.when === 'just now' ? relativeTime(post.createdAt) : post.when}</span>
              </div>
              <div className="post-body">
                <LinkedText text={post.body} onNavigate={onNavigate} onSuggestion={() => { /* select the word instead to act on it */ }} paragraphs={false} />
              </div>
            </div>
          </div>
        ))}

        <div className="compose-row">
          <div className="post-avatar">{initials(composeAuthor || '?')}</div>
          <div className="post-min0" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              className="input"
              style={{ width: 160, height: 28, minHeight: 28, fontSize: 12 }}
              value={composeAuthor}
              onChange={(e) => setComposeAuthor(e.target.value)}
              placeholder="Speaker"
            />
            <textarea
              className="compose-input"
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              placeholder="Log a post to this thread… (select any word once it's posted to link or create an article from it)"
              onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submitPost(); }}
            />
            <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={submitPost} disabled={!composeBody.trim()}>
              Post <span className="popover-hint" style={{ marginLeft: 6 }}>⌘↵</span>
            </button>
          </div>
        </div>
      </div>

      <div className="capture-pane">
        <div className="capture-head">
          <span className="eyebrow">Draft note · {entity.title || 'this thread'}</span>
          <span className="tag tag-neutral" style={{ marginLeft: 'auto' }}>autosaved</span>
        </div>
        <MentionHighlightTextarea
          value={entity.body}
          onChange={(v) => updateEntity(entity.id, { body: v })}
          excludeId={entity.id}
          placeholder="Jot down what's happening as you read — names you mention link automatically once an article exists for them."
        />
        <div className="capture-footer">
          <span className="muted-2" style={{ fontSize: 11 }}>Linked as you typed</span>
          <div className="capture-links">
            {draftLinked.map((id) => {
              const e = getEntity(id);
              return e ? <Tag key={id} tone="accent" onClick={() => onNavigate(id)}>{e.title}</Tag> : null;
            })}
            {draftSuggested.map((s) => <Tag key={s} tone="outline">{s} · new</Tag>)}
            {draftLinked.length === 0 && draftSuggested.length === 0 && (
              <span className="muted-3" style={{ fontSize: 11 }}>Nothing yet</span>
            )}
          </div>
          <div className="capture-actions">
            <button className="btn btn-primary btn-block" style={{ margin: 0 }} onClick={saveToThread} disabled={!entity.body.trim()}>
              Save to thread
            </button>
            <button className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }} onClick={openAsArticle} disabled={!entity.body.trim()}>
              Open as article
            </button>
          </div>
        </div>
      </div>

      {popover && (
        <SelectionPopover
          text={popover.text}
          x={popover.x}
          y={popover.y}
          entities={campaign.entities.filter((e) => e.type !== 'thread')}
          onClose={() => setPopover(null)}
          onCreateCharacter={() => {
            createEntity({ type: 'character', title: popover.text });
            setPopover(null);
          }}
          onLinkExisting={(id) => {
            const target = getEntity(id);
            if (target && !target.aliases.some((a) => a.toLowerCase() === popover.text.toLowerCase()) && target.title.toLowerCase() !== popover.text.toLowerCase()) {
              updateEntity(id, { aliases: [...target.aliases, popover.text] });
            }
            setPopover(null);
          }}
          onQuote={() => {
            const created = createEntity({ type: 'note', title: `Quote — ${popover.text.slice(0, 40)}`, body: popover.text, tags: [`from:${entity.title}`] });
            onNavigate(created.id);
            setPopover(null);
          }}
        />
      )}
    </div>
  );
}
