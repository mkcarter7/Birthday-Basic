'use client';

import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { useParty } from '@/utils/context/partyContext';

export default function RegistryPage() {
  const config = useParty();

  return (
    <main className="page">
      <PageHeader title="Registry" subtitle="View wishlist and registry links" />
      <div className="card" style={{ display: 'grid', gap: 16 }}>
        <div>
          <h3>Wishlist</h3>
          <p>Check out the birthday wishlist!</p>
        </div>
        <Link
          href={config.registryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="tile tile-purple"
          style={{
            height: 56,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
          }}
        >
          View Wishlist
        </Link>
      </div>
    </main>
  );
}
