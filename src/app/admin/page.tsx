
'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Settings,
  Lock,
} from 'lucide-react';

interface Stats {
  totalDeposits: number;
  totalWithdrawals: number;
  activeUsers: number;
  pendingTransactions: number;
  todayRevenue: number;
  depositCount: number;
  withdrawalCount: number;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  derivAccount: string;
  usdAmount: number;
  kesAmount: number;
  status: 'completed' | 'pending' | 'failed';
  timestamp: number;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [stats, setStats] = useState<Stats>({
    totalDeposits: 0,
    totalWithdrawals: 0,
    activeUsers: 0,
    pendingTransactions: 0,
    todayRevenue: 0,
    depositCount: 0,
    withdrawalCount: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [depositRate, setDepositRate] = useState(130);
  const [withdrawRate, setWithdrawRate] = useState(124);
  const [isLoading, setIsLoading] = useState(false);
  
  const ADMIN_PASSWORD = 'abepay2026';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
    } else {
      alert('Incorrect password');
      setPassword('');
    }
  };
  
  useEffect(() => {
    const authenticated = sessionStorage.getItem('admin_authenticated');
    if (authenticated === 'true') {
      setIsAuthenticated(true);
    }
  }, []);
  
  useEffect(() => {
    if (isAuthenticated) {
        loadDashboardData();
    }
  }, [isAuthenticated]);


  const loadDashboardData = async () => {
    setIsLoading(true);
    
    try {
      // Load stats
      const statsRes = await fetch('/api/admin/stats');
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // Load recent transactions
      const txRes = await fetch('/api/admin/transactions');
      const txData = await txRes.json();
      if (txData.success) {
        setRecentTransactions(txData.transactions.slice(0, 10));
      }

      // Load current rates
      const ratesRes = await fetch('/api/rates/get');
      const ratesData = await ratesRes.json();
      if (ratesData.success) {
        setDepositRate(ratesData.depositRate);
        setWithdrawRate(ratesData.withdrawRate);
      }

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRates = async () => {
    try {
      const response = await fetch('/api/rates/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depositRate,
          withdrawRate,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Rates updated successfully!');
      } else {
        alert('Failed to update rates');
      }
    } catch (error) {
      console.error('Error updating rates:', error);
      alert('Error updating rates');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card rounded-2xl p-8 shadow-2xl">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <Lock className="w-10 h-10 text-primary-foreground" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Admin Access</h1>
              <p className="text-muted-foreground text-sm">ABEPAY Backoffice</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full h-14 px-4 bg-input border border-border rounded-xl text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                required
              />
              <button
                type="submit"
                className="w-full h-14 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground rounded-xl font-semibold text-lg shadow-xl transition-all"
              >
                Login to Admin
              </button>
            </form>
            <p className="text-xs text-muted-foreground/80">
              Default password: abepay2026
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">ABEPAY Management Console</p>
          </div>
          <button
            onClick={loadDashboardData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-accent text-foreground rounded-xl transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-success to-green-700 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-green-200 text-sm">{stats.depositCount} txns</span>
            </div>
            <p className="text-white/80 text-sm mb-1">Total Deposits</p>
            <p className="text-3xl font-bold text-white">${stats.totalDeposits.toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-br from-destructive to-orange-700 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
              <span className="text-orange-200 text-sm">{stats.withdrawalCount} txns</span>
            </div>
            <p className="text-white/80 text-sm mb-1">Total Withdrawals</p>
            <p className="text-3xl font-bold text-white">${stats.totalWithdrawals.toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-br from-primary to-blue-700 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <Activity className="w-5 h-5 text-blue-200" />
            </div>
            <p className="text-white/80 text-sm mb-1">Active Users</p>
            <p className="text-3xl font-bold text-white">{stats.activeUsers}</p>
          </div>

          <div className="bg-gradient-to-br from-secondary to-purple-700 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <span className="text-purple-200 text-sm">Today</span>
            </div>
            <p className="text-white/80 text-sm mb-1">Revenue</p>
            <p className="text-3xl font-bold text-white">${stats.todayRevenue.toFixed(2)}</p>
          </div>
        </div>

        {/* Exchange Rates */}
        <div className="bg-card rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-foreground mb-6">Exchange Rates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Deposit Rate (KES per USD)
              </label>
              <input
                type="number"
                value={depositRate}
                onChange={(e) => setDepositRate(parseFloat(e.target.value))}
                className="w-full h-12 px-4 bg-input border border-border rounded-xl text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Withdrawal Rate (KES per USD)
              </label>
              <input
                type="number"
                value={withdrawRate}
                onChange={(e) => setWithdrawRate(parseFloat(e.target.value))}
                className="w-full h-12 px-4 bg-input border border-border rounded-xl text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <button
            onClick={handleUpdateRates}
            className="mt-6 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold shadow-lg transition-all"
          >
            Update Rates
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="bg-card rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-foreground mb-6">Recent Transactions</h2>
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No transactions yet</p>
            ) : (
              recentTransactions.map((tx, idx) => (
                <div
                  key={idx}
                  className="bg-accent/50 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'deposit' ? 'bg-success/20' : 'bg-destructive/20'
                    }`}>
                      {tx.type === 'deposit' ? (
                        <TrendingUp className="w-5 h-5 text-success" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="text-foreground font-semibold capitalize">
                        {tx.type}
                      </p>
                      <p className="text-muted-foreground text-sm">{tx.derivAccount}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-foreground font-semibold">
                      ${tx.usdAmount.toFixed(2)}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {tx.kesAmount.toLocaleString()} KES
                    </p>
                  </div>
                  <div>
                    {tx.status === 'completed' && (
                      <span className="flex items-center gap-1 text-success text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Completed
                      </span>
                    )}
                    {tx.status === 'pending' && (
                      <span className="flex items-center gap-1 text-warning text-sm">
                        <Clock className="w-4 h-4" />
                        Pending
                      </span>
                    )}
                    {tx.status === 'failed' && (
                      <span className="flex items-center gap-1 text-destructive text-sm">
                        <AlertCircle className="w-4 h-4" />
                        Failed
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

    