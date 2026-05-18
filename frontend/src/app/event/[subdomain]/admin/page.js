'use client';

import AdminDashboard from '@/components/AdminDashboard';
import { useParty } from '@/utils/context/partyContext';

export default function AdminDashboardPage() {
  const config = useParty();
  return <AdminDashboard partyId={config.id} />;
}
