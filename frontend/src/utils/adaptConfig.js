/**
 * adaptConfig(raw)
 *
 * Converts the raw Django SiteConfig API response into the same shape as
 * PARTY_CONFIG (frontend/src/config/party.js). This lets existing event pages
 * switch from PARTY_CONFIG to useParty() with almost no other changes — the
 * property names are identical.
 *
 * Why do we need this?
 * Django returns JSON in snake_case (primary_color, party_name, etc.).
 * The existing frontend code uses camelCase (primaryColor, name, etc.).
 * Rather than rename every variable in every page, this adapter bridges the gap.
 *
 * @param {object} raw - The SiteConfig object from GET /api/site-config/by_subdomain/
 * @returns {object} - Config shaped like PARTY_CONFIG
 */
export function adaptConfig(raw) {
  if (!raw) return null;

  // Format the ISO datetime from Django (e.g. "2025-08-15T19:00:00Z")
  // into human-readable strings the existing pages already expect.
  const partyDate = raw.party_date ? new Date(raw.party_date) : null;
  const partyEndTime = raw.party_end_time ? new Date(raw.party_end_time) : null;

  const formatDisplayDate = (d) => {
    if (!d || Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDisplayTime = (d) => {
    if (!d || Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const dateStr = formatDisplayDate(partyDate);
  const timeStr =
    partyDate && partyEndTime
      ? `${formatDisplayTime(partyDate)} - ${formatDisplayTime(partyEndTime)}`
      : formatDisplayTime(partyDate);

  return {
    // ── Core identity ────────────────────────────────────────────────────────
    id: String(raw.party_id || ''),
    name: raw.party_name || '',

    // ── Event details ────────────────────────────────────────────────────────
    // "date" and "time" are display strings, matching what PARTY_CONFIG exposes.
    // "_rawDate" is the original ISO string used by the countdown timer.
    date: dateStr,
    time: timeStr,
    _rawDate: raw.party_date || null,

    location: raw.party_location || '',
    venueName: raw.venue_name || raw.party_location || '',
    theme: raw.theme || '',

    latitude: raw.party_latitude != null ? String(raw.party_latitude) : null,
    longitude: raw.party_longitude != null ? String(raw.party_longitude) : null,

    // ── Colors ───────────────────────────────────────────────────────────────
    primaryColor: raw.primary_color || '#3B82F6',
    secondaryColor: raw.secondary_color || '#8B5CF6',
    accentColor: raw.accent_color || '#F59E0B',
    // ViewDirector uses these on login — mirror the same colors for now.
    loggedInPrimaryColor: raw.primary_color || '#3B82F6',
    loggedInSecondaryColor: raw.secondary_color || '#8B5CF6',
    loggedInAccentColor: raw.accent_color || '#F59E0B',

    // ── Backgrounds ──────────────────────────────────────────────────────────
    backgroundImage: raw.background_image_url || '',
    loggedInBackgroundImage: raw.logged_in_background_url || raw.background_image_url || '',

    // ── Template ─────────────────────────────────────────────────────────────
    templateId: raw.template_id || 'classic',
    fontFamily: raw.font_family || 'Inter',

    // ── Feature toggles ──────────────────────────────────────────────────────
    enablePhotos: raw.enable_photos !== false,
    enableRSVP: raw.enable_rsvp !== false,
    enableGames: raw.enable_games !== false,
    enableGifts: raw.enable_gifts !== false,
    enableGuestbook: raw.enable_guestbook !== false,
    enableTimeline: raw.enable_timeline !== false,

    // ── Messaging ────────────────────────────────────────────────────────────
    welcomeMessage: raw.welcome_message || 'Join us for an unforgettable celebration!',
    rsvpMessage: raw.rsvp_message || 'Please let us know if you can make it!',
    giftMessage: raw.gift_message || "Your presence is the greatest gift, but if you'd like to contribute...",
    thankYouTitle: raw.thank_you_title || 'Thank You!',
    thankYouMessage: raw.thank_you_message || '',
    thankYouSubmessage: raw.thank_you_submessage || '',

    // ── Social / payment ─────────────────────────────────────────────────────
    venmoUsername: raw.venmo_username || '',
    facebookLive: raw.facebook_live_url || '',
    registryUrl: raw.registry_url || '',

    // ── SaaS metadata (extra fields not in PARTY_CONFIG) ────────────────────
    subdomain: raw.subdomain || '',
    customDomain: raw.custom_domain || '',
    siteStatus: raw.site_status || '',
    hostEmail: raw.host_email || '',
    expiresAt: raw.expires_at || null,
    isActive: raw.is_active !== false,
    isExpired: raw.is_expired === true,
  };
}
