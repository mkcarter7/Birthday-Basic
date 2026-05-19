'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/utils/context/authContext';

const TIER_LABELS = {
  self_service: 'Self-Service',
  guided: 'Guided',
  full_service: 'Full Service',
};

const STATUS_COLORS = {
  active: { bg: '#D1FAE5', text: '#065F46', label: 'Active' },
  pending_payment: { bg: '#FEF3C7', text: '#92400E', label: 'Pending Payment' },
  expired: { bg: '#F3F4F6', text: '#6B7280', label: 'Expired' },
  suspended: { bg: '#FEE2E2', text: '#991B1B', label: 'Suspended' },
};

function PartyCard({ party }) {
  const platformDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || '1rockstarsocial.com';
  const sub = party.subscription;
  const statusInfo = STATUS_COLORS[party.site_status] || STATUS_COLORS.pending_payment;

  const eventDate = party.date
    ? new Date(party.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div style={{
      background: 'white',
      border: '1px solid #E5E7EB',
      borderRadius: 16,
      padding: 28,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 4 }}>{party.name}</div>
          {eventDate && <div style={{ color: '#888', fontSize: 14 }}>{eventDate}</div>}
        </div>
        <span style={{
          background: statusInfo.bg,
          color: statusInfo.text,
          padding: '4px 12px',
          borderRadius: 99,
          fontSize: 12,
          fontWeight: 700,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {statusInfo.label}
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <Stat label="RSVPs" value={party.total_rsvps ?? '—'} />
        <Stat label="Attending" value={party.attending_count ?? '—'} />
        <Stat label="Plan" value={sub ? TIER_LABELS[sub.tier] || sub.tier : '—'} />
        {party.subdomain && (
          <Stat
            label="URL"
            value={
              <a
                href={`https://${party.subdomain}.${platformDomain}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#3B82F6', textDecoration: 'none', fontWeight: 600 }}
              >
                {party.subdomain}.{platformDomain} ↗
              </a>
            }
          />
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
        <Link
          href={`/dashboard/${party.id}`}
          style={{ padding: '9px 18px', borderRadius: 8, fontWeight: 600, fontSize: 14, background: '#1F2937', color: 'white', textDecoration: 'none' }}
        >
          Manage →
        </Link>
        <Link
          href={`/dashboard/${party.id}/customize`}
          style={{ padding: '9px 18px', borderRadius: 8, fontWeight: 600, fontSize: 14, background: 'white', color: '#3B82F6', border: '1px solid #3B82F6', textDecoration: 'none' }}
        >
          Customize
        </Link>
        {party.subdomain && party.site_status === 'active' && (
          <a
            href={`https://${party.subdomain}.${platformDomain}`}
            target="_blank"
            rel="noreferrer"
            style={{ padding: '9px 18px', borderRadius: 8, fontWeight: 600, fontSize: 14, background: '#EEF2FF', color: '#4338CA', textDecoration: 'none' }}
          >
            View Site ↗
          </a>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, userLoading, signIn } = useAuth();
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (userLoading) return;
    if (!user) return; // show sign-in prompt

    const load = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/parties?hosted_by=me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setErr('Could not load your events.'); return; }
        const data = await res.json();
        setParties(Array.isArray(data) ? data : (data.results ?? []));
      } catch {
        setErr('Network error. Please refresh.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, userLoading]);

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      {/* Navbar */}
      <nav style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: 20, color: '#3B82F6', textDecoration: 'none' }}>🎉 1RockstarSocial</Link>
        {user && (
          <span style={{ fontSize: 14, color: '#555' }}>{user.displayName || user.email}</span>
        )}
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800 }}>Your Events</h1>
          <Link
            href="/signup"
            style={{ background: '#3B82F6', color: 'white', padding: '12px 22px', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
          >
            + New Event
          </Link>
        </div>

        {/* Not signed in */}
        {!userLoading && !user && (
          <div style={{ textAlign: 'center', padding: '64px 24px', background: 'white', borderRadius: 16, border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Sign in to view your dashboard</h2>
            <p style={{ color: '#555', marginBottom: 28 }}>Access your event sites, manage RSVPs, and customize your pages.</p>
            <button
              onClick={() => signIn()}
              style={{ padding: '14px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer' }}
            >
              Sign in with Google
            </button>
          </div>
        )}

        {/* Loading */}
        {userLoading || (user && loading) ? (
          <div style={{ textAlign: 'center', padding: 64, color: '#888' }}>Loading your events…</div>
        ) : null}

        {/* Error */}
        {err && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '14px 18px', color: '#DC2626', marginBottom: 24 }}>
            {err}
          </div>
        )}

        {/* Empty state */}
        {!loading && !err && user && parties.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 24px', background: 'white', borderRadius: 16, border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎊</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>No events yet</h2>
            <p style={{ color: '#555', marginBottom: 28 }}>Create your first event site and start sharing with guests.</p>
            <Link
              href="/signup"
              style={{ background: '#3B82F6', color: 'white', padding: '14px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
            >
              Create Your First Event →
            </Link>
          </div>
        )}

        {/* Party cards */}
        {!loading && parties.length > 0 && (
          <div style={{ display: 'grid', gap: 20 }}>
            {parties.map((p) => <PartyCard key={p.id} party={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
