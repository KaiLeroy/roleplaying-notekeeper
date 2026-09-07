import { app } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Campaign, CampaignSummary } from '../shared/types';

function dataDir(): string {
  return path.join(app.getPath('userData'), 'campaigns');
}

function campaignPath(id: string): string {
  // ids are nanoid-generated on our side, but guard against path traversal regardless.
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(dataDir(), `${safe}.json`);
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
}
