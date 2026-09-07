import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listCampaigns, loadCampaign, saveCampaign, deleteCampaign } from './store';
import type { Campaign } from '../shared/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDev = !!process.env.ELECTRON_RENDERER_URL;

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#161826',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (isDev) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL!);
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

ipcMain.handle('campaigns:list', () => listCampaigns());
ipcMain.handle('campaigns:load', (_e, id: string) => loadCampaign(id));
ipcMain.handle('campaigns:save', (_e, campaign: Campaign) => saveCampaign(campaign));
ipcMain.handle('campaigns:delete', (_e, id: string) => deleteCampaign(id));

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
