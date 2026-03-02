'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, ArrowDownLeft, TrendingUp, History, Eye, EyeOff } from 'lucide-react';

export default function DashboardPage() {
  const { user, selectedAccount, isLoading } = useAuth();
  const router = useRouter();
  const [showBalance, setShowBalance] = useState(true);

  const balance = selectedAccount?.balance;

  return (
    <div className="slide-in">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-400">Welcome back, {user?.fullname || 'User'}</p>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">{selectedAccount?.loginid || 'N/A'}</span>
            </div>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 shadow-2xl mb-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm font-medium">Deriv Balance</span>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="text-white/80 hover:text-white"
              >
                {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
            
            <div className="space-y-1">
              {isLoading ? (
                <div className="h-12 bg-white/20 rounded-lg animate-pulse" />
              ) : (
                <h2 className="text-5xl font-black text-white">
                  {showBalance ? `$${balance?.toFixed(2) || '0.00'}` : '••••••'}
                </h2>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => router.push('/deposit')}
            className="h-24 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all p-4"
          >
            <div className="flex flex-col items-center justify-center gap-2 text-white">
              <ArrowDownLeft className="w-8 h-8" strokeWidth={2.5} />
              <span className="font-bold text-lg">Deposit</span>
            </div>
          </button>

          <button
            onClick={() => router.push('/withdraw')}
            className="h-24 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all p-4"
          >
            <div className="flex flex-col items-center justify-center gap-2 text-white">
              <ArrowUpRight className="w-8 h-8" strokeWidth={2.5} />
              <span className="font-bold text-lg">Withdraw</span>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <div className="glass-effect rounded-xl p-6 custom-shadow">
                    <h3 className="font-medium text-white mb-4">Quick Stats</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-900/50 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Total Deposits</p>
                                <p className="text-xl font-bold text-white">$0.00</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-900/50 flex items-center justify-center">
                                <History className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Transactions</p>
                                <p className="text-xl font-bold text-white">0</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2 glass-effect rounded-xl p-6 custom-shadow">
                <h3 className="font-medium text-white mb-4">Recent Activity</h3>
                <div className="text-center py-16 text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No transactions yet</p>
                </div>
            </div>
        </div>
    </div>
  );
}
