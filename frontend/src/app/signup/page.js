'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/utils/context/authContext';

const STORAGE_KEY = 'signup_wizard';

const TIERS = [
  {
    id: 'self_service',
    label: 'Self-Service',
    price: 99,
    badge: 'Most Popular',
    features: ['All features included', 'Your own subdomain', 'Community support', '60 days live after event'],
    highlight: true,
  },
  {
    id: 'guided',
    label: 'Guided',
    price: 229,
    badge: null,
    features: ['Everything in Self-Service', '48-hour email support', 'Onboarding checklist'],
    highlight: false,
  },
  {
    id: 'full_service',
    label: 'Full Service',
    price: 399,
    badge: null,
    features: ['Everything in Guided', 'Priority support', 'Dedicated setup assistance'],
    highlight: false,
  },
];

const TEMPLATES = [
  { id: 'classic',    label: 'Classic',    desc: 'Warm and familiar — the original look.',       emoji: '🎂' },
  { id: 'modern',     label: 'Modern',     desc: 'Dark, sleek, and bold.',                       emoji: '✨' },
  { id: 'elegant',    label: 'Elegant',    desc: 'Soft golds, serif fonts, refined details.',    emoji: '🥂' },
  { id: 'playful',    label: 'Playful',    desc: 'Bold colors and rounded shapes — pure fun.',   emoji: '🎈' },
  { id: 'minimalist', label: 'Minimalist', desc: 'Clean lines, lots of whitespace, calm feel.',  emoji: '🕊️' },
];

const EMPTY_WIZARD = {
  tier: '',
  eventName: '',
  eventDate: '',
  venueName: '',
  location: '',
  subdomain: '',
  templateId: 'classic',
};

function loadWizard() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY_WIZARD, ...JSON.parse(raw) } : { ...EMPTY_WIZARD };
  } catch {
    return { ...EMPTY_WIZARD };
  }
}

function saveWizard(data) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

// ── Individual step components ──────────────────────────────────────────────

function StepTier({ wizard, setWizard, onNext }) {
  return (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Choose your plan</h2>
      <p style={{ color: '#555', marginBottom: 32 }}>All plans include every feature. The difference is support.</p>
      <div style={{ display: 'grid', gap: 16 }}>
        {TIERS.map((t) => (
          <div
            key={t.id}
            onClick={() => setWizard((w) => ({ ...w, tier: t.id }))}
            style={{
              padding: '20px 24px',
              borderRadius: 14,
              border: wizard.tier === t.id ? '2px solid #3B82F6' : '1px solid #E5E7EB',
              background: wizard.tier === t.id ? '#EEF2FF' : 'white',
              cursor: 'pointer',
              position: 'relative',
              transition: 'border-color 0.15s',
            }}
          >
            {t.badge && (
              <span style={{ position: 'absolute', top: -11, left: 20, background: '#3B82F6', color: 'white', padding: '2px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
                {t.badge}
              </span>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{t.label}</div>
              <div style={{ fontWeight: 800, fontSize: 24, color: '#3B82F6' }}>${t.price}</div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
              {t.features.map((f) => (
                <li key={f} style={{ display: 'flex', gap: 8, fontSize: 14, color: '#444' }}>
                  <span style={{ color: '#10B981', fontWeight: 700 }}>✓</span>{f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <button
        onClick={onNext}
        disabled={!wizard.tier}
        style={{ marginTop: 32, width: '100%', padding: '15px 0', borderRadius: 10, fontWeight: 700, fontSize: 16, border: 'none', cursor: wizard.tier ? 'pointer' : 'not-allowed', background: wizard.tier ? '#3B82F6' : '#D1D5DB', color: 'white', transition: 'background 0.15s' }}
      >
        Continue →
      </button>
    </div>
  );
}

function StepSignIn({ onNext }) {
  const { user, userLoading, signIn } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [err, setErr] = useState('');

  // Auto-advance when already signed in
  useEffect(() => {
    if (!userLoading && user) onNext();
  }, [user, userLoading, onNext]);

  const handleSignIn = async () => {
    setSigningIn(true);
    setErr('');
    try {
      await signIn();
      // onNext fires via the useEffect above once user is set
    } catch (e) {
      setErr('Sign-in failed. Please try again.');
      setSigningIn(false);
    }
  };

  if (userLoading) {
    return <div style={{ textAlign: 'center', padding: 48, color: '#555' }}>Loading…</div>;
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🔐</div>
      <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Create your account</h2>
      <p style={{ color: '#555', marginBottom: 32, lineHeight: 1.6 }}>
        Sign in to save your event site and manage it later from your dashboard.
      </p>
      {err && <p style={{ color: '#EF4444', marginBottom: 16, fontSize: 14 }}>{err}</p>}
      <button
        onClick={handleSignIn}
        disabled={signingIn}
        style={{ padding: '14px 32px', borderRadius: 10, fontWeight: 700, fontSize: 16, border: '1px solid #E5E7EB', background: 'white', cursor: signingIn ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10 }}
      >
        <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
        {signingIn ? 'Opening sign-in…' : 'Continue with Google'}
      </button>
    </div>
  );
}

function StepEventDetails({ wizard, setWizard, onNext, onBack }) {
  const valid = wizard.eventName.trim() && wizard.eventDate;
  return (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Your event details</h2>
      <p style={{ color: '#555', marginBottom: 28 }}>Tell us a little about your celebration.</p>

      <label style={labelStyle}>Event name *</label>
      <input
        style={inputStyle}
        placeholder="e.g. Sarah's 30th Birthday Bash"
        value={wizard.eventName}
        onChange={(e) => setWizard((w) => ({ ...w, eventName: e.target.value }))}
      />

      <label style={labelStyle}>Event date *</label>
      <input
        type="date"
        style={inputStyle}
        value={wizard.eventDate}
        onChange={(e) => setWizard((w) => ({ ...w, eventDate: e.target.value }))}
      />

      <label style={labelStyle}>Venue name</label>
      <input
        style={inputStyle}
        placeholder="e.g. The Grand Ballroom"
        value={wizard.venueName}
        onChange={(e) => setWizard((w) => ({ ...w, venueName: e.target.value }))}
      />

      <label style={labelStyle}>Address</label>
      <input
        style={inputStyle}
        placeholder="e.g. 123 Main St, New York, NY"
        value={wizard.location}
        onChange={(e) => setWizard((w) => ({ ...w, location: e.target.value }))}
      />

      <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
        <button onClick={onBack} style={backBtnStyle}>← Back</button>
        <button onClick={onNext} disabled={!valid} style={{ ...nextBtnStyle, background: valid ? '#3B82F6' : '#D1D5DB', cursor: valid ? 'pointer' : 'not-allowed' }}>
          Continue →
        </button>
      </div>
    </div>
  );
}

function StepSubdomain({ wizard, setWizard, onNext, onBack }) {
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(null); // null | true | false
  const [reason, setReason] = useState('');

  const platformDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || '1rockstarsocial.com';

  const checkAvailability = useCallback(async (slug) => {
    if (!slug || slug.length < 3) { setAvailable(null); return; }
    setChecking(true);
    try {
      const res = await fetch(`/api/signup/check-subdomain?subdomain=${encodeURIComponent(slug)}`);
      const data = await res.json();
      setAvailable(data.available === true);
      setReason(data.reason || '');
    } catch {
      setAvailable(null);
    } finally {
      setChecking(false);
    }
  }, []);

  // Debounce: wait 500ms after the user stops typing before hitting the API
  useEffect(() => {
    setAvailable(null);
    const t = setTimeout(() => checkAvailability(wizard.subdomain), 500);
    return () => clearTimeout(t);
  }, [wizard.subdomain, checkAvailability]);

  const slugify = (val) =>
    val.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  const canContinue = wizard.subdomain.length >= 3 && available === true;

  return (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Pick your URL</h2>
      <p style={{ color: '#555', marginBottom: 28 }}>This is the link you'll share with guests.</p>

      <label style={labelStyle}>Subdomain *</label>
      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #D1D5DB', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
        <input
          style={{ flex: 1, padding: '13px 16px', border: 'none', outline: 'none', fontSize: 16 }}
          placeholder="sarahs-birthday"
          value={wizard.subdomain}
          onChange={(e) => setWizard((w) => ({ ...w, subdomain: slugify(e.target.value) }))}
          maxLength={63}
        />
        <span style={{ padding: '13px 16px', background: '#F9FAFB', color: '#888', fontSize: 14, whiteSpace: 'nowrap', borderLeft: '1px solid #E5E7EB' }}>
          .{platformDomain}
        </span>
      </div>

      {wizard.subdomain.length >= 3 && (
        <p style={{ fontSize: 14, color: checking ? '#888' : available ? '#10B981' : '#EF4444', marginBottom: 4 }}>
          {checking && '⏳ Checking…'}
          {!checking && available === true && '✓ That URL is available!'}
          {!checking && available === false && `✗ ${reason || 'That URL is already taken.'}`}
        </p>
      )}
      {wizard.subdomain.length > 0 && wizard.subdomain.length < 3 && (
        <p style={{ fontSize: 13, color: '#888' }}>Minimum 3 characters.</p>
      )}

      <p style={{ marginTop: 16, color: '#888', fontSize: 13 }}>
        Your guests will visit: <strong>{wizard.subdomain || 'yourname'}.{platformDomain}</strong>
      </p>

      <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
        <button onClick={onBack} style={backBtnStyle}>← Back</button>
        <button onClick={onNext} disabled={!canContinue} style={{ ...nextBtnStyle, background: canContinue ? '#3B82F6' : '#D1D5DB', cursor: canContinue ? 'pointer' : 'not-allowed' }}>
          Continue →
        </button>
      </div>
    </div>
  );
}

function StepTemplate({ wizard, setWizard, onNext, onBack }) {
  return (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Choose a design</h2>
      <p style={{ color: '#555', marginBottom: 28 }}>You can change this any time from your dashboard.</p>

      <div style={{ display: 'grid', gap: 12 }}>
        {TEMPLATES.map((t) => (
          <div
            key={t.id}
            onClick={() => setWizard((w) => ({ ...w, templateId: t.id }))}
            style={{
              padding: '16px 20px',
              borderRadius: 12,
              border: wizard.templateId === t.id ? '2px solid #3B82F6' : '1px solid #E5E7EB',
              background: wizard.templateId === t.id ? '#EEF2FF' : 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              transition: 'border-color 0.15s',
            }}
          >
            <span style={{ fontSize: 32 }}>{t.emoji}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{t.label}</div>
              <div style={{ color: '#666', fontSize: 14 }}>{t.desc}</div>
            </div>
            {wizard.templateId === t.id && (
              <span style={{ marginLeft: 'auto', color: '#3B82F6', fontWeight: 700, fontSize: 18 }}>✓</span>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
        <button onClick={onBack} style={backBtnStyle}>← Back</button>
        <button onClick={onNext} style={{ ...nextBtnStyle, background: '#3B82F6', cursor: 'pointer' }}>
          Continue →
        </button>
      </div>
    </div>
  );
}

function StepPayment({ wizard, onBack }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const tier = TIERS.find((t) => t.id === wizard.tier);

  const handlePay = async () => {
    setLoading(true);
    setErr('');
    try {
      const token = await user.getIdToken();

      // 1. Create the Party record in Django
      const partyRes = await fetch('/api/signup/party', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: wizard.eventName,
          date: wizard.eventDate,
          venue_name: wizard.venueName,
          location: wizard.location,
        }),
      });
      const partyData = await partyRes.json();
      if (!partyRes.ok) {
        setErr(partyData.error || partyData.detail || 'Could not create your event. Please try again.');
        setLoading(false);
        return;
      }
      const partyId = partyData.id;

      // 2. Create Stripe Checkout Session
      const checkoutRes = await fetch('/api/signup/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          party_id: partyId,
          tier: wizard.tier,
          template_id: wizard.templateId,
          subdomain: wizard.subdomain,
        }),
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) {
        setErr(checkoutData.error || checkoutData.detail || 'Could not start checkout. Please try again.');
        setLoading(false);
        return;
      }

      // 3. Clear wizard state and redirect to Stripe
      try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      window.location.href = checkoutData.checkout_url;
    } catch (e) {
      setErr(`Something went wrong: ${e.message}`);
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Review & pay</h2>
      <p style={{ color: '#555', marginBottom: 28 }}>You'll be taken to Stripe's secure checkout to complete your purchase.</p>

      {/* Summary card */}
      <div style={{ background: '#F9FAFB', borderRadius: 14, padding: 24, marginBottom: 28, border: '1px solid #E5E7EB' }}>
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            ['Plan', tier?.label],
            ['Event', wizard.eventName],
            ['Date', wizard.eventDate],
            ['URL', `${wizard.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || '1rockstarsocial.com'}`],
            ['Template', TEMPLATES.find((t) => t.id === wizard.templateId)?.label],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
              <span style={{ color: '#666' }}>{label}</span>
              <span style={{ fontWeight: 600 }}>{value || '—'}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #E5E7EB', marginTop: 8, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18 }}>
            <span>Total (one-time)</span>
            <span style={{ color: '#3B82F6' }}>${tier?.price}</span>
          </div>
        </div>
      </div>

      {err && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', color: '#DC2626', fontSize: 14, marginBottom: 20 }}>
          {err}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onBack} disabled={loading} style={{ ...backBtnStyle, opacity: loading ? 0.5 : 1 }}>← Back</button>
        <button
          onClick={handlePay}
          disabled={loading}
          style={{ flex: 1, padding: '15px 0', borderRadius: 10, fontWeight: 700, fontSize: 16, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: loading ? '#D1D5DB' : '#3B82F6', color: 'white' }}
        >
          {loading ? 'Preparing checkout…' : `Complete Setup — $${tier?.price}`}
        </button>
      </div>

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#888' }}>
        🔒 Secure payment via Stripe. No card stored on our servers.
      </p>
    </div>
  );
}

// ── Shared button styles ────────────────────────────────────────────────────
const labelStyle = { display: 'block', fontWeight: 600, fontSize: 14, color: '#374151', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 15, outline: 'none', marginBottom: 18, boxSizing: 'border-box' };
const backBtnStyle = { padding: '14px 22px', borderRadius: 10, fontWeight: 600, fontSize: 15, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', whiteSpace: 'nowrap' };
const nextBtnStyle = { flex: 1, padding: '14px 0', borderRadius: 10, fontWeight: 700, fontSize: 16, border: 'none', color: 'white' };

// ── Progress bar ────────────────────────────────────────────────────────────
function ProgressBar({ step, total }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: '#888' }}>
        <span>Step {step} of {total}</span>
        <span>{pct}%</span>
      </div>
      <div style={{ height: 6, background: '#E5E7EB', borderRadius: 99 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: '#3B82F6', borderRadius: 99, transition: 'width 0.3s ease' }} />
      </div>
    </div>
  );
}

// ── Main wizard content (needs useSearchParams → must be inside Suspense) ──
const TOTAL_STEPS = 6;

function WizardContent() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [wizard, setWizardState] = useState(EMPTY_WIZARD);
  const [hydrated, setHydrated] = useState(false);

  // Load from sessionStorage once on the client
  useEffect(() => {
    const saved = loadWizard();
    const tierParam = searchParams.get('tier');
    setWizardState({
      ...saved,
      tier: saved.tier || tierParam || '',
    });
    setHydrated(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Wrap setWizardState so every update also saves to sessionStorage
  const setWizard = useCallback((updater) => {
    setWizardState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveWizard(next);
      return next;
    });
  }, []);

  const next = useCallback(() => setStep((s) => Math.min(s + 1, TOTAL_STEPS)), []);
  const back = useCallback(() => setStep((s) => Math.max(s - 1, 1)), []);

  if (!hydrated) return null;

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '48px 24px 80px' }}>
      <ProgressBar step={step} total={TOTAL_STEPS} />

      {step === 1 && <StepTier       wizard={wizard} setWizard={setWizard} onNext={next} />}
      {step === 2 && <StepSignIn     onNext={next} />}
      {step === 3 && <StepEventDetails wizard={wizard} setWizard={setWizard} onNext={next} onBack={back} />}
      {step === 4 && <StepSubdomain  wizard={wizard} setWizard={setWizard} onNext={next} onBack={back} />}
      {step === 5 && <StepTemplate   wizard={wizard} setWizard={setWizard} onNext={next} onBack={back} />}
      {step === 6 && <StepPayment    wizard={wizard} onBack={back} />}
    </div>
  );
}

// ── Page shell ──────────────────────────────────────────────────────────────
export default function SignupPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <nav style={{ padding: '16px 32px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: 20, color: '#3B82F6', textDecoration: 'none' }}>🎉 1RockstarSocial</Link>
        <Link href="/pricing" style={{ color: '#555', fontSize: 14, textDecoration: 'none' }}>View pricing</Link>
      </nav>
      <Suspense fallback={<div style={{ textAlign: 'center', padding: 48, color: '#555' }}>Loading…</div>}>
        <WizardContent />
      </Suspense>
    </div>
  );
}
