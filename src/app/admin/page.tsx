'use client';

import { useState, useEffect } from 'react';
import { Users, DollarSign, AlertCircle, TrendingUp, Settings, Lock } from 'lucide-react';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  // Admin password (in production, this should be in environment variables)
  const ADMIN_PASSWORD = 'abepay2026';

  // Stats and rates state
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingDeposits: 0,
    totalVolume: 0,
    activeTransactions: 0,
  });
  const [depositRate, setDepositRate] = useState(130);
  const [withdrawRate, setWithdrawRate] = useState(124);

  useEffect(() => {
    // Check if already authenticated in this session
    const authenticated = sessionStorage.getItem('admin_authenticated');
    if (authenticated === 'true') {
      setIsAuthenticated(true);
    }
    
    const loadRates = async () => {
      try {
        const response = await fetch('/api/rates/get');
        const data = await response.json();
        
        if (data.success) {
          setDepositRate(data.depositRate);
          setWithdrawRate(data.withdrawRate);
        }
      } catch (error) {
        console.error("Failed to load rates", error);
      }
    };
    
    if (isAuthenticated) {
      loadRates();
    }
  }, [isAuthenticated]);

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
        alert('✅ Rates updated successfully!');
      } else {
        alert('❌ Failed to update rates: ' + data.error);
      }
    } catch (error) {
      alert('❌ Error updating rates');
    }
  };

  // Password prompt screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card rounded-2xl p-8 shadow-2xl">
          <div className="text-center space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <Lock className="w-10 h-10 text-primary-foreground" />
              </div>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Admin Access</h1>
              <p className="text-muted-foreground text-sm">ABEPAY Backoffice</p>
            </div>

            {/* Form */}
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

  // Render the full dashboard if authenticated
  return (
    <div className="min-h-screen bg-muted/50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">ABEPAY Backoffice</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <span className="text-xl font-black text-primary-foreground">A</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Deposits</p>
                <p className="text-2xl font-bold text-foreground">{stats.pendingDeposits}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-2xl font-bold text-foreground">${stats.totalVolume}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Now</p>
                <p className="text-2xl font-bold text-foreground">{stats.activeTransactions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Exchange Rates Management */}
        <div className="bg-card rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-6 h-6 text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Exchange Rates</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Deposit Rate (KES per 1 USD)
              </label>
              <input
                type="number"
                value={depositRate}
                onChange={(e) => setDepositRate(Number(e.target.value))}
                className="w-full h-12 px-4 border-2 border-border bg-input rounded-xl focus:border-primary focus:outline-none"
              />
              <p className="text-xs text-muted-foreground/80 mt-1">
                Users pay {depositRate} KES to get 1 USD
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Withdrawal Rate (KES per 1 USD)
              </label>
              <input
                type="number"
                value={withdrawRate}
                onChange={(e) => setWithdrawRate(Number(e.target.value))}
                className="w-full h-12 px-4 border-2 border-border bg-input rounded-xl focus:border-primary focus:outline-none"
              />
              <p className="text-xs text-muted-foreground/80 mt-1">
                Users receive {withdrawRate} KES for 1 USD
              </p>
            </div>
          </div>

          <button
            onClick={handleUpdateRates}
            className="mt-6 h-12 px-8 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground rounded-xl font-semibold shadow-lg transition-all"
          >
            Update Rates
          </button>
        </div>

        {/* Pending Deposits */}
        <div className="bg-card rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-4">Pending Deposits</h2>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No pending deposits</p>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-card rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-4">User Management</h2>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No users yet</p>
          </div>
        </div>
      </div>
    </div>
  );
}
