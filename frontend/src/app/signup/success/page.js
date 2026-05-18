'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/utils/context/authContext';

function SuccessContent() {
  const searchParams = useSearchParams();
  const { user, userLoading } = useAuth();
  const sessionId = searchParams.get('session_id') || '';

  const [status, setStatus] = useState('polling'); // 'polling' | 'active' | 'timeout' | 'error'
  const [subdomain, setSubdomain] = useState('');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!sessionId || userLoading || !user) return;

    if (attempts >= 12) {
      setStatus('timeout');
      return;
    }

    const poll = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/signup/subscription?session_id=${encodeURIComponent(sessionId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setStatus('error'); return; }

        const data = await res.json();
        const sub = Array.isArray(data) ? data[0] : data;

        if (sub?.status === 'active') {
          setSubdomain(sub?.party?.subdomain || sub?.subdomain || '');
          setStatus('active');
        } else {
          setAttempts((n) => n + 1);
        }
      } catch {
        setAttempts((n) => n + 1);
      }
    };

    const timer = setTimeout(poll, 2000);
    return () => clearTimeout(timer);
  }, [sessionId, user, userLoading, attempts]);

  const platformDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || '1rockstarsocial.com';

  if (userLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ color: '#555' }}>Loading…</p>
      </div>
    );
  }

  if (status === 'active') {
    return (
      <div style={{ textAlign: 'center', padding: '64px 24px' }}>
        <div style={{ fontSize: 80, marginBottom: 24 }}>🎉</div>
        <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 12 }}>Your site is live!</h1>
        <p style={{ fontSize: 18, color: '#555', marginBottom: 32 }}>
          Congratulations! Your event site is ready to share with guests.
        </p>
        {subdomain && (
          <div style={{ background: '#EEF2FF', padding: '16px 24px', borderRadius: 12, display: 'inline-block', marginBottom: 32 }}>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Your event site URL</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#3B82F6' }}>
              {subdomain}.{platformDomain}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {subdomain && (
            <a
              href={`https://${subdomain}.${platformDomain}`}
              target="_blank"
              rel="noreferrer"
              style={{ background: '#3B82F6', color: 'white', padding: '14px 28px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}
            >
              View Your Site →
            </a>
          )}
          <Link
            href="/dashboard"
            style={{ background: '#1F2937', color: 'white', padding: '14px 28px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'timeout') {
    return (
      <div style={{ textAlign: 'center', padding: '64px 24px' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>⏳</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Still processing…</h1>
        <p style={{ color: '#555', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.6 }}>
          Your payment was received but the site is taking a moment to activate. Please wait a minute and then check your dashboard.
        </p>
        <Link
          href="/dashboard"
          style={{ background: '#3B82F6', color: 'white', padding: '14px 28px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ textAlign: 'center', padding: '64px 24px' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>⚠️</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Something went wrong</h1>
        <p style={{ color: '#555', marginBottom: 24 }}>We could not verify your payment. Please contact support.</p>
        <Link href="/" style={{ color: '#3B82F6', textDecoration: 'none' }}>← Back to Home</Link>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '64px 24px' }}>
      <div style={{ fontSize: 64, marginBottom: 24 }}>✅</div>
      <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>Payment received!</h1>
      <p style={{ color: '#555', marginBottom: 32, fontSize: 16 }}>
        Activating your event site… this only takes a few seconds.
      </p>
      <div style={{
        width: 48,
        height: 48,
        border: '4px solid #E5E7EB',
        borderTopColor: '#3B82F6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <nav style={{ padding: '16px 32px', borderBottom: '1px solid #f0f0f0' }}>
        <span style={{ fontWeight: 800, fontSize: 20, color: '#3B82F6' }}>🎉 1RockstarSocial</span>
      </nav>
      <Suspense fallback={<div style={{ textAlign: 'center', padding: 48, color: '#555' }}>Loading…</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
