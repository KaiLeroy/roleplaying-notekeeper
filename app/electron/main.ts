import { app, BrowserWindow, ipcMain, protocol, net } from 'electron';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  listCampaigns, loadCampaign, saveCampaign, deleteCampaign,
  saveImageAsset, deleteImageAsset, resolveAssetPath
} from './store';
import type { Campaign } from '../shared/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDev = !!process.env.ELECTRON_RENDERER_URL;

const ASSET_SCHEME = 'rpnotes-asset';

// Must run before app is ready. Serves saved images to the renderer at
// rpnotes-asset://<campaignId>/<filename> without exposing the filesystem.
protocol.registerSchemesAsPrivileged([
  { scheme: ASSET_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }
]);

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

ipcMain.handle('images:add', (_e, campaignId: string, bytes: Uint8Array, originalName: string) =>
  saveImageAsset(campaignId, bytes, originalName));
ipcMain.handle('images:delete', (_e, campaignId: string, filename: string) =>
  deleteImageAsset(campaignId, filename));

app.whenReady().then(() => {
  protocol.handle(ASSET_SCHEME, (request) => {
    const url = new URL(request.url);
    const campaignId = url.hostname;
    const filename = decodeURIComponent(url.pathname.replace(/^\//, ''));
    const filePath = resolveAssetPath(campaignId, filename);
    return net.fetch(pathToFileURL(filePath).toString());
  });

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
