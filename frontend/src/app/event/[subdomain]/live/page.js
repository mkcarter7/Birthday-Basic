'use client';

import PageHeader from '@/components/PageHeader';
import { useParty } from '@/utils/context/partyContext';

export default function LivePage() {
  const config = useParty();

  return (
    <main className="page">
      <PageHeader title="Watch Live" subtitle="Join the livestream during the party" />
      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <p>Tap below to open the livestream on Facebook:</p>
        <a href={config.facebookLive} target="_blank" rel="noreferrer" className="tile tile-blue" style={{ height: 56, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          Open Facebook Live
        </a>
        <p className="muted" style={{ margin: 0 }}>
          Link opens in a new tab/app.
        </p>
      </div>
    </main>
  );
}
