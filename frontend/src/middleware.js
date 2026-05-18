import { NextResponse } from 'next/server';

/**
 * ROOT_DOMAIN: the platform's main domain.
 * - Requests FROM the root domain (1rockstarsocial.com) → serve the marketing site / dashboard.
 * - Requests FROM a subdomain (sarah-party.1rockstarsocial.com) → serve that party's event site.
 *
 * Set NEXT_PUBLIC_ROOT_DOMAIN in your environment variables (Vercel / Railway).
 * In local dev it falls back to "localhost" so sarah-party.localhost:3000 works.
 */
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost';

export function middleware(request) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  // Strip the port number so comparisons work both locally and in production.
  // "sarah-party.localhost:3000" → "sarah-party.localhost"
  const hostWithoutPort = hostname.split(':')[0];
  const rootWithoutPort = ROOT_DOMAIN.split(':')[0];

  // Decide whether this request is coming from a subdomain.
  // A subdomain means the host ends with ".{rootDomain}" but isn't the root itself.
  // Examples:
  //   Production:  sarah-party.1rockstarsocial.com  → IS a subdomain
  //                1rockstarsocial.com               → NOT a subdomain
  //   Local dev:   sarah-party.localhost             → IS a subdomain
  //                localhost                         → NOT a subdomain
  const isSubdomain =
    hostWithoutPort !== rootWithoutPort &&
    hostWithoutPort !== `www.${rootWithoutPort}` &&
    hostWithoutPort.endsWith(`.${rootWithoutPort}`);

  if (isSubdomain) {
    // Extract the subdomain slug.
    // "sarah-party.1rockstarsocial.com" → "sarah-party"
    const subdomain = hostWithoutPort.replace(`.${rootWithoutPort}`, '');

    // Rewrite: /rsvp → /event/sarah-party/rsvp
    // The browser URL stays unchanged; Next.js internally routes to the new path.
    url.pathname = `/event/${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Not a subdomain — serve the marketing site or dashboard as normal.
  return NextResponse.next();
}

/**
 * Matcher: which paths should run through middleware.
 * We exclude Next.js internal paths (_next/*), static files, and images
 * because those don't need subdomain routing.
 */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png|images/).*)'],
};
