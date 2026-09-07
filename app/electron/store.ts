import { app } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Campaign, CampaignSummary } from '../shared/types';

function dataDir(): string {
  return path.join(app.getPath('userData'), 'campaigns');
}

function safeId(id: string): string {
  // ids are nanoid-generated on our side, but guard against path traversal regardless.
  return id.replace(/[^a-zA-Z0-9_-]/g, '');
}

function campaignPath(id: string): string {
  return path.join(dataDir(), `${safeId(id)}.json`);
}

function assetsDir(campaignId: string): string {
  return path.join(dataDir(), `${safeId(campaignId)}-assets`);
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(dataDir(), { recursive: true });
}

export async function listCampaigns(): Promise<CampaignSummary[]> {
  await ensureDir();
  const files = await fs.readdir(dataDir());
  const summaries: CampaignSummary[] = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const raw = await fs.readFile(path.join(dataDir(), file), 'utf-8');
      const campaign = JSON.parse(raw) as Campaign;
      summaries.push({
        id: campaign.id,
        name: campaign.name,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
        entityCount: campaign.entities.length
      });
    } catch {
      // skip unreadable/corrupt files rather than failing the whole list
    }
  }
  summaries.sort((a, b) => b.updatedAt - a.updatedAt);
  return summaries;
}

export async function loadCampaign(id: string): Promise<Campaign> {
  const raw = await fs.readFile(campaignPath(id), 'utf-8');
  return JSON.parse(raw) as Campaign;
}

export async function saveCampaign(campaign: Campaign): Promise<void> {
  await ensureDir();
  const tmp = campaignPath(campaign.id) + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(campaign, null, 2), 'utf-8');
  await fs.rename(tmp, campaignPath(campaign.id));
}

export async function deleteCampaign(id: string): Promise<void> {
  await fs.rm(campaignPath(id), { force: true });
  await fs.rm(assetsDir(id), { recursive: true, force: true });
}

const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp']);

export interface SavedImage {
  id: string;
  filename: string;
  name: string;
}

export async function saveImageAsset(campaignId: string, bytes: Uint8Array, originalName: string): Promise<SavedImage> {
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new Error(`Image is too large (max ${MAX_IMAGE_BYTES / (1024 * 1024)}MB)`);
  }
  const ext = path.extname(originalName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(`Unsupported image type "${ext || '(none)'}"`);
  }
  const dir = assetsDir(campaignId);
  await fs.mkdir(dir, { recursive: true });
  const id = randomUUID();
  const filename = `${id}${ext}`;
  await fs.writeFile(path.join(dir, filename), bytes);
  return { id, filename, name: originalName };
}

export async function deleteImageAsset(campaignId: string, filename: string): Promise<void> {
  const safeFilename = path.basename(filename);
  await fs.rm(path.join(assetsDir(campaignId), safeFilename), { force: true });
}

/** Resolves a requested filename to an absolute path inside the campaign's asset
 * folder, for the rpnotes-asset:// protocol handler — never outside it. */
export function resolveAssetPath(campaignId: string, filename: string): string {
  return path.join(assetsDir(campaignId), path.basename(filename));
}
