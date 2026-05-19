'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import AdminDashboard from '@/components/AdminDashboard';
import { useAuth } from '@/utils/context/authContext';

export default function PartyDashboardPage() {
  const { partyId } = useParams();
  const { user, userLoading, signIn } = useAuth();

  if (userLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <p style={{ color: '#888' }}>Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Sign in required</h2>
          <button
            onClick={() => signIn()}
            style={{ padding: '13px 26px', borderRadius: 10, fontWeight: 700, fontSize: 15, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer' }}
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      {/* Navbar */}
      <nav style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/dashboard" style={{ color: '#888', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>← Dashboard</Link>
        <span style={{ color: '#D1D5DB' }}>|</span>
        <Link
          href={`/dashboard/${partyId}/customize`}
          style={{ color: '#3B82F6', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}
        >
          Customize Site
        </Link>
      </nav>

      {/* AdminDashboard receives partyId from the URL so it scopes all API calls to this party */}
      <AdminDashboard partyId={partyId} />
    </div>
  );
}
