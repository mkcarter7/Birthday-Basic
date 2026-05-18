'use client';

import Link from 'next/link';

const TIERS = [
  {
    id: 'self_service',
    label: 'Self-Service',
    price: 99,
    badge: 'Most Popular',
    tagline: 'Everything you need to run your event site on your own.',
    features: [
      'Your own subdomain (yourname.1rockstarsocial.com)',
      'All features: RSVP, photos, games, gift registry, guest book, timeline, live stream',
      '5 professional design templates',
      'Custom colors and background photos',
      'Site stays live 60 days after your event',
      'Community support forum',
    ],
    cta: 'Get Started — $99',
    highlight: true,
  },
  {
    id: 'guided',
    label: 'Guided',
    price: 229,
    badge: null,
    tagline: 'All the features plus expert guidance when you need it.',
    features: [
      'Everything in Self-Service',
      '48-hour email support',
      'Step-by-step onboarding checklist',
      'Helpful for first-time event hosts',
    ],
    cta: 'Get Started — $229',
    highlight: false,
  },
  {
    id: 'full_service',
    label: 'Full Service',
    price: 399,
    badge: null,
    tagline: 'We handle the setup so you can focus on the celebration.',
    features: [
      'Everything in Guided',
      'Priority support response',
      'Dedicated setup assistance from our team',
      'We help configure your site to match your vision',
    ],
    cta: 'Get Started — $399',
    highlight: false,
  },
];

const FAQ = [
  {
    q: 'Do I pay monthly?',
    a: 'No. You pay once and your site stays live for 60 days after your event date. No subscriptions, no surprises.',
  },
  {
    q: 'What happens after 60 days?',
    a: 'Your site moves to a read-only archived view. Guests can still view photos and memories, but new RSVPs and uploads are closed.',
  },
  {
    q: 'Can I use a custom domain?',
    a: 'Custom domain support is on the roadmap. For now, every site gets a free subdomain at 1rockstarsocial.com.',
  },
  {
    q: 'What features do all plans include?',
    a: 'Every plan includes the full feature set: RSVP tracking, photo gallery, trivia games & leaderboard, gift registry, guest book, party timeline, live stream link, QR code sharing, and SMS invites.',
  },
  {
    q: 'Is there a refund policy?',
    a: 'If your site was never activated (payment failed or you changed your mind within 24 hours), contact us and we will make it right.',
  },
];

export default function PricingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'white', color: '#111' }}>

      {/* Navbar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: '1px solid #f0f0f0', background: 'white', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: 20, color: '#3B82F6', textDecoration: 'none' }}>🎉 1RockstarSocial</Link>
        <Link href="/signup" style={{ background: '#3B82F6', color: 'white', padding: '10px 22px', borderRadius: 8, fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
          Get Started
        </Link>
      </nav>

      {/* Header */}
      <section style={{ textAlign: 'center', padding: '64px 24px 48px', background: 'linear-gradient(180deg, #EEF2FF 0%, white 100%)' }}>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, marginBottom: 16 }}>Simple, Transparent Pricing</h1>
        <p style={{ fontSize: 18, color: '#555', maxWidth: 500, margin: '0 auto' }}>
          One payment. All features. No monthly fees. Your site stays live for 60 days after your event.
        </p>
      </section>

      {/* Tier Cards */}
      <section style={{ padding: '48px 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28 }}>
          {TIERS.map((t) => (
            <div
              key={t.id}
              style={{
                padding: 36,
                borderRadius: 20,
                border: t.highlight ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                background: t.highlight ? '#EEF2FF' : 'white',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {t.badge && (
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#3B82F6', color: 'white', padding: '4px 16px', borderRadius: 99, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {t.badge}
                </div>
              )}
              <div style={{ fontWeight: 800, fontSize: 24, marginBottom: 6 }}>{t.label}</div>
              <div style={{ fontSize: 52, fontWeight: 800, color: '#3B82F6', lineHeight: 1, marginBottom: 4 }}>${t.price}</div>
              <div style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>one-time payment</div>
              <p style={{ color: '#555', fontSize: 15, lineHeight: 1.5, marginBottom: 24 }}>{t.tagline}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'grid', gap: 12, flex: 1 }}>
                {t.features.map((f) => (
                  <li key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 15, color: '#333' }}>
                    <span style={{ color: '#10B981', flexShrink: 0, fontWeight: 700 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={`/signup?tier=${t.id}`}
                style={{ display: 'block', textAlign: 'center', background: t.highlight ? '#3B82F6' : '#1F2937', color: 'white', padding: '16px 24px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', marginTop: 32, color: '#888', fontSize: 14 }}>
          All plans include a free SSL certificate, mobile-optimized design, and no setup fee.
        </p>
      </section>

      {/* FAQ */}
      <section style={{ padding: '64px 24px', background: '#F9FAFB' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 800, marginBottom: 48 }}>Frequently Asked Questions</h2>
          <div style={{ display: 'grid', gap: 24 }}>
            {FAQ.map((item) => (
              <div key={item.q} style={{ padding: 24, background: 'white', borderRadius: 14, border: '1px solid #E5E7EB' }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{item.q}</div>
                <div style={{ color: '#555', lineHeight: 1.6, fontSize: 15 }}>{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '32px 24px', borderTop: '1px solid #E5E7EB', color: '#888', fontSize: 13 }}>
        <Link href="/" style={{ color: '#3B82F6', textDecoration: 'none', marginRight: 16 }}>← Back to Home</Link>
        © {new Date().getFullYear()} 1RockstarSocial
      </footer>
    </div>
  );
}
