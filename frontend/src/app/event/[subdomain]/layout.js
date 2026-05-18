/**
 * Event Site Layout — Server Component
 *
 * This layout is the entry point for every page under a customer's event subdomain.
 * It runs on the server (no 'use client' directive), which means it can:
 *   - Use async/await to fetch data before the page renders
 *   - Access environment variables that aren't prefixed with NEXT_PUBLIC_
 *   - Call notFound() to show a 404 before any JavaScript is sent to the browser
 *
 * How it gets invoked:
 *   Middleware rewrites sarah-party.1rockstarsocial.com/rsvp
 *               →      /event/sarah-party/rsvp  (internally)
 *   Next.js then matches this path to /event/[subdomain]/layout.js
 *   and sets params.subdomain = "sarah-party".
 *
 * Why fetch here instead of in each page?
 *   The SiteConfig is needed by every event page (for party ID, colors, etc.).
 *   Fetching it once in the layout avoids duplicating the same fetch in 15 pages.
 *   All child pages automatically inherit it via PartyContext.
 */

import { notFound } from 'next/navigation';
import PartyShell from '@/components/event/PartyShell';
import { adaptConfig } from '@/utils/adaptConfig';

async function getSiteConfig(subdomain) {
  // Use the server-side API URL (not the public one, so it works in SSR/build).
  // Falls back to the public URL if the private one isn't set.
  const apiBase =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8000';

  try {
    const res = await fetch(
      `${apiBase}/api/site-config/by_subdomain/?subdomain=${encodeURIComponent(subdomain)}`,
      {
        // Cache for 60 seconds on the server.
        // This means the server won't re-fetch Django on every single page visit —
        // it serves cached data for up to 60 seconds, then re-validates.
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const raw = await getSiteConfig(params.subdomain);
  if (!raw) return { title: 'Event Not Found' };
  return {
    title: raw.party_name || 'Event Site',
    description: raw.welcome_message || 'Join us for an unforgettable celebration!',
    icons: { icon: '/icon.png' },
  };
}

export default async function EventLayout({ children, params }) {
  const raw = await getSiteConfig(params.subdomain);

  // If the subdomain doesn't exist or the party is inactive → show 404.
  if (!raw || !raw.is_active) {
    notFound();
  }

  // Convert the Django snake_case response to the camelCase shape
  // that PartyContext and all event pages expect.
  const config = adaptConfig(raw);

  return (
    <PartyShell config={config}>
      {children}
    </PartyShell>
  );
}
