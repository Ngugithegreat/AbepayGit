import { AppLayout } from '@/components/app-layout';
import AccountCard from '@/components/settings/account-card';

export default function SettingsPage() {
  return (
    <AppLayout pageTitle="Settings">
      <div className="max-w-xl">
        <AccountCard />
      </div>
    </AppLayout>
  );
}
