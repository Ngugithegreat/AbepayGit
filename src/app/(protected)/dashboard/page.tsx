'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, ArrowDownLeft, TrendingUp, History, Eye, EyeOff, Loader2, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  // isReady state is no longer needed, the layout handles the auth check.

  // States for the dashboard itself
  const [showBalance, setShowBalance] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);
  const [stats, setStats] = useState({ totalDeposits: 0, transactionCount: 0 });
  const [displayUser, setDisplayUser] = useState({ name: 'User', loginid: '' });
  
  useEffect(() => {
    // The layout component now handles auth. This just loads page-specific data.
    const loginid = localStorage.getItem('deriv_loginid');
    if (loginid) {
      console.log('🏠 Dashboard: Loading data for user:', loginid);
      loadDashboardData(loginid);
    } else {
      // This case should not happen if the layout guard is working, but it's good practice to log.
      console.error('🏠 Dashboard: Could not find loginid in localStorage.');
    }
  }, []);

  const loadDashboardData = async (loginid: string) => {
      setIsBalanceLoading(true);
      setIsLoadingTransactions(true);
  
      // Get user data from localStorage
      const userInfoStr = localStorage.getItem('user_info');
  
      if (userInfoStr) {
        try {
          const user = JSON.parse(userInfoStr);
          setDisplayUser({ name: user.name || user.fullname || 'User', loginid: user.loginid || loginid || '' });
        } catch(e) {
          setDisplayUser({ name: 'User', loginid: loginid || '' });
        }
      } else {
        setDisplayUser({ name: 'User', loginid: loginid || '' });
      }
  
      // Fetch balance
      try {
        const balanceResponse = await fetch(`/api/deriv/balance?account=${loginid}`);
        const balanceData = await balanceResponse.json();
        if (balanceData.success) {
          setBalance(balanceData.balance);
        } else {
          setBalance(0);
        }
      } catch (error) {
        console.error('❌ Failed to fetch balance:', error);
        setBalance(0);
      } finally {
        setIsBalanceLoading(false);
      }
  
      // Fetch transactions
      try {
        const txResponse = await fetch(`/api/transactions`); 
        const txData = await txResponse.json();
        if (txData.success) {
          setTransactions(txData.transactions);
          const totalDeposits = txData.transactions
            .filter((tx: any) => tx.type === 'deposit' && tx.status === 'completed')
            .reduce((sum: number, tx: any) => sum + tx.usdAmount, 0);
          
          setStats({
            totalDeposits: totalDeposits,
            transactionCount: txData.transactions.length,
          });
        } else {
          setTransactions([]);
        }
      } catch (error) {
        console.error('❌ Failed to fetch transactions:', error);
        setTransactions([]);
      } finally {
        setIsLoadingTransactions(false);
      }
  };

  const handleRefresh = async () => {
    const loginid = localStorage.getItem('deriv_loginid');
    if (!loginid) return;
    
    setIsBalanceLoading(true);
    try {
      const response = await fetch(`/api/deriv/balance?account=${loginid}`);
      const data = await response.json();
      if (data.success) {
        setBalance(data.balance);
      } else {
        setBalance(0);
      }
    } catch (error) {
      setBalance(0);
    } finally {
      setIsBalanceLoading(false);
    }
  };

  // No need for the isReady loader, the layout handles it.
  // The page will only render once authentication is confirmed.

  return (
    <div className="slide-in">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, {displayUser.name}</p>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{displayUser.loginid}</span>
            </div>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-3xl p-8 shadow-2xl mb-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-primary-foreground/80 text-sm font-medium">Deriv Balance</span>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleRefresh}
                  disabled={isBalanceLoading}
                  className="text-primary-foreground/80 hover:text-primary-foreground disabled:opacity-50"
                  title="Refresh balance"
                >
                  <RefreshCw className={`w-5 h-5 ${isBalanceLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-primary-foreground/80 hover:text-primary-foreground"
                >
                  {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div className="space-y-1">
              {(isBalanceLoading && balance === null) ? (
                <div className="h-12 bg-white/20 rounded-lg animate-pulse" />
              ) : (
                <h2 className="text-5xl font-black text-primary-foreground">
                  {showBalance ? `$${(balance || 0).toFixed(2)}` : '••••••'}
                </h2>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => router.push('/deposit')}
            className="h-24 bg-gradient-to-br from-[#3B5998] to-[#2d4373] hover:from-[#2d4373] hover:to-[#1e2e4f] rounded-2xl shadow-xl hover:shadow-2xl transition-all p-4"
          >
            <div className="flex flex-col items-center justify-center gap-2 text-white">
              <ArrowDownLeft className="w-8 h-8" strokeWidth={2.5} />
              <span className="font-bold text-lg">Deposit</span>
            </div>
          </button>

          <button
            onClick={() => router.push('/withdraw')}
            className="h-24 bg-gradient-to-br from-[#3B5998] to-[#2d4373] hover:from-[#2d4373] hover:to-[#1e2e4f] rounded-2xl shadow-xl hover:shadow-2xl transition-all p-4"
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
                    <h3 className="font-medium text-foreground mb-4">Quick Stats</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-success" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Deposits</p>
                                <p className="text-xl font-bold text-foreground">${stats.totalDeposits.toFixed(2)}</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                                <History className="w-6 h-6 text-secondary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Transactions</p>
                                <p className="text-xl font-bold text-foreground">{stats.transactionCount}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2 glass-effect rounded-xl p-6 custom-shadow">
                <h3 className="font-medium text-foreground mb-4">Recent Activity</h3>
                {isLoadingTransactions ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <Loader2 className="w-12 h-12 mx-auto mb-2 opacity-50 animate-spin" />
                        <p>Loading transactions...</p>
                    </div>
                ) : transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((tx: any) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tx.type === 'deposit' ? 'bg-success/10' : 'bg-secondary/10'}`}>
                                {tx.type === 'deposit' ? <ArrowDownLeft className="w-5 h-5 text-success"/> : <ArrowUpRight className="w-5 h-5 text-secondary"/>}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">${tx.usdAmount.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">{tx.kesAmount.toLocaleString()} KES</p>
                            </div>
                        </div>
                        <div className="text-right">
                           <div className="flex items-center justify-end gap-2 text-xs">
                                <div className={`w-2 h-2 rounded-full ${tx.status === 'completed' ? 'bg-success' : 'bg-warning'}`}></div>
                                <p className="text-muted-foreground capitalize">{tx.status}</p>
                           </div>
                          <p className="text-xs text-muted-foreground/80 mt-1">
                            {new Date(tx.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground/80">
                    <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No transactions yet</p>
                  </div>
                )}
            </div>
        </div>
    </div>
  );
}
