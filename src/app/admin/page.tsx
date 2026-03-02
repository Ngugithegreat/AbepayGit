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
    
    // Load rates from localStorage
    const savedDepositRate = localStorage.getItem('deposit_rate');
    if (savedDepositRate) {
      setDepositRate(Number(savedDepositRate));
    }
    const savedWithdrawRate = localStorage.getItem('withdraw_rate');
    if (savedWithdrawRate) {
      setWithdrawRate(Number(savedWithdrawRate));
    }
  }, []);

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

  const handleUpdateRates = () => {
    localStorage.setItem('deposit_rate', depositRate.toString());
    localStorage.setItem('withdraw_rate', withdrawRate.toString());
    alert('Rates updated successfully!');
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
