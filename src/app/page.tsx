import { AppLayout } from '@/components/app-layout';
import DepositCard from '@/components/dashboard/deposit-card';

export default function DashboardPage() {
  return (
    <AppLayout pageTitle="Dashboard">
      <div className="grid gap-6">
        <DepositCard />
      </div>
    </AppLayout>
  );
}
