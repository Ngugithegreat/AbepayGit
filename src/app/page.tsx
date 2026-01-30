import { AppLayout } from '@/components/app-layout';
import DepositCard from '@/components/dashboard/deposit-card';
import WithdrawCard from '@/components/dashboard/withdraw-card';

export default function DashboardPage() {
  return (
    <AppLayout pageTitle="Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DepositCard />
        <WithdrawCard />
      </div>
    </AppLayout>
  );
}
