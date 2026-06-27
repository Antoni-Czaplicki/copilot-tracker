import { redirect } from 'next/navigation';
import { DashboardOverview } from '@/components/dashboard-overview';
import { currentUser } from '@/lib/auth';
import { readDatabase } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) {
    redirect('/');
  }

  const database = await readDatabase();
  const requests = database.chatRequests.filter((request) => request.githubId === user.githubId);
  return <DashboardOverview login={user.login} requests={requests} />;
}
