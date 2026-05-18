'use client';

import Link from 'next/link';

const FEATURES = [
  { icon: '👥', title: 'RSVP Tracking', desc: 'Know exactly who is coming. Guests RSVP with guest counts, dietary notes, and more.' },
  { icon: '📸', title: 'Photo Sharing', desc: 'Guests upload memories in real time. Build a shared gallery everyone can enjoy.' },
  { icon: '🏆', title: 'Games & Points', desc: 'Party trivia and leaderboards keep guests engaged before, during, and after.' },
  { icon: '🎁', title: 'Gift Registry', desc: 'Link your registry and Venmo so gifting is always one tap away.' },
  { icon: '💬', title: 'Guest Book', desc: 'Collect heartfelt messages from everyone who attends — a keepsake forever.' },
  { icon: '🎨', title: 'Custom Themes', desc: 'Choose from 5 professional templates and set your own colors and photos.' },
];

const TIERS = [
  {
    id: 'self_service',
    label: 'Self-Service',
    price: 99,
    badge: 'Most Popular',
    features: ['Your own subdomain', 'All features included', 'Community support forum', 'Works for any event type'],
    cta: 'Get Started',
    highlight: true,
  },
  {
    id: 'guided',
    label: 'Guided',
    price: 229,
    badge: null,
    features: ['Everything in Self-Service', '48-hour email support', 'Onboarding checklist', 'Ideal for busy hosts'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    id: 'full_service',
    label: 'Full Service',
    price: 399,
    badge: null,
    features: ['Everything in Guided', 'Priority support', 'Dedicated setup assistance', 'White-glove experience'],
    cta: 'Get Started',
    highlight: false,
  },
];

export default function MarketingHome() {
  return (
    <div style={{ minHeight: '100vh', background: 'white', color: '#111' }}>

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 32px',
        borderBottom: '1px solid #f0f0f0',
        background: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <span style={{ fontWeight: 800, fontSize: 20, color: '#3B82F6' }}>🎉 1RockstarSocial</span>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/pricing" style={{ color: '#555', textDecoration: 'none', fontWeight: 500 }}>
            Pricing
          </Link>
          <Link
            href="/signup"
            style={{
              background: '#3B82F6',
              color: 'white',
              padding: '10px 22px',
              borderRadius: 8,
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: 14,
            }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section style={{
        textAlign: 'center',
        padding: '96px 24px 80px',
        background: 'linear-gradient(180deg, #EEF2FF 0%, white 100%)',
      }}>
        <div style={{
          display: 'inline-block',
          background: '#EEF2FF',
          color: '#4338CA',
          padding: '6px 16px',
          borderRadius: 99,
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 24,
        }}>
          Birthdays · Graduations · Weddings · Any Celebration
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, lineHeight: 1.15, margin: '0 0 20px' }}>
          Beautiful Event Sites<br />
          <span style={{ color: '#3B82F6' }}>in Minutes</span>
        </h1>
        <p style={{ fontSize: 18, color: '#555', maxWidth: 540, margin: '0 auto 40px', lineHeight: 1.6 }}>
          Forget expensive designers and complicated builders. Share your event details, collect RSVPs, host photos, and more — all from one gorgeous page your guests will love.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/signup"
            style={{
              background: '#3B82F6',
              color: 'white',
              padding: '16px 32px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 16,
              textDecoration: 'none',
            }}
          >
            Create Your Event Site →
          </Link>
          <Link
            href="/pricing"
            style={{
              background: 'white',
              color: '#3B82F6',
              border: '2px solid #3B82F6',
              padding: '16px 32px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 16,
              textDecoration: 'none',
            }}
          >
            See Pricing
          </Link>
        </div>
        <p style={{ marginTop: 20, fontSize: 13, color: '#888' }}>
          Starting at $99 · Your own subdomain · No monthly fees
        </p>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 36, fontWeight: 800, marginBottom: 8 }}>Everything you need</h2>
        <p style={{ textAlign: 'center', color: '#555', marginBottom: 48, fontSize: 16 }}>
          One site. Every feature your celebration deserves.
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24,
        }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{
              padding: 28,
              borderRadius: 16,
              border: '1px solid #E5E7EB',
              background: '#FAFAFA',
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{f.title}</div>
              <div style={{ color: '#555', lineHeight: 1.6, fontSize: 15 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: '#F9FAFB' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 36, fontWeight: 800, marginBottom: 8 }}>Up and running in 3 steps</h2>
          <p style={{ textAlign: 'center', color: '#555', marginBottom: 56, fontSize: 16 }}>No design skills needed.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
            {[
              { step: '1', title: 'Pick your plan', desc: 'Choose the tier that fits your needs. All plans include every feature.' },
              { step: '2', title: 'Customize your site', desc: 'Add your event details, pick a template, and upload your photos.' },
              { step: '3', title: 'Share the link', desc: 'Share your unique subdomain with guests. They RSVP, view photos, and more.' },
            ].map((s) => (
              <div key={s.step} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: '#3B82F6',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 22,
                  margin: '0 auto 16px',
                }}>
                  {s.step}
                </div>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{s.title}</div>
                <div style={{ color: '#555', lineHeight: 1.6, fontSize: 15 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 36, fontWeight: 800, marginBottom: 8 }}>Simple, one-time pricing</h2>
        <p style={{ textAlign: 'center', color: '#555', marginBottom: 48, fontSize: 16 }}>
          Pay once. Your site stays live for 60 days after the event.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {TIERS.map((t) => (
            <div
              key={t.id}
              style={{
                padding: 32,
                borderRadius: 20,
                border: t.highlight ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                background: t.highlight ? '#EEF2FF' : 'white',
                position: 'relative',
              }}
            >
              {t.badge && (
                <div style={{
                  position: 'absolute',
                  top: -14,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#3B82F6',
                  color: 'white',
                  padding: '4px 16px',
                  borderRadius: 99,
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}>
                  {t.badge}
                </div>
              )}
              <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>{t.label}</div>
              <div style={{ fontSize: 48, fontWeight: 800, color: '#3B82F6', marginBottom: 4 }}>
                ${t.price}
              </div>
              <div style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>one-time payment</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'grid', gap: 10 }}>
                {t.features.map((f) => (
                  <li key={f} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 15, color: '#333' }}>
                    <span style={{ color: '#10B981', flexShrink: 0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={`/signup?tier=${t.id}`}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  background: t.highlight ? '#3B82F6' : '#1F2937',
                  color: 'white',
                  padding: '14px 24px',
                  borderRadius: 10,
                  fontWeight: 700,
                  textDecoration: 'none',
                  fontSize: 15,
                }}
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
        color: 'white',
        textAlign: 'center',
        padding: '80px 24px',
      }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>Ready to celebrate?</h2>
        <p style={{ fontSize: 18, opacity: 0.9, marginBottom: 36 }}>
          Your event site can be live in the next 5 minutes.
        </p>
        <Link
          href="/signup"
          style={{
            background: 'white',
            color: '#3B82F6',
            padding: '16px 40px',
            borderRadius: 10,
            fontWeight: 800,
            fontSize: 16,
            textDecoration: 'none',
          }}
        >
          Create Your Site →
        </Link>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer style={{
        textAlign: 'center',
        padding: '32px 24px',
        borderTop: '1px solid #E5E7EB',
        color: '#888',
        fontSize: 13,
      }}>
        © {new Date().getFullYear()} 1RockstarSocial. All rights reserved.
      </footer>

    </div>
  );
}
