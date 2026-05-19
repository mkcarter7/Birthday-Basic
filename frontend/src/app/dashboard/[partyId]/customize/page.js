'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/utils/context/authContext';

const TEMPLATES = [
  { id: 'classic',    label: 'Classic',    emoji: '🎂' },
  { id: 'modern',     label: 'Modern',     emoji: '✨' },
  { id: 'elegant',    label: 'Elegant',    emoji: '🥂' },
  { id: 'playful',    label: 'Playful',    emoji: '🎈' },
  { id: 'minimalist', label: 'Minimalist', emoji: '🕊️' },
];

const FEATURE_TOGGLES = [
  { key: 'enable_rsvp',      label: 'RSVP' },
  { key: 'enable_photos',    label: 'Photos' },
  { key: 'enable_games',     label: 'Games' },
  { key: 'enable_gifts',     label: 'Gift Registry' },
  { key: 'enable_guestbook', label: 'Guest Book' },
  { key: 'enable_timeline',  label: 'Timeline' },
];

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <input
        type="color"
        value={value || '#3B82F6'}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: 36, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 }}
      />
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 12, color: '#888', fontFamily: 'monospace' }}>{value}</div>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, multiline }) {
  const sharedStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: 14,
    fontFamily: 'inherit',
    resize: multiline ? 'vertical' : undefined,
  };
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>{label}</label>
      {multiline
        ? <textarea rows={3} style={sharedStyle} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
        : <input style={sharedStyle} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      }
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}
    >
      <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 99,
          background: checked ? '#3B82F6' : '#D1D5DB',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute',
          top: 3,
          left: checked ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: 'white',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
    </div>
  );
}

export default function CustomizePage() {
  const { partyId } = useParams();
  const { user, userLoading } = useAuth();
  const iframeRef = useRef(null);

  const [configId, setConfigId] = useState(null);
  const [form, setForm] = useState(null);       // local editable copy of SiteConfig
  const [original, setOriginal] = useState(null); // server state — used to detect changes
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');

  const platformDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || '1rockstarsocial.com';

  // ── Load SiteConfig for this party ───────────────────────────────────────
  useEffect(() => {
    if (userLoading || !user || !partyId) return;

    const load = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/site-config?party_id=${partyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setErr('Could not load site config.'); return; }
        const data = await res.json();
        // Django returns a list; find the one for this party
        const configs = Array.isArray(data) ? data : (data.results ?? []);
        const cfg = configs.find((c) => String(c.party_id) === String(partyId)) ?? configs[0];
        if (!cfg) { setErr('No site config found. Is this party active?'); return; }
        setConfigId(cfg.id);
        setForm(cfg);
        setOriginal(cfg);
      } catch {
        setErr('Network error. Please refresh.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, userLoading, partyId]);

  // ── Sync changes to the preview iframe via postMessage ───────────────────
  useEffect(() => {
    if (!form || !iframeRef.current) return;
    iframeRef.current.contentWindow?.postMessage(
      { type: 'preview-update', config: form },
      '*',
    );
  }, [form]);

  // ── Field helpers ─────────────────────────────────────────────────────────
  const set = useCallback((key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  }, []);

  // ── Save to Django ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!configId || !form) return;
    setSaving(true);
    setErr('');
    try {
      const token = await user.getIdToken();
      // Only send writable fields (skip read-only party_* fields)
      const {
        id, party, party_id, party_name, party_date, party_end_time,
        party_location, party_latitude, party_longitude,
        host_email, subdomain, custom_domain, site_status,
        expires_at, is_active, is_expired, created_at, updated_at,
        ...writable
      } = form;

      const res = await fetch(`/api/site-config/${configId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(writable),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || data.detail || 'Save failed.'); return; }
      setOriginal(data);
      setForm(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setErr('Network error. Could not save.');
    } finally {
      setSaving(false);
    }
  };

  const isDirty = form && original && JSON.stringify(form) !== JSON.stringify(original);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  if (userLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <p style={{ color: '#888' }}>Loading customizer…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Please <Link href="/dashboard">sign in</Link>.</p>
      </div>
    );
  }

  if (err && !form) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#DC2626' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <p>{err}</p>
          <Link href="/dashboard" style={{ color: '#3B82F6' }}>← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const previewUrl = form?.subdomain
    ? `https://${form.subdomain}.${platformDomain}?preview=true`
    : null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F9FAFB' }}>
      {/* ── Navbar ── */}
      <nav style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href={`/dashboard/${partyId}`} style={{ color: '#888', textDecoration: 'none', fontSize: 14 }}>← Back</Link>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Customize Site</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {saved && <span style={{ color: '#10B981', fontSize: 14, fontWeight: 600 }}>✓ Saved!</span>}
          {err && <span style={{ color: '#EF4444', fontSize: 13 }}>{err}</span>}
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            style={{
              padding: '9px 22px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              border: 'none',
              cursor: saving || !isDirty ? 'not-allowed' : 'pointer',
              background: isDirty ? '#3B82F6' : '#D1D5DB',
              color: 'white',
              transition: 'background 0.15s',
            }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </nav>

      {/* ── Two-column layout ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left: Controls panel ── */}
        <div style={{
          width: 340,
          flexShrink: 0,
          background: 'white',
          borderRight: '1px solid #E5E7EB',
          overflowY: 'auto',
          padding: '28px 24px',
        }}>

          {form && (
            <>
              <Section title="Template">
                <div style={{ display: 'grid', gap: 8 }}>
                  {TEMPLATES.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => set('template_id', t.id)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: form.template_id === t.id ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                        background: form.template_id === t.id ? '#EEF2FF' : 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontSize: 14,
                        fontWeight: form.template_id === t.id ? 700 : 500,
                      }}
                    >
                      <span>{t.emoji}</span>{t.label}
                      {form.template_id === t.id && <span style={{ marginLeft: 'auto', color: '#3B82F6', fontSize: 16 }}>✓</span>}
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Colors">
                <ColorField label="Primary"   value={form.primary_color}   onChange={(v) => set('primary_color', v)} />
                <ColorField label="Secondary" value={form.secondary_color} onChange={(v) => set('secondary_color', v)} />
                <ColorField label="Accent"    value={form.accent_color}    onChange={(v) => set('accent_color', v)} />
              </Section>

              <Section title="Messaging">
                <TextField label="Welcome message"   value={form.welcome_message}   onChange={(v) => set('welcome_message', v)}   placeholder="Join us for a celebration!" multiline />
                <TextField label="RSVP message"      value={form.rsvp_message}      onChange={(v) => set('rsvp_message', v)}      placeholder="Let us know if you can make it." multiline />
                <TextField label="Gift message"      value={form.gift_message}      onChange={(v) => set('gift_message', v)}      placeholder="Your presence is the best gift!" multiline />
                <TextField label="Thank-you title"   value={form.thank_you_title}   onChange={(v) => set('thank_you_title', v)}   placeholder="Thank You!" />
                <TextField label="Thank-you message" value={form.thank_you_message} onChange={(v) => set('thank_you_message', v)} placeholder="We appreciate your RSVP." multiline />
              </Section>

              <Section title="Links">
                <TextField label="Venmo username"  value={form.venmo_username}   onChange={(v) => set('venmo_username', v)}   placeholder="@YourVenmo" />
                <TextField label="Registry URL"    value={form.registry_url}     onChange={(v) => set('registry_url', v)}     placeholder="https://registry.com/…" />
                <TextField label="Facebook Live URL" value={form.facebook_live_url} onChange={(v) => set('facebook_live_url', v)} placeholder="https://facebook.com/live/…" />
              </Section>

              <Section title="Features">
                {FEATURE_TOGGLES.map(({ key, label }) => (
                  <Toggle key={key} label={label} checked={!!form[key]} onChange={(v) => set(key, v)} />
                ))}
              </Section>
            </>
          )}
        </div>

        {/* ── Right: Live preview iframe ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#E5E7EB', overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', background: '#F3F4F6', borderBottom: '1px solid #E5E7EB', fontSize: 13, color: '#555', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: '#E5E7EB', borderRadius: 6, padding: '4px 10px', fontFamily: 'monospace', fontSize: 12 }}>
              {form?.subdomain ? `${form.subdomain}.${platformDomain}` : 'Preview'}
            </span>
            {previewUrl && (
              <a href={previewUrl} target="_blank" rel="noreferrer" style={{ color: '#3B82F6', textDecoration: 'none', fontSize: 12 }}>Open in new tab ↗</a>
            )}
          </div>

          {previewUrl ? (
            <iframe
              ref={iframeRef}
              src={previewUrl}
              style={{ flex: 1, border: 'none', background: 'white' }}
              title="Site preview"
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', textAlign: 'center', padding: 40 }}>
              <div>
                <div style={{ fontSize: 48, marginBottom: 16 }}>👁️</div>
                <p style={{ marginBottom: 8 }}>Preview unavailable</p>
                <p style={{ fontSize: 13, color: '#aaa' }}>Your site needs a subdomain to show the live preview.</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
