/** Builds the rpnotes-asset:// URL the main process's protocol handler serves
 * saved images from (see electron/main.ts). Never build this path by hand
 * elsewhere — route through here so the scheme/encoding stay in one place. */
export function assetUrl(campaignId: string, filename: string): string {
  return `rpnotes-asset://${campaignId}/${encodeURIComponent(filename)}`;
}

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}
