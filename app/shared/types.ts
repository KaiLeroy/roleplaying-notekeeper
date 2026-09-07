// Shared data model — used by both the Electron main process (persistence)
// and the renderer (UI). Kept dependency-free so it can be imported from
// either side without pulling in DOM or Node typings.

export type EntityType = 'character' | 'place' | 'faction' | 'thread' | 'note' | 'object';

export interface Post {
  id: string;
  author: string;
  /** Freeform, matches how play-by-post / Discord timestamps are usually copied in ("2h ago", "Night Three", a real date, ...). */
  when: string;
  body: string;
  createdAt: number;
}

export interface Relation {
  id: string;
  /** Entity id this relation is attached to (the dossier owner). */
  fromId: string;
  toId: string;
  /** Freeform standing label: "trusted", "wary", "owed money", "former"... */
  label: string;
  /** 0-100, drawn as a bar. */
  strength: number;
}

export interface Entity {
  id: string;
  type: EntityType;
  title: string;
  /** Alternate names — matched for auto-linking exactly like the title. */
  aliases: string[];
  /** Short line under the title, e.g. "letter-carrier, formerly Tidewright". */
  subtitle: string;
  tags: string[];
  /** Marks a character as one of the reader's own PCs — shown as a kicker. */
  isPC: boolean;
  /** Plain text, paragraphs separated by a blank line. Mentions of other
   * entities' names/aliases are detected live and rendered as links —
   * nothing extra is stored in the text for that. */
  body: string;
  /** Only meaningful for type 'thread': the session log. */
  posts: Post[];
  /** Only meaningful for characters/factions: manually curated "standing with" bars shown in the dossier. */
  relations: Relation[];
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Campaign {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  entities: Entity[];
}

export interface CampaignSummary {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  entityCount: number;
}

export const ENTITY_TYPE_LABEL: Record<EntityType, string> = {
  character: 'Character',
  place: 'Place',
  faction: 'Faction',
  thread: 'Thread',
  note: 'Note',
  object: 'Object'
};

export const ENTITY_TYPE_PLURAL: Record<EntityType, string> = {
  character: 'Characters',
  place: 'Places',
  faction: 'Factions',
  thread: 'Threads',
  note: 'Notes',
  object: 'Objects'
};
