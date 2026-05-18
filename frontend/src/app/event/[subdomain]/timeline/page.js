'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { useParty } from '@/utils/context/partyContext';

const FALLBACK_TIMELINE = [
  { id: 'fallback-1830', time: '18:30', activity: 'Doors Open & Check‑in', icon: '🚪', description: '' },
  { id: 'fallback-1900', time: '19:00', activity: 'Happy Birthday Toast', icon: '🥂', description: '' },
  { id: 'fallback-1930', time: '19:30', activity: 'Dinner is Served', icon: '🍽️', description: '' },
  { id: 'fallback-2015', time: '20:15', activity: 'Games & Photo Booth', icon: '🎯', description: '' },
  { id: 'fallback-2100', time: '21:00', activity: 'Cake Cutting', icon: '🎂', description: '' },
  { id: 'fallback-2130', time: '21:30', activity: 'Dancing', icon: '🕺', description: '' },
  { id: 'fallback-2245', time: '22:45', activity: 'Farewell & Party Favors', icon: '🎁', description: '' },
];

const formatTime = (time) => {
  if (!time) return '';
  try {
    const [hours, minutes] = time.split(':').map((v) => parseInt(v, 10));
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
    return new Date(Date.UTC(1970, 0, 1, hours, minutes)).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' });
  } catch {
    return time;
  }
};

export default function TimelinePage() {
  const config = useParty();
  const [events, setEvents] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
    if (!apiBase || !config.id) {
      setLoading(false);
      return;
    }

    fetch(`${apiBase}/api/parties/${config.id}/`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(`Timeline request failed with status ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const rawEvents = Array.isArray(data?.timeline_events) ? data.timeline_events : [];
        const mapped = rawEvents
          .filter((e) => e && (e.is_active === undefined || e.is_active === true))
          .map((e) => ({
            id: e.id ?? `${e.time}-${e.activity}`,
            time: typeof e.time === 'string' ? e.time : '',
            activity: e.activity || e.title || 'Scheduled event',
            description: e.description || '',
            icon: e.icon || '',
          }));
        setEvents(mapped);
      })
      .catch((err) => {
        console.error('Failed to load party timeline', err);
        setFetchError(err.message || 'Unknown error');
      })
      .finally(() => setLoading(false));
  }, [config.id]);

  const hasRemoteEvents = events.length > 0;
  const displayEvents = (hasRemoteEvents ? events : FALLBACK_TIMELINE)
    .slice()
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <main className="page">
      <PageHeader title="Timeline" subtitle="Schedule and party highlights" />
      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <div style={{ fontWeight: 700 }}>Party Schedule</div>
        {loading && <p className="muted" style={{ margin: 0 }}>Loading schedule…</p>}
        {!loading && fetchError && (
          <p className="muted" style={{ margin: 0 }}>
            Showing the default schedule because the live timeline could not be loaded. ({fetchError})
          </p>
        )}
        {!loading && !hasRemoteEvents && !fetchError && (
          <p className="muted" style={{ margin: 0 }}>
            Timeline coming soon. Check back for the latest schedule updates.
          </p>
        )}
        {!loading && (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
            {displayEvents.map((item) => (
              <li key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 72, fontWeight: 700 }}>{formatTime(item.time)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span aria-hidden>{item.icon || '🎉'}</span>
                    <span>{item.activity}</span>
                  </div>
                  {item.description ? <p className="muted" style={{ margin: '4px 0 0 0' }}>{item.description}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="muted" style={{ margin: 0 }}>Times are approximate and subject to change.</p>
      </div>
    </main>
  );
}
