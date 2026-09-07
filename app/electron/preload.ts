import { contextBridge, ipcRenderer } from 'electron';
import type { Campaign, CampaignSummary } from '../shared/types';

const api = {
  listCampaigns: (): Promise<CampaignSummary[]> => ipcRenderer.invoke('campaigns:list'),
  loadCampaign: (id: string): Promise<Campaign> => ipcRenderer.invoke('campaigns:load', id),
  saveCampaign: (campaign: Campaign): Promise<void> => ipcRenderer.invoke('campaigns:save', campaign),
  deleteCampaign: (id: string): Promise<void> => ipcRenderer.invoke('campaigns:delete', id)
};

contextBridge.exposeInMainWorld('api', api);

export type Api = typeof api;
