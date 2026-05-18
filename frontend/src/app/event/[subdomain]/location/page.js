'use client';

import PageHeader from '@/components/PageHeader';
import { useParty } from '@/utils/context/partyContext';

export default function LocationPage() {
  const config = useParty();

  return (
    <main className="page">
      <PageHeader title="Location" subtitle="Directions and parking information" />
      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <div style={{ fontWeight: 700 }}>Venue</div>
        <div>{config.venueName || config.location}</div>
        <div style={{ fontWeight: 700, marginTop: 8 }}>Address</div>
        <div>{config.location}</div>
        <div style={{ borderRadius: 12, overflow: 'hidden' }}>
          <iframe title="Google Map" width="100%" height="320" style={{ border: 0 }} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" src={`https://www.google.com/maps?q=${encodeURIComponent(config.location)}&output=embed`} />
        </div>
        <a className="tile tile-green" style={{ height: 48, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(config.location)}`} target="_blank" rel="noreferrer">
          Open in Google Maps
        </a>
      </div>
    </main>
  );
}
