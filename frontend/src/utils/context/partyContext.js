'use client';

import { createContext, useContext } from 'react';

/**
 * PartyContext holds the full config for the currently-displayed event site.
 * It is populated by the event layout server component, which fetches
 * SiteConfig from Django, then passes it into PartyShell → PartyContext.Provider.
 *
 * Any event page can call useParty() to get the config for the current party
 * without importing PARTY_CONFIG or prop-drilling.
 */
export const PartyContext = createContext(null);

/**
 * useParty() — call this inside any event page component to get the party config.
 *
 * Returns an object in the same shape as PARTY_CONFIG (see adaptConfig.js),
 * so existing pages need minimal changes to work with multi-tenant parties.
 *
 * Example:
 *   const config = useParty();
 *   console.log(config.id);           // "42"
 *   console.log(config.name);         // "Sarah's Birthday"
 *   console.log(config.primaryColor); // "#3B82F6"
 */
export function useParty() {
  const ctx = useContext(PartyContext);
  if (!ctx) {
    throw new Error('useParty() must be used inside an event page (within PartyContext.Provider).');
  }
  return ctx;
}
