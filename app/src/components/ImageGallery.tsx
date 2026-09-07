import React, { useRef, useState } from 'react';
import type { ArticleImage } from '../../shared/types';
import { assetUrl } from '../lib/assets';
import { useCampaign } from '../state/CampaignContext';
import { PlusIcon, XIcon } from './icons';

export default function ImageGallery({ entityId, images }: { entityId: string; images: ArticleImage[] }) {
  const { campaign, addImages, removeImage, updateImageCaption } = useCampaign();
  const [dragOver, setDragOver] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      await addImages(entityId, files);
    } finally {
      setBusy(false);
    }
  };

  const active = images.find((i) => i.id === lightbox) ?? null;

  return (
    <div
      className={`image-gallery${dragOver ? ' drag-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <div className="image-gallery-head">
        <span className="eyebrow rail-label" style={{ margin: 0 }}>Images{images.length > 0 ? ` · ${images.length}` : ''}</span>
        <button className="btn btn-ghost" style={{ marginLeft: 'auto', fontSize: 12 }} onClick={() => fileInput.current?.click()} disabled={busy}>
          <PlusIcon size={12} /> {busy ? 'Adding…' : 'Add image'}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
        />
      </div>

      {images.length === 0 ? (
        <div className="image-dropzone-empty">Drop images here, or use "Add image"</div>
      ) : (
        <div className="image-grid">
          {images.map((img) => (
            <div className="image-tile" key={img.id}>
              <button className="reset-btn image-tile-frame" onClick={() => setLightbox(img.id)} title={img.name}>
                <img src={assetUrl(campaign.id, img.filename)} alt={img.caption || img.name} loading="lazy" />
              </button>
              <button
                className="reset-btn image-remove-btn"
                title="Remove image"
                onClick={() => removeImage(entityId, img.id)}
              >
                <XIcon size={11} />
              </button>
              <input
                className="image-caption-input"
                placeholder="Caption…"
                value={img.caption}
                onChange={(e) => updateImageCaption(entityId, img.id, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      {active && (
        <div className="lightbox-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setLightbox(null); }}>
          <button className="reset-btn lightbox-close" onClick={() => setLightbox(null)} aria-label="Close">
            <XIcon size={16} />
          </button>
          <img className="lightbox-img" src={assetUrl(campaign.id, active.filename)} alt={active.caption || active.name} />
          {active.caption && <div className="lightbox-caption">{active.caption}</div>}
        </div>
      )}
    </div>
  );
}
