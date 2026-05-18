'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { useParty } from '@/utils/context/partyContext';
import { useAuth } from '@/utils/context/authContext';
import { isAdmin } from '@/utils/admin';
import { signOut } from '@/utils/auth';

/**
 * EventNavBar — the navigation bar shown on guest-facing event pages.
 *
 * Identical to NavBar.js but reads the party name from PartyContext
 * (via useParty()) instead of the hardcoded PARTY_CONFIG.
 * This makes it work correctly for any event subdomain.
 */
export default function EventNavBar() {
  const config = useParty();
  const { user } = useAuth();
  const userIsAdmin = isAdmin(user);
  const router = useRouter();

  return (
    <Navbar collapseOnSelect expand="lg" variant="dark" className="nav-ocean">
      <Container>
        <Link passHref href="/" className="navbar-brand">
          {config.name}
        </Link>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link onClick={() => router.push('/')} style={{ color: '#fff', cursor: 'pointer' }}>
              Home
            </Nav.Link>
            {userIsAdmin && (
              <Nav.Link onClick={() => router.push('/admin')} style={{ color: '#fff', cursor: 'pointer' }}>
                Admin Dashboard
              </Nav.Link>
            )}
          </Nav>
          <Button
            onClick={signOut}
            style={{
              backgroundColor: 'var(--party-primary)',
              borderColor: 'var(--party-primary)',
              color: '#fff',
              transition: 'var(--party-transition)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--party-secondary)';
              e.currentTarget.style.borderColor = 'var(--party-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--party-primary)';
              e.currentTarget.style.borderColor = 'var(--party-primary)';
            }}
          >
            Sign Out
          </Button>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
