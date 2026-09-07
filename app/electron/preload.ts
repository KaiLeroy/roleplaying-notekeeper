import { contextBridge, ipcRenderer } from 'electron';
import type { Campaign, CampaignSummary } from '../shared/types';

interface SavedImage {
  id: string;
  filename: string;
  name: string;
}

const api = {
  listCampaigns: (): Promise<CampaignSummary[]> => ipcRenderer.invoke('campaigns:list'),
  loadCampaign: (id: string): Promise<Campaign> => ipcRenderer.invoke('campaigns:load', id),
  saveCampaign: (campaign: Campaign): Promise<void> => ipcRenderer.invoke('campaigns:save', campaign),
  deleteCampaign: (id: string): Promise<void> => ipcRenderer.invoke('campaigns:delete', id),
  addImage: (campaignId: string, bytes: Uint8Array, originalName: string): Promise<SavedImage> =>
    ipcRenderer.invoke('images:add', campaignId, bytes, originalName),
  deleteImage: (campaignId: string, filename: string): Promise<void> =>
    ipcRenderer.invoke('images:delete', campaignId, filename)
};

contextBridge.exposeInMainWorld('api', api);

export type Api = typeof api;
