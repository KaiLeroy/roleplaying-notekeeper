import React, { useEffect, useState } from 'react';
import type { EntityType } from '../../shared/types';
import { useCampaign } from '../state/CampaignContext';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import ArticleView from './ArticleView';
import ThreadView from './ThreadView';
import MapView from './MapView';
import SearchPalette from './SearchPalette';
import NewEntityDialog from './NewEntityDialog';

type ViewMode = 'wiki' | 'map';
type DialogState = { type: EntityType; title?: string } | null;

export default function Workspace({ onSwitchCampaign }: { onSwitchCampaign: () => void }) {
  const { campaign, saving, getEntity, createEntity } = useCampaign();
  const [viewMode, setViewMode] = useState<ViewMode>('wiki');
  const [selectedId, setSelectedId] = useState<string | null>(campaign.entities[0]?.id ?? null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const navigate = (id: string) => {
    setSelectedId(id);
    setViewMode('wiki');
    setSearchOpen(false);
  };

  const selectedEntity = selectedId ? getEntity(selectedId) ?? null : null;

  return (
    <div className="app-shell">
      <TopBar
        campaignName={campaign.name}
        selectedEntity={viewMode === 'wiki' ? selectedEntity : null}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSearchOpen={() => setSearchOpen(true)}
        onNewNote={() => setDialog({ type: 'note' })}
        onSwitchCampaign={onSwitchCampaign}
        saving={saving}
      />

      <div className="app-layout">
        {viewMode === 'wiki' && (
          <>
            <Sidebar
              selectedId={selectedId}
              onSelect={navigate}
              onCreate={(type) => setDialog({ type })}
            />
            <div className="center-col">
              {selectedEntity ? (
                selectedEntity.type === 'thread' ? (
                  <ThreadView entity={selectedEntity} onNavigate={navigate} />
                ) : (
                  <ArticleView
                    entity={selectedEntity}
                    onNavigate={navigate}
                    onCreateFromSuggestion={(phrase) => setDialog({ type: 'character', title: phrase })}
                  />
                )
              ) : (
                <div className="empty-pane">
                  <div>Nothing selected yet.</div>
                  <button className="btn btn-primary" onClick={() => setDialog({ type: 'character' })}>Create your first article</button>
                </div>
              )}
            </div>
          </>
        )}

        {viewMode === 'map' && <MapView onNavigate={navigate} />}
      </div>

      {searchOpen && (
        <SearchPalette
          onClose={() => setSearchOpen(false)}
          onNavigate={navigate}
          onCreate={(title) => setDialog({ type: 'note', title })}
        />
      )}

      {dialog && (
        <NewEntityDialog
          initialType={dialog.type}
          initialTitle={dialog.title}
          onCancel={() => setDialog(null)}
          onCreate={(title, type) => {
            const created = createEntity({ type, title });
            setDialog(null);
            navigate(created.id);
          }}
        />
      )}
    </div>
  );
}
