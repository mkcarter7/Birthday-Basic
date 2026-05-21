/**
 * Unit tests for adaptConfig(raw).
 *
 * adaptConfig is a pure function — it takes a raw Django API response object
 * and returns a transformed config object. No network, no database, no
 * component rendering. Jest can run these instantly without any setup.
 *
 * A "pure function" means: same input always produces the same output,
 * and the function has no side effects (it doesn't modify anything outside
 * itself). Pure functions are the easiest things to test.
 */

import { adaptConfig } from '../adaptConfig';

// ── Null / empty guards ──────────────────────────────────────────────────────

describe('adaptConfig — null / empty guards', () => {
  test('returns null for null input', () => {
    expect(adaptConfig(null)).toBeNull();
  });

  test('returns null for undefined input', () => {
    expect(adaptConfig(undefined)).toBeNull();
  });
});

// ── Field mapping (snake_case → camelCase) ──────────────────────────────────

describe('adaptConfig — field mapping', () => {
  const raw = {
    party_id: 42,
    party_name: 'Alice Turns 30',
    party_location: '42 Main St',
    venue_name: 'Grand Hall',
    theme: 'disco',
    party_date: '2025-08-15T19:00:00Z',
    party_end_time: '2025-08-15T23:00:00Z',
    primary_color: '#FF0000',
    secondary_color: '#00FF00',
    accent_color: '#0000FF',
    background_image_url: 'https://example.com/bg.jpg',
    logged_in_background_url: 'https://example.com/logged-in.jpg',
    template_id: 'elegant',
    font_family: 'Roboto',
    welcome_message: 'Welcome!',
    rsvp_message: 'Please RSVP',
    gift_message: 'No gifts please',
    thank_you_title: 'Thanks!',
    thank_you_message: 'We had a blast',
    thank_you_submessage: 'See you next year',
    venmo_username: 'alice30',
    facebook_live_url: 'https://fb.com/live/123',
    registry_url: 'https://registry.com/alice',
    subdomain: 'alice-30',
    custom_domain: 'alice30.com',
    site_status: 'active',
    host_email: 'alice@example.com',
    expires_at: '2026-01-01T00:00:00Z',
    is_active: true,
    is_expired: false,
  };

  let config;
  beforeEach(() => {
    config = adaptConfig(raw);
  });

  test('maps party_id as a string', () => {
    expect(config.id).toBe('42');
  });

  test('maps party_name → name', () => {
    expect(config.name).toBe('Alice Turns 30');
  });

  test('maps party_location → location', () => {
    expect(config.location).toBe('42 Main St');
  });

  test('maps venue_name → venueName', () => {
    expect(config.venueName).toBe('Grand Hall');
  });

  test('maps primary_color → primaryColor', () => {
    expect(config.primaryColor).toBe('#FF0000');
  });

  test('maps secondary_color → secondaryColor', () => {
    expect(config.secondaryColor).toBe('#00FF00');
  });

  test('maps accent_color → accentColor', () => {
    expect(config.accentColor).toBe('#0000FF');
  });

  test('maps background_image_url → backgroundImage', () => {
    expect(config.backgroundImage).toBe('https://example.com/bg.jpg');
  });

  test('maps logged_in_background_url → loggedInBackgroundImage', () => {
    expect(config.loggedInBackgroundImage).toBe('https://example.com/logged-in.jpg');
  });

  test('maps template_id → templateId', () => {
    expect(config.templateId).toBe('elegant');
  });

  test('maps font_family → fontFamily', () => {
    expect(config.fontFamily).toBe('Roboto');
  });

  test('maps venmo_username → venmoUsername', () => {
    expect(config.venmoUsername).toBe('alice30');
  });

  test('maps facebook_live_url → facebookLive', () => {
    expect(config.facebookLive).toBe('https://fb.com/live/123');
  });

  test('maps registry_url → registryUrl', () => {
    expect(config.registryUrl).toBe('https://registry.com/alice');
  });

  test('maps subdomain → subdomain', () => {
    expect(config.subdomain).toBe('alice-30');
  });

  test('maps site_status → siteStatus', () => {
    expect(config.siteStatus).toBe('active');
  });

  test('maps is_expired → isExpired', () => {
    expect(config.isExpired).toBe(false);
  });

  test('maps is_active → isActive', () => {
    expect(config.isActive).toBe(true);
  });

  test('preserves _rawDate for the countdown timer', () => {
    expect(config._rawDate).toBe('2025-08-15T19:00:00Z');
  });
});

// ── Date & time formatting ───────────────────────────────────────────────────

describe('adaptConfig — date and time formatting', () => {
  test('date field is a non-empty string when party_date is set', () => {
    const config = adaptConfig({ party_date: '2025-08-15T19:00:00Z' });
    expect(typeof config.date).toBe('string');
    expect(config.date.length).toBeGreaterThan(0);
  });

  test('date field is empty string when party_date is null', () => {
    const config = adaptConfig({ party_date: null });
    expect(config.date).toBe('');
  });

  test('time shows a range when both start and end times are set', () => {
    const config = adaptConfig({
      party_date: '2025-08-15T19:00:00Z',
      party_end_time: '2025-08-15T23:00:00Z',
    });
    // A time range contains " - "
    expect(config.time).toContain(' - ');
  });

  test('time shows only start when no end time', () => {
    const config = adaptConfig({ party_date: '2025-08-15T19:00:00Z' });
    expect(config.time).not.toContain(' - ');
    expect(config.time.length).toBeGreaterThan(0);
  });

  test('time is empty string when party_date is null', () => {
    const config = adaptConfig({ party_date: null });
    expect(config.time).toBe('');
  });
});

// ── Default values ───────────────────────────────────────────────────────────

describe('adaptConfig — default values when fields are missing', () => {
  let config;
  beforeEach(() => {
    config = adaptConfig({});
  });

  test('primaryColor defaults to #3B82F6', () => {
    expect(config.primaryColor).toBe('#3B82F6');
  });

  test('secondaryColor defaults to #8B5CF6', () => {
    expect(config.secondaryColor).toBe('#8B5CF6');
  });

  test('accentColor defaults to #F59E0B', () => {
    expect(config.accentColor).toBe('#F59E0B');
  });

  test('templateId defaults to classic', () => {
    expect(config.templateId).toBe('classic');
  });

  test('fontFamily defaults to Inter', () => {
    expect(config.fontFamily).toBe('Inter');
  });

  test('welcomeMessage has a non-empty default', () => {
    expect(config.welcomeMessage).toBeTruthy();
  });

  test('id defaults to empty string when party_id is missing', () => {
    expect(config.id).toBe('');
  });

  test('name defaults to empty string when party_name is missing', () => {
    expect(config.name).toBe('');
  });
});

// ── Feature toggle defaults ──────────────────────────────────────────────────

describe('adaptConfig — feature toggles', () => {
  test('enablePhotos defaults to true when not set', () => {
    expect(adaptConfig({}).enablePhotos).toBe(true);
  });

  test('enableRSVP defaults to true when not set', () => {
    expect(adaptConfig({}).enableRSVP).toBe(true);
  });

  test('enableGames defaults to true when not set', () => {
    expect(adaptConfig({}).enableGames).toBe(true);
  });

  test('enableGifts defaults to true when not set', () => {
    expect(adaptConfig({}).enableGifts).toBe(true);
  });

  test('enableGuestbook defaults to true when not set', () => {
    expect(adaptConfig({}).enableGuestbook).toBe(true);
  });

  test('enableTimeline defaults to true when not set', () => {
    expect(adaptConfig({}).enableTimeline).toBe(true);
  });

  test('enablePhotos is false when explicitly set to false', () => {
    expect(adaptConfig({ enable_photos: false }).enablePhotos).toBe(false);
  });

  test('enableRSVP is false when explicitly set to false', () => {
    expect(adaptConfig({ enable_rsvp: false }).enableRSVP).toBe(false);
  });
});

// ── loggedInBackground fallback ──────────────────────────────────────────────

describe('adaptConfig — loggedInBackgroundImage fallback', () => {
  test('falls back to backgroundImage when logged_in_background_url is missing', () => {
    const config = adaptConfig({ background_image_url: 'https://example.com/bg.jpg' });
    expect(config.loggedInBackgroundImage).toBe('https://example.com/bg.jpg');
  });

  test('uses logged_in_background_url when provided', () => {
    const config = adaptConfig({
      background_image_url: 'https://example.com/bg.jpg',
      logged_in_background_url: 'https://example.com/special.jpg',
    });
    expect(config.loggedInBackgroundImage).toBe('https://example.com/special.jpg');
  });
});

// ── lat/lng edge cases ───────────────────────────────────────────────────────

describe('adaptConfig — latitude / longitude', () => {
  test('numeric lat/lng are returned as strings', () => {
    const config = adaptConfig({ party_latitude: 40.7128, party_longitude: -74.006 });
    expect(config.latitude).toBe('40.7128');
    expect(config.longitude).toBe('-74.006');
  });

  test('null lat/lng → null (not "null" string)', () => {
    const config = adaptConfig({ party_latitude: null, party_longitude: null });
    expect(config.latitude).toBeNull();
    expect(config.longitude).toBeNull();
  });
});
