import React, { useCallback, useEffect, useState } from 'react';
import type { Campaign, CampaignSummary } from '../shared/types';
import { makeId } from './lib/id';
import { CampaignProvider } from './state/CampaignContext';
import Welcome from './components/Welcome';
import Workspace from './components/Workspace';

export default function App() {
  const [campaigns, setCampaigns] = useState<CampaignSummary[] | null>(null);
  const [active, setActive] = useState<Campaign | null>(null);

  const refresh = useCallback(() => {
    window.api.listCampaigns().then(setCampaigns);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const openCampaign = (id: string) => {
    window.api.loadCampaign(id).then(setActive);
  };

  const createCampaign = (name: string) => {
    const ts = Date.now();
    const campaign: Campaign = { id: makeId(), name, createdAt: ts, updatedAt: ts, entities: [] };
    window.api.saveCampaign(campaign).then(() => setActive(campaign));
  };

  const switchCampaign = () => {
    setActive(null);
    refresh();
  };

  if (active) {
    return (
      <CampaignProvider key={active.id} initial={active}>
        <Workspace onSwitchCampaign={switchCampaign} />
      </CampaignProvider>
    );
  }

  if (campaigns === null) {
    return <div className="welcome-shell"><span className="muted">Loading…</span></div>;
  }

  return <Welcome campaigns={campaigns} onOpen={openCampaign} onCreate={createCampaign} />;
}
