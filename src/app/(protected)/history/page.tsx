'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const getStatusClass = (status: string) => {
    switch (status) {
        case 'completed': return 'bg-success/10 text-success';
        case 'pending': return 'bg-warning/10 text-warning';
        case 'failed': return 'bg-destructive/10 text-destructive';
        default: return 'bg-muted text-muted-foreground';
    }
}

const getTypeIcon = (type: string) => {
    switch(type) {
        case 'deposit': return 'fa-arrow-down text-success';
        case 'withdrawal': return 'fa-arrow-up text-secondary';
        default: return 'fa-question-circle';
    }
}

export default function HistoryPage() {
  const router = useRouter();
  // isReady is no longer needed, the layout handles auth.
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Auth is handled by the layout. This page just loads its data.
    fetchTransactions();
  }, []);
  
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const loginid = localStorage.getItem('deriv_loginid');
      if (!loginid) {
          setTransactions([]);
          setIsLoading(false);
          return;
      }
      const response = await fetch(`/api/transactions?account=${loginid}`);
      const data = await response.json();
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error("Failed to fetch transaction history", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="slide-in">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Transaction History</h1>
            <p className="text-muted-foreground">View all your past transactions</p>
          </div>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-card text-muted-foreground hover:bg-accent rounded-lg text-sm flex items-center">
              <i className="fas fa-file-csv mr-2"></i> Export CSV
            </button>
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6 custom-shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">M-Pesa Receipt</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Amount (USD)</th>
                  <th className="px-4 py-3">Amount (KES)</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                    <tr>
                        <td colSpan={6} className="text-center py-16">
                            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                            <p className="text-muted-foreground mt-2">Loading history...</p>
                        </td>
                    </tr>
                ) : transactions.length === 0 ? (
                    <tr>
                        <td colSpan={6} className="text-center py-16">
                            <p className="text-muted-foreground">You have no transactions yet.</p>
                        </td>
                    </tr>
                ) : (
                    transactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-accent/50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground">{new Date(tx.timestamp).toLocaleString()}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground font-mono">{tx.mpesaReceipt}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground">
                                <div className="flex items-center capitalize">
                                    <i className={`fas ${getTypeIcon(tx.type)} mr-2`}></i>
                                    {tx.type}
                                </div>
                            </td>
                            <td className={`px-4 py-4 whitespace-nowrap text-sm font-medium ${tx.type === 'deposit' ? 'text-success' : 'text-secondary'}`}>
                                {tx.type === 'deposit' ? '+' : '-'}$ {tx.usdAmount.toFixed(2)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                KES {tx.kesAmount.toLocaleString()}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusClass(tx.status)}`}>
                                    {tx.status}
                                </span>
                            </td>
                        </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
}
