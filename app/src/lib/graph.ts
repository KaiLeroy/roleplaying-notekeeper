// Relationship map: derives nodes/edges from mentions, then lays them out
// with a small force-directed relaxation (no dependency needed).

import type { Campaign, Entity } from '../../shared/types';
import { buildDictionary, buildMatcher, segmentText, findSuggestionCandidates, mentionedEntityIds } from './linking';

export type EdgeKind = 'met' | 'mentioned';

export interface GraphEdge {
  a: string;
  b: string;
  kind: EdgeKind;
}

export interface GraphNode {
  id: string;
  name: string;
  type: Entity['type'];
  x: number; // percentage, 0-100
  y: number; // percentage, 0-100
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function computeGraph(campaign: Campaign): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const linkable = campaign.entities.filter((e) => e.type === 'character' || e.type === 'faction');
  const linkableIds = new Set(linkable.map((e) => e.id));
  const dict = buildDictionary(campaign.entities);
  const suggestions = findSuggestionCandidates(campaign, dict);
  const matcher = buildMatcher(dict, suggestions);

  const edgeKind = new Map<string, EdgeKind>();
  const setMet = (a: string, b: string) => {
    if (a === b) return;
    edgeKind.set(pairKey(a, b), 'met');
  };
  const setMentioned = (a: string, b: string) => {
    if (a === b) return;
    const key = pairKey(a, b);
    if (!edgeKind.has(key)) edgeKind.set(key, 'mentioned');
  };

  for (const e of campaign.entities) {
    if (e.type === 'thread') {
      for (const post of e.posts) {
        const segs = segmentText(post.body, matcher);
        const mentioned = mentionedEntityIds(segs).filter((id) => linkableIds.has(id));
        for (let i = 0; i < mentioned.length; i++) {
          for (let j = i + 1; j < mentioned.length; j++) setMet(mentioned[i], mentioned[j]);
        }
      }
    } else {
      const segs = segmentText(e.body, matcher, e.id);
      const mentioned = mentionedEntityIds(segs).filter((id) => linkableIds.has(id));
      if (linkableIds.has(e.id)) {
        for (const m of mentioned) setMentioned(e.id, m);
      }
      for (let i = 0; i < mentioned.length; i++) {
        for (let j = i + 1; j < mentioned.length; j++) setMentioned(mentioned[i], mentioned[j]);
      }
    }
  }

  const edges: GraphEdge[] = Array.from(edgeKind.entries()).map(([key, kind]) => {
    const [a, b] = key.split('|');
    return { a, b, kind };
  });

  const connected = new Set<string>();
  for (const edge of edges) { connected.add(edge.a); connected.add(edge.b); }
  const nodeEntities = linkable.filter((e) => connected.has(e.id));

  const positions = layout(nodeEntities.map((e) => e.id), edges);
  const nodes: GraphNode[] = nodeEntities.map((e) => ({
    id: e.id,
    name: e.title,
    type: e.type,
    x: positions.get(e.id)?.x ?? 50,
    y: positions.get(e.id)?.y ?? 50
  }));

  return { nodes, edges };
}

/** Minimal Fruchterman-Reingold-style layout onto a 0-100 x 0-100 plane. */
function layout(ids: string[], edges: GraphEdge[]): Map<string, { x: number; y: number }> {
  const pos = new Map<string, { x: number; y: number }>();
  const n = ids.length;
  if (n === 0) return pos;
  const size = 100;
  const center = size / 2;
  // deterministic starting positions on a circle, so re-renders are stable
  ids.forEach((id, i) => {
    const angle = (2 * Math.PI * i) / n;
    const r = size * 0.32;
    pos.set(id, { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) });
  });
  if (n === 1) return pos;

  const k = size / Math.sqrt(n) * 0.9;
  const idIndex = new Map(ids.map((id, i) => [id, i]));
  const disp = ids.map(() => ({ x: 0, y: 0 }));

  for (let iter = 0; iter < 220; iter++) {
    for (const d of disp) { d.x = 0; d.y = 0; }
    // repulsion
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const pi = pos.get(ids[i])!, pj = pos.get(ids[j])!;
        let dx = pi.x - pj.x, dy = pi.y - pj.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const force = (k * k) / dist;
        dx = (dx / dist) * force; dy = (dy / dist) * force;
        disp[i].x += dx; disp[i].y += dy;
        disp[j].x -= dx; disp[j].y -= dy;
      }
    }
    // attraction along edges
    for (const e of edges) {
      const i = idIndex.get(e.a); const j = idIndex.get(e.b);
      if (i === undefined || j === undefined) continue;
      const pi = pos.get(e.a)!, pj = pos.get(e.b)!;
      let dx = pi.x - pj.x, dy = pi.y - pj.y;
      let dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const force = (dist * dist) / k;
      dx = (dx / dist) * force; dy = (dy / dist) * force;
      disp[i].x -= dx; disp[i].y -= dy;
      disp[j].x += dx; disp[j].y += dy;
    }
    // centering pull + apply, with cooling
    const temp = Math.max(0.5, 10 * (1 - iter / 220));
    for (let i = 0; i < n; i++) {
      const p = pos.get(ids[i])!;
      disp[i].x += (center - p.x) * 0.01;
      disp[i].y += (center - p.y) * 0.01;
      const dlen = Math.sqrt(disp[i].x ** 2 + disp[i].y ** 2) || 0.01;
      const capped = Math.min(dlen, temp);
      p.x += (disp[i].x / dlen) * capped;
      p.y += (disp[i].y / dlen) * capped;
      p.x = Math.min(size - 8, Math.max(8, p.x));
      p.y = Math.min(size - 8, Math.max(8, p.y));
    }
  }
  return pos;
}
