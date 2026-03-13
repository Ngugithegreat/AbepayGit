'use client';

import { useAuth } from '@/context/auth-context';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const getStatusClass = (status: string) => {
    switch (status) {
        case 'completed': return 'bg-green-900 text-green-300';
        case 'pending': return 'bg-yellow-900 text-yellow-300';
        case 'failed': return 'bg-red-900 text-red-300';
        default: return 'bg-slate-700 text-slate-300';
    }
}

const getTypeIcon = (type: string) => {
    switch(type) {
        case 'deposit': return 'fa-arrow-down text-green-500';
        case 'withdrawal': return 'fa-arrow-up text-purple-500';
        default: return 'fa-question-circle';
    }
}

export default function HistoryPage() {
  const { selectedAccount } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (selectedAccount?.loginid) {
      const fetchTransactions = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/transactions?account=${selectedAccount.loginid}`);
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
      fetchTransactions();
    } else {
        setIsLoading(false);
    }
  }, [selectedAccount]);

  return (
      <div className="slide-in">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Transaction History</h1>
            <p className="text-gray-400">View all your past transactions</p>
          </div>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-slate-700 text-gray-300 hover:bg-slate-600 rounded-lg text-sm flex items-center">
              <i className="fas fa-file-csv mr-2"></i> Export CSV
            </button>
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6 custom-shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">M-Pesa Receipt</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Amount (USD)</th>
                  <th className="px-4 py-3">Amount (KES)</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {isLoading ? (
                    <tr>
                        <td colSpan={6} className="text-center py-16">
                            <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500" />
                            <p className="text-gray-400 mt-2">Loading history...</p>
                        </td>
                    </tr>
                ) : transactions.length === 0 ? (
                    <tr>
                        <td colSpan={6} className="text-center py-16">
                            <p className="text-gray-500">You have no transactions yet.</p>
                        </td>
                    </tr>
                ) : (
                    transactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-slate-800/50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(tx.timestamp).toLocaleString()}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">{tx.mpesaReceipt}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                                <div className="flex items-center capitalize">
                                    <i className={`fas ${getTypeIcon(tx.type)} mr-2`}></i>
                                    {tx.type}
                                </div>
                            </td>
                            <td className={`px-4 py-4 whitespace-nowrap text-sm font-medium ${tx.type === 'deposit' ? 'text-green-400' : 'text-purple-400'}`}>
                                {tx.type === 'deposit' ? '+' : '-'}$ {tx.usdAmount.toFixed(2)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
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
