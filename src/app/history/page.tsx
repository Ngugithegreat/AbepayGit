import { AppLayout } from '@/components/app-layout';
import HistoryTable from '@/components/history/history-table';
import { transactions } from '@/lib/data';

export default function HistoryPage() {
  return (
    <AppLayout pageTitle="Transaction History">
      <HistoryTable transactions={transactions} />
    </AppLayout>
  );
}
