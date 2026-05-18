'use client';

/**
 * PartyShell — Client Component
 *
 * This component is the "shell" that wraps every event page.
 * It serves three purposes:
 *
 * 1. CONTEXT: Provides the party config via PartyContext so any child component
 *    can call useParty() to get party ID, colors, feature flags, etc.
 *
 * 2. AUTH: Wraps children with AuthProvider so Firebase sign-in state is available.
 *
 * 3. VIEW DIRECTOR: Replicates the role of ViewDirector.js for event sites:
 *    - Applies the party's CSS color variables to the document body
 *    - Shows a loading spinner while auth state is being determined
 *    - Shows the sign-in page if the user isn't logged in
 *    - Renders the page content (+ NavBar) once the user is authenticated
 *
 * Why is this a client component while the layout is a server component?
 * The layout fetches data from Django (server-side work).
 * This component uses React hooks (useState, useEffect) and Firebase auth,
 * which only work in the browser — so it must be 'use client'.
 *
 * The layout passes the pre-fetched config down as a prop, so we get the
 * best of both: server-side data fetching + client-side interactivity.
 */

import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/utils/context/authContext';
import { PartyContext } from '@/utils/context/partyContext';
import Loading from '@/components/Loading';
import SignIn from '@/components/SignIn';
import EventNavBar from '@/components/event/EventNavBar';

import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/globals.css';
import '@/styles/theme.css';

function EventViewDirector({ config, children }) {
  const { user, userLoading } = useAuth();

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const body = document.body;

    // Choose which background and colors to show based on login state
    const bgUrl = user
      ? `url('${config.loggedInBackgroundImage || config.backgroundImage}')`
      : `url('${config.backgroundImage}')`;
    const primary = user ? config.loggedInPrimaryColor : config.primaryColor;
    const secondary = user ? config.loggedInSecondaryColor : config.secondaryColor;
    const accent = user ? config.loggedInAccentColor : config.accentColor;

    body.style.setProperty('--bg-image-url', bgUrl);
    body.style.setProperty('--party-primary', primary || '#3B82F6');
    body.style.setProperty('--party-secondary', secondary || '#8B5CF6');
    body.style.setProperty('--party-accent', accent || '#F59E0B');

    if (user) {
      body.classList.add('logged-in-background');
    } else {
      body.classList.remove('logged-in-background');
    }

    // Apply the selected template as a data attribute so CSS templates can target it
    body.setAttribute('data-template', config.templateId || 'classic');

    return () => {
      // Restore defaults when leaving the event site
      body.style.removeProperty('--bg-image-url');
      body.style.removeProperty('--party-primary');
      body.style.removeProperty('--party-secondary');
      body.style.removeProperty('--party-accent');
      body.classList.remove('logged-in-background');
      body.removeAttribute('data-template');
    };
  }, [user, config]);

  if (userLoading) return <Loading />;
  if (!user) return <SignIn />;

  return (
    <>
      <EventNavBar />
      {children}
    </>
  );
}

EventViewDirector.propTypes = {
  config: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
};

export default function PartyShell({ config, children }) {
  return (
    <PartyContext.Provider value={config}>
      <AuthProvider>
        <EventViewDirector config={config}>
          {children}
        </EventViewDirector>
      </AuthProvider>
    </PartyContext.Provider>
  );
}

PartyShell.propTypes = {
  config: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
};
