import React from 'react';
import type { Entity } from '../../shared/types';
import { ENTITY_TYPE_LABEL } from '../../shared/types';
import { SearchIcon, WikiIcon, MapIcon } from './icons';

export default function TopBar({
  campaignName,
  selectedEntity,
  viewMode,
  onViewModeChange,
  onSearchOpen,
  onNewNote,
  onSwitchCampaign,
  saving
}: {
  campaignName: string;
  selectedEntity: Entity | null;
  viewMode: 'wiki' | 'map';
  onViewModeChange: (m: 'wiki' | 'map') => void;
  onSearchOpen: () => void;
  onNewNote: () => void;
  onSwitchCampaign: () => void;
  saving: boolean;
}) {
  return (
    <div className="app-titlebar">
      <button className="reset-btn brand" onClick={onSwitchCampaign} title="Switch campaign">{campaignName}</button>

      {viewMode === 'wiki' && selectedEntity && (
        <div className="breadcrumb">
          <span>{ENTITY_TYPE_LABEL[selectedEntity.type]}</span>
          <span>/</span>
          <span className="current">{selectedEntity.title || 'Untitled'}</span>
        </div>
      )}

      <div className="seg-btn-row">
        <button className={`reset-btn seg-btn${viewMode === 'wiki' ? ' active' : ''}`} onClick={() => onViewModeChange('wiki')}>
          <WikiIcon size={13} /> Wiki
        </button>
        <button className={`reset-btn seg-btn${viewMode === 'map' ? ' active' : ''}`} onClick={() => onViewModeChange('map')}>
          <MapIcon size={13} /> Map
        </button>
      </div>

      <div className="titlebar-actions">
        {saving && <span className="muted-3" style={{ fontSize: 11 }}>Saving…</span>}
        <button className="search-trigger" onClick={onSearchOpen}>
          <SearchIcon size={14} />
          Search notes
          <span className="kbd" style={{ marginLeft: 'auto' }}>⌘K</span>
        </button>
        <button className="btn btn-primary" onClick={onNewNote}>New note</button>
      </div>
    </div>
  );
}
