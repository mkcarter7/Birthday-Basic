'use client';

import PageHeader from '@/components/PageHeader';
import { useParty } from '@/utils/context/partyContext';

const HOUR_MS = 60 * 60 * 1000;

function parseEndTimeStr(dateBase, timeStr) {
  if (!timeStr || !timeStr.trim()) return null;
  const date = new Date(dateBase);
  if (Number.isNaN(date.getTime())) return null;

  const meridiemMatch = timeStr.trim().match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (meridiemMatch) {
    let hours = parseInt(meridiemMatch[1], 10);
    const minutes = meridiemMatch[2] ? parseInt(meridiemMatch[2], 10) : 0;
    const meridiem = meridiemMatch[3].toUpperCase();
    if (hours === 12) hours = meridiem === 'AM' ? 0 : 12;
    else if (meridiem === 'PM') hours += 12;
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
  return null;
}

function formatToGoogle(dt) {
  return dt.toISOString().replace(/[-:]|\.\d{3}/g, '');
}

function buildGoogleUrl(evt) {
  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const dates = `${formatToGoogle(evt.start)}/${formatToGoogle(evt.end)}`;
  const params = new URLSearchParams({
    text: evt.title,
    dates,
    details: evt.description,
    location: evt.location,
  });
  return `${base}&${params.toString()}`;
}

function buildOutlookUrl(evt) {
  const base = 'https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent';
  const params = new URLSearchParams({
    subject: evt.title,
    body: evt.description,
    location: evt.location,
    startdt: evt.start.toISOString(),
    enddt: evt.end.toISOString(),
  });
  return `${base}&${params.toString()}`;
}

function buildICS(evt) {
  const formatToICS = (dt) => dt.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//1RockstarSocial//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
    `DTSTART:${formatToICS(evt.start)}`, `DTEND:${formatToICS(evt.end)}`,
    `SUMMARY:${evt.title}`, `DESCRIPTION:${evt.description}`,
    `LOCATION:${evt.location}`, `DTSTAMP:${formatToICS(new Date())}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  return new Blob([ics], { type: 'text/calendar;charset=utf-8' });
}

export default function CalendarPage() {
  const config = useParty();

  // Use _rawDate (ISO string) directly for the start — it already has the exact start time
  const start = config._rawDate ? new Date(config._rawDate) : new Date();

  // Try to extract end time from the display time string (e.g. "7:00 PM - 11:00 PM")
  const timeSegments = config.time?.split('-') || [];
  const endTimeStr = timeSegments.length > 1 ? timeSegments[timeSegments.length - 1].trim() : null;
  const parsedEnd = endTimeStr ? parseEndTimeStr(start.toISOString().split('T')[0], endTimeStr) : null;
  const end = parsedEnd && parsedEnd > start ? parsedEnd : new Date(start.getTime() + 2 * HOUR_MS);

  const eventDetails = {
    title: config.name,
    description: config.welcomeMessage,
    location: config.location,
    start,
    end,
  };

  const googleUrl = buildGoogleUrl(eventDetails);
  const outlookUrl = buildOutlookUrl(eventDetails);
  const eventSlug = config.name
    ? config.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    : 'party';

  const handleAppleDownload = () => {
    const blob = buildICS(eventDetails);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventSlug}-calendar.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="page">
      <PageHeader title="Add to Calendar" subtitle={`Save ${config.name} to your calendar`} />
      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <a className="tile tile-blue" style={{ height: 64 }} href={googleUrl} target="_blank" rel="noreferrer">
          Add to Google Calendar
        </a>
        <a className="tile tile-indigo" style={{ height: 64 }} href={outlookUrl} target="_blank" rel="noreferrer">
          Add to Outlook
        </a>
        <button type="button" className="tile tile-purple" style={{ height: 64, border: 'none' }} onClick={handleAppleDownload}>
          Download .ics for Apple Calendar
        </button>
        <p className="muted" style={{ margin: 0 }}>
          Times are in your local timezone. You can adjust date/time in your calendar app after adding.
        </p>
      </div>
    </main>
  );
}
