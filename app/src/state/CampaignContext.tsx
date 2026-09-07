import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ArticleImage, Campaign, Entity, EntityType, Post, Relation } from '../../shared/types';
import { makeId } from '../lib/id';
import { isImageFile } from '../lib/assets';
import {
  buildDictionary, buildMatcher, findSuggestionCandidates
} from '../lib/linking';

interface CampaignContextValue {
  campaign: Campaign;
  matcher: ReturnType<typeof buildMatcher>;
  dict: ReturnType<typeof buildDictionary>;
  suggestions: string[];
  saving: boolean;
  getEntity: (id: string) => Entity | undefined;
  createEntity: (partial: Partial<Entity> & { type: EntityType; title: string }) => Entity;
  updateEntity: (id: string, patch: Partial<Entity>) => void;
  deleteEntity: (id: string) => void;
  addPost: (threadId: string, post: Omit<Post, 'id' | 'createdAt'>) => Post;
  upsertRelation: (entityId: string, relation: Omit<Relation, 'id' | 'fromId'> & { id?: string }) => void;
  renameCampaign: (name: string) => void;
  addImages: (entityId: string, files: File[] | FileList) => Promise<void>;
  removeImage: (entityId: string, imageId: string) => void;
  updateImageCaption: (entityId: string, imageId: string, caption: string) => void;
}

const CampaignCtx = createContext<CampaignContextValue | null>(null);

function nowStamp() { return Date.now(); }

export function emptyEntity(type: EntityType, title: string): Entity {
  const ts = nowStamp();
  return {
    id: makeId(),
    type,
    title,
    aliases: [],
    subtitle: '',
    tags: [],
    isPC: false,
    body: '',
    posts: [],
    relations: [],
    images: [],
    pinned: false,
    createdAt: ts,
    updatedAt: ts
  };
}

export function CampaignProvider({
  initial,
  children
}: {
  initial: Campaign;
  children: React.ReactNode;
}) {
  const [campaign, setCampaign] = useState<Campaign>(initial);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSave = useRef(true); // don't re-save the campaign we just loaded

  useEffect(() => {
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    setSaving(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      window.api.saveCampaign(campaign).finally(() => setSaving(false));
    }, 500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign]);

  const getEntity = useCallback((id: string) => campaign.entities.find((e) => e.id === id), [campaign.entities]);

  const createEntity = useCallback((partial: Partial<Entity> & { type: EntityType; title: string }) => {
    const base = emptyEntity(partial.type, partial.title);
    const entity: Entity = { ...base, ...partial };
    setCampaign((c) => ({ ...c, entities: [...c.entities, entity], updatedAt: nowStamp() }));
    return entity;
  }, []);

  const updateEntity = useCallback((id: string, patch: Partial<Entity>) => {
    setCampaign((c) => ({
      ...c,
      updatedAt: nowStamp(),
      entities: c.entities.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: nowStamp() } : e))
    }));
  }, []);

  const deleteEntity = useCallback((id: string) => {
    setCampaign((c) => ({ ...c, updatedAt: nowStamp(), entities: c.entities.filter((e) => e.id !== id) }));
  }, []);

  const addPost = useCallback((threadId: string, post: Omit<Post, 'id' | 'createdAt'>) => {
    const full: Post = { ...post, id: makeId(), createdAt: nowStamp() };
    setCampaign((c) => ({
      ...c,
      updatedAt: nowStamp(),
      entities: c.entities.map((e) => (e.id === threadId ? { ...e, posts: [...e.posts, full], updatedAt: nowStamp() } : e))
    }));
    return full;
  }, []);

  const upsertRelation = useCallback((entityId: string, relation: Omit<Relation, 'id' | 'fromId'> & { id?: string }) => {
    setCampaign((c) => ({
      ...c,
      updatedAt: nowStamp(),
      entities: c.entities.map((e) => {
        if (e.id !== entityId) return e;
        const exists = relation.id && e.relations.some((r) => r.id === relation.id);
        const relations = exists
          ? e.relations.map((r) => (r.id === relation.id ? { ...r, ...relation, id: r.id, fromId: entityId } : r))
          : [...e.relations, { ...relation, id: relation.id ?? makeId(), fromId: entityId }];
        return { ...e, relations, updatedAt: nowStamp() };
      })
    }));
  }, []);

  const renameCampaign = useCallback((name: string) => {
    setCampaign((c) => ({ ...c, name, updatedAt: nowStamp() }));
  }, []);

  const addImages = useCallback(async (entityId: string, files: File[] | FileList) => {
    const list = Array.from(files).filter(isImageFile);
    if (list.length === 0) return;
    const added: ArticleImage[] = [];
    for (const file of list) {
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const saved = await window.api.addImage(campaign.id, bytes, file.name);
        added.push({ ...saved, caption: '' });
      } catch (err) {
        console.error('Failed to add image', file.name, err);
      }
    }
    if (added.length === 0) return;
    setCampaign((c) => ({
      ...c,
      updatedAt: nowStamp(),
      entities: c.entities.map((e) => (e.id === entityId ? { ...e, images: [...e.images, ...added], updatedAt: nowStamp() } : e))
    }));
  }, [campaign.id]);

  const removeImage = useCallback((entityId: string, imageId: string) => {
    setCampaign((c) => {
      const entity = c.entities.find((e) => e.id === entityId);
      const image = entity?.images.find((i) => i.id === imageId);
      if (image) window.api.deleteImage(c.id, image.filename).catch((err) => console.error('Failed to delete image', err));
      return {
        ...c,
        updatedAt: nowStamp(),
        entities: c.entities.map((e) => (e.id === entityId ? { ...e, images: e.images.filter((i) => i.id !== imageId), updatedAt: nowStamp() } : e))
      };
    });
  }, []);

  const updateImageCaption = useCallback((entityId: string, imageId: string, caption: string) => {
    setCampaign((c) => ({
      ...c,
      updatedAt: nowStamp(),
      entities: c.entities.map((e) => (e.id === entityId
        ? { ...e, updatedAt: nowStamp(), images: e.images.map((i) => (i.id === imageId ? { ...i, caption } : i)) }
        : e))
    }));
  }, []);

  const dict = useMemo(() => buildDictionary(campaign.entities), [campaign.entities]);
  const suggestions = useMemo(() => findSuggestionCandidates(campaign, dict), [campaign, dict]);
  const matcher = useMemo(() => buildMatcher(dict, suggestions), [dict, suggestions]);

  const value: CampaignContextValue = {
    campaign, matcher, dict, suggestions, saving,
    getEntity, createEntity, updateEntity, deleteEntity, addPost, upsertRelation, renameCampaign,
    addImages, removeImage, updateImageCaption
  };

  return <CampaignCtx.Provider value={value}>{children}</CampaignCtx.Provider>;
}

export function useCampaign(): CampaignContextValue {
  const ctx = useContext(CampaignCtx);
  if (!ctx) throw new Error('useCampaign must be used within CampaignProvider');
  return ctx;
}

export { CampaignCtx };
export type { CampaignContextValue };
