// Automatic mention-linking: builds a dictionary of known entity names/aliases,
// scans free text for mentions of them (rendering as links), and separately
// flags repeated proper-noun phrases that *aren't* linked yet as suggestions
// ("this name shows up 3 times — make it an article?").

import type { Campaign, Entity, EntityType } from '../../shared/types';

export interface DictEntry {
  id: string;
  text: string; // the exact alias/title text, for display
  type: EntityType;
}

export interface Segment {
  text: string;
  kind: 'text' | 'link' | 'suggestion' | 'self';
  entityId?: string;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildDictionary(entities: Entity[]): DictEntry[] {
  const entries: DictEntry[] = [];
  for (const e of entities) {
    if (e.type === 'thread') continue; // threads are navigated, not usually mentioned by name in prose
    const names = [e.title, ...e.aliases].map((n) => n.trim()).filter(Boolean);
    for (const n of names) entries.push({ id: e.id, text: n, type: e.type });
  }
  // longest-first so multi-word names win over a shorter alias/substring at the same position
  entries.sort((a, b) => b.text.length - a.text.length);
  return entries;
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'but', 'or', 'if', 'of', 'in', 'on', 'at', 'to', 'for',
  'with', 'as', 'by', 'is', 'it', 'she', 'he', 'they', 'her', 'his', 'their', 'was',
  'were', 'be', 'been', 'no', 'not', 'so', 'that', 'this', 'these', 'those', 'night',
  'i', 'you', 'we', 'my', 'your', 'our'
]);

/** Proper-noun-ish phrases (two or three Capitalized Words in a row) that occur
 * two or more times across the campaign and aren't already a known name. */
export function findSuggestionCandidates(campaign: Campaign, dict: DictEntry[]): string[] {
  const known = new Set(dict.map((d) => d.text.toLowerCase()));
  const counts = new Map<string, string>(); // lowercase -> display-cased form first seen
  const tally = new Map<string, number>();
  const phraseRe = /\b[A-Z][a-zA-Z']*(?:\s+(?:of|the)\s+[A-Z][a-zA-Z']*|\s+[A-Z][a-zA-Z']*){1,2}\b/g;

  const scan = (text: string) => {
    for (const m of text.matchAll(phraseRe)) {
      const phrase = m[0];
      const lower = phrase.toLowerCase();
      if (known.has(lower)) continue;
      const firstWord = phrase.split(/\s+/)[0].toLowerCase();
      if (STOPWORDS.has(firstWord)) continue;
      tally.set(lower, (tally.get(lower) ?? 0) + 1);
      if (!counts.has(lower)) counts.set(lower, phrase);
    }
  };

  for (const e of campaign.entities) {
    if (e.body) scan(e.body);
    if (e.type === 'thread') for (const p of e.posts) scan(p.body);
  }

  const out: string[] = [];
  for (const [lower, n] of tally) {
    if (n >= 2) out.push(counts.get(lower)!);
  }
  return out.sort((a, b) => b.length - a.length);
}

interface Matcher {
  regex: RegExp;
  byLower: Map<string, DictEntry>;
  suggestionLower: Set<string>;
}

export function buildMatcher(dict: DictEntry[], suggestions: string[]): Matcher | null {
  const byLower = new Map<string, DictEntry>();
  for (const d of dict) {
    const lower = d.text.toLowerCase();
    if (!byLower.has(lower)) byLower.set(lower, d);
  }
  const suggestionLower = new Set(suggestions.map((s) => s.toLowerCase()));

  const all = [...dict.map((d) => d.text), ...suggestions];
  if (all.length === 0) return null;
  const uniq = Array.from(new Set(all)).sort((a, b) => b.length - a.length);
  const pattern = uniq.map(escapeRegExp).join('|');
  const regex = new RegExp(`(?<![\\p{L}\\p{N}])(?:${pattern})(?![\\p{L}\\p{N}])`, 'gui');
  return { regex, byLower, suggestionLower };
}

export function segmentText(text: string, matcher: Matcher | null, excludeId?: string): Segment[] {
  if (!text) return [];
  if (!matcher) return [{ text, kind: 'text' }];
  const segments: Segment[] = [];
  let lastIndex = 0;
  for (const m of text.matchAll(matcher.regex)) {
    const idx = m.index ?? 0;
    if (idx > lastIndex) segments.push({ text: text.slice(lastIndex, idx), kind: 'text' });
    const matched = m[0];
    const lower = matched.toLowerCase();
    const entry = matcher.byLower.get(lower);
    if (entry) {
      segments.push(entry.id === excludeId
        ? { text: matched, kind: 'self' }
        : { text: matched, kind: 'link', entityId: entry.id });
    } else {
      segments.push({ text: matched, kind: 'suggestion' });
    }
    lastIndex = idx + matched.length;
  }
  if (lastIndex < text.length) segments.push({ text: text.slice(lastIndex), kind: 'text' });
  return segments;
}

function nameBoundaryRegex(name: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(name)}(?![\\p{L}\\p{N}])`, 'ui');
}

export function textMentionsName(text: string, name: string): boolean {
  if (!text || !name) return false;
  return nameBoundaryRegex(name).test(text);
}

export function countBlobsMentioning(blobs: TextBlob[], name: string, excludeEntityId?: string): number {
  let count = 0;
  for (const b of blobs) {
    if (b.entityId === excludeEntityId) continue;
    if (textMentionsName(b.text, name)) count++;
  }
  return count;
}

export function snippetAround(text: string, name: string, radius = 70): string {
  const re = nameBoundaryRegex(name);
  const m = re.exec(text);
  if (!m) return text.slice(0, radius * 2).trim();
  const start = Math.max(0, m.index - radius);
  const end = Math.min(text.length, m.index + m[0].length + radius);
  let out = text.slice(start, end).trim();
  if (start > 0) out = '…' + out;
  if (end < text.length) out = out + '…';
  return out;
}

export interface Backlink {
  id: string;
  title: string;
  kind: string;
  quote: string;
}

export function computeBacklinks(campaign: Campaign, entityId: string): Backlink[] {
  const target = campaign.entities.find((e) => e.id === entityId);
  if (!target) return [];
  const names = [target.title, ...target.aliases].filter(Boolean);
  const out: Backlink[] = [];
  for (const e of campaign.entities) {
    if (e.id === entityId) continue;
    if (e.type === 'thread') {
      for (const post of e.posts) {
        const hit = names.find((n) => textMentionsName(post.body, n));
        if (hit) {
          out.push({ id: `${e.id}:${post.id}`, title: e.title, kind: 'thread', quote: snippetAround(post.body, hit) });
          break;
        }
      }
    } else {
      const hit = names.find((n) => textMentionsName(e.body, n) || textMentionsName(e.subtitle, n));
      if (hit) {
        out.push({ id: e.id, title: e.title, kind: e.type, quote: snippetAround(e.body || e.subtitle, hit) });
      }
    }
  }
  return out;
}

export function mentionedEntityIds(segments: Segment[]): string[] {
  const ids = new Set<string>();
  for (const s of segments) if (s.kind === 'link' && s.entityId) ids.add(s.entityId);
  return Array.from(ids);
}

export function unlinkedSuggestionsIn(segments: Segment[]): string[] {
  const seen = new Set<string>();
  for (const s of segments) if (s.kind === 'suggestion') seen.add(s.text);
  return Array.from(seen);
}

/** All the plain text a search should scan, paired with a locator. */
export interface TextBlob {
  entityId: string;
  entityTitle: string;
  entityType: EntityType;
  postId?: string;
  text: string;
}

export function collectTextBlobs(campaign: Campaign): TextBlob[] {
  const blobs: TextBlob[] = [];
  for (const e of campaign.entities) {
    if (e.type === 'thread') {
      for (const p of e.posts) {
        blobs.push({ entityId: e.id, entityTitle: e.title, entityType: e.type, postId: p.id, text: p.body });
      }
    } else if (e.body) {
      blobs.push({ entityId: e.id, entityTitle: e.title, entityType: e.type, text: e.body });
    }
  }
  return blobs;
}
