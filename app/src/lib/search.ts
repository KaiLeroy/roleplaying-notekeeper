import type { Campaign, Entity } from '../../shared/types';
import { collectTextBlobs, computeBacklinks, snippetAround } from './linking';

export interface EntityHit {
  entity: Entity;
  backlinkCount: number;
}

export interface PostHit {
  entityId: string;
  entityTitle: string;
  postId?: string;
  locatorLabel: string;
  quote: string;
}

export interface SearchResult {
  entityHits: EntityHit[];
  postHits: PostHit[];
}

export function searchCampaign(campaign: Campaign, rawQuery: string): SearchResult {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return { entityHits: [], postHits: [] };

  const entityHits: EntityHit[] = [];
  for (const e of campaign.entities) {
    const haystack = [e.title, e.subtitle, ...e.aliases, ...e.tags].join(' ').toLowerCase();
    if (haystack.includes(query)) {
      entityHits.push({ entity: e, backlinkCount: computeBacklinks(campaign, e.id).length });
    }
  }
  entityHits.sort((a, b) => {
    const aStarts = a.entity.title.toLowerCase().startsWith(query) ? 0 : 1;
    const bStarts = b.entity.title.toLowerCase().startsWith(query) ? 0 : 1;
    if (aStarts !== bStarts) return aStarts - bStarts;
    return b.backlinkCount - a.backlinkCount;
  });

  const postHits: PostHit[] = [];
  for (const blob of collectTextBlobs(campaign)) {
    if (!blob.text.toLowerCase().includes(query)) continue;
    const label = blob.postId ? blob.entityTitle : blob.entityTitle;
    postHits.push({
      entityId: blob.entityId,
      entityTitle: blob.entityTitle,
      postId: blob.postId,
      locatorLabel: label,
      quote: snippetAround(blob.text, rawQuery.trim())
    });
    if (postHits.length >= 12) break;
  }

  return { entityHits: entityHits.slice(0, 20), postHits };
}
