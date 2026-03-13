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

  const [syncAccount, setSyncAccount] = useState('');
  const [syncBalance, setSyncBalance] = useState('');

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

  const handleSyncBalance = async () => {
    try {
      const response = await fetch('/api/admin/sync-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: syncAccount,
          balance: parseFloat(syncBalance),
        }),
      });
  
      const data = await response.json();
  
      if (data.success) {
        alert('✅ Balance synced successfully!');
        setSyncAccount('');
        setSyncBalance('');
      } else {
        alert('❌ Failed: ' + data.error);
      }
    } catch (error) {
      alert('❌ Error syncing balance');
    }
  };

  // Password prompt screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center">
                <Lock className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Admin Access</h1>
              <p className="text-gray-400 text-sm">ABEPAY Backoffice</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full h-14 px-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                required
              />
              
              <button
                type="submit"
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-semibold text-lg shadow-xl transition-all"
              >
                Login to Admin
              </button>
            </form>

            <p className="text-xs text-gray-500">
              Default password: abepay2026
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render the full dashboard if authenticated
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">ABEPAY Backoffice</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center">
              <span className="text-xl font-black text-white">A</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Deposits</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingDeposits}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Volume</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalVolume}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Now</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeTransactions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Exchange Rates Management */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-bold text-gray-900">Exchange Rates</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deposit Rate (KES per 1 USD)
              </label>
              <input
                type="number"
                value={depositRate}
                onChange={(e) => setDepositRate(Number(e.target.value))}
                className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Users pay {depositRate} KES to get 1 USD
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Withdrawal Rate (KES per 1 USD)
              </label>
              <input
                type="number"
                value={withdrawRate}
                onChange={(e) => setWithdrawRate(Number(e.target.value))}
                className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Users receive {withdrawRate} KES for 1 USD
              </p>
            </div>
          </div>

          <button
            onClick={handleUpdateRates}
            className="mt-6 h-12 px-8 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-semibold shadow-lg transition-all"
          >
            Update Rates
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Sync User Balance</h2>
          <p className="text-sm text-gray-600 mb-4">
            Manually set a user's balance (one-time sync with their actual Deriv balance)
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deriv Account (e.g., CR2542302)
              </label>
              <input
                type="text"
                value={syncAccount}
                onChange={(e) => setSyncAccount(e.target.value)}
                placeholder="CR2542302"
                className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Balance (USD)
              </label>
              <input
                type="number"
                value={syncBalance}
                onChange={(e) => setSyncBalance(e.target.value)}
                placeholder="1.01"
                step="0.01"
                className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleSyncBalance}
            className="mt-4 h-12 px-8 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-semibold shadow-lg transition-all"
          >
            Sync Balance
          </button>
        </div>


        {/* Pending Deposits */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Deposits</h2>
          <div className="text-center py-8 text-gray-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No pending deposits</p>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">User Management</h2>
          <div className="text-center py-8 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No users yet</p>
          </div>
        </div>
      </div>
    </div>
  );
}
