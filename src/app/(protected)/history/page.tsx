'use client';

import { AppLayout } from '@/components/app-layout';
import { transactions } from '@/lib/data';
import type { Transaction } from '@/lib/types';
import { useState } from 'react';

const getStatusClass = (status: Transaction['status']) => {
    switch (status) {
        case 'Completed': return 'bg-green-900 text-green-300';
        case 'Pending': return 'bg-yellow-900 text-yellow-300';
        case 'Failed': return 'bg-red-900 text-red-300';
        default: return 'bg-slate-700 text-slate-300';
    }
}

const getTypeIcon = (type: Transaction['type']) => {
    switch(type) {
        case 'Deposit': return 'fa-arrow-down text-green-500';
        case 'Withdrawal': return 'fa-arrow-up text-purple-500';
        default: return '';
    }
}

export default function HistoryPage() {
  const [filteredTransactions, setFilteredTransactions] = useState(transactions);

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
                  <th className="px-4 py-3">Transaction ID</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-800/50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(tx.date).toLocaleString()}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">{tx.id}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                            <div className="flex items-center">
                                <i className={`fas ${getTypeIcon(tx.type)} mr-2`}></i>
                                {tx.type}
                            </div>
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap text-sm font-medium ${tx.type === 'Deposit' ? 'text-green-400' : 'text-purple-400'}`}>
                            {tx.type === 'Deposit' ? '+' : '-'}${tx.currency} {tx.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(tx.status)}`}>
                                {tx.status}
                            </span>
                        </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
}
