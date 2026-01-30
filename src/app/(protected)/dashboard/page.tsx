
'use client';

import { AppLayout } from '@/components/app-layout';
import { useAuth } from '@/context/auth-context';
import { useEffect, useRef } from 'react';

declare var Chart: any;

export default function DashboardPage() {
  const { user, selectedAccount } = useAuth();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (chartRef.current && typeof Chart !== 'undefined') {
       if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              datasets: [
                {
                  label: 'Deposits',
                  data: [120, 190, 300, 500, 200, 300, 450],
                  borderColor: '#22c55e', // green-500
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  fill: true,
                  tension: 0.4,
                },
                {
                  label: 'Withdrawals',
                  data: [80, 120, 200, 300, 150, 250, 200],
                  borderColor: '#a855f7', // purple-500
                  backgroundColor: 'rgba(168, 85, 247, 0.1)',
                  fill: true,
                  tension: 0.4,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                  labels: {
                    color: '#94a3b8' // slate-400
                  }
                },
                tooltip: {
                  mode: 'index',
                  intersect: false,
                },
              },
              scales: {
                x: {
                  grid: {
                    color: 'rgba(71, 85, 105, 0.5)' // slate-700
                  },
                  ticks: {
                    color: '#94a3b8' // slate-400
                  }
                },
                y: {
                  grid: {
                    color: 'rgba(71, 85, 105, 0.5)' // slate-700
                  },
                  ticks: {
                    color: '#94a3b8' // slate-400
                  }
                },
              },
            },
        });
      }
    }
     return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  const totalDeposits = 8890.00;
  const totalWithdrawals = 2560.00;

  return (
      <div className="slide-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">Welcome back, <span id="userName">{user?.fullname || 'User'}</span></p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-effect rounded-xl p-6 custom-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm">Deriv Balance</p>
                <h2 className="text-2xl font-bold text-white mt-1">
                  {selectedAccount ? `${selectedAccount.currency} ${selectedAccount.balance.toFixed(2)}` : '$0.00'}
                </h2>
              </div>
              <div className="bg-blue-500 bg-opacity-20 rounded-full p-3">
                <i className="fas fa-wallet text-blue-500"></i>
              </div>
            </div>
            <div className="mt-4 text-sm">
              <span className="text-green-500"><i className="fas fa-arrow-up mr-1"></i>3.5%</span>
              <span className="text-gray-400 ml-2">from last week</span>
            </div>
          </div>
          
          <div className="glass-effect rounded-xl p-6 custom-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Deposits</p>
                <h2 className="text-2xl font-bold text-white mt-1">${totalDeposits.toFixed(2)}</h2>
              </div>
              <div className="bg-green-500 bg-opacity-20 rounded-full p-3">
                <i className="fas fa-arrow-down text-green-500"></i>
              </div>
            </div>
             <div className="mt-4 text-sm">
              <span className="text-green-500"><i className="fas fa-arrow-up mr-1"></i>12.4%</span>
              <span className="text-gray-400 ml-2">from last month</span>
            </div>
          </div>
          
          <div className="glass-effect rounded-xl p-6 custom-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Withdrawals</p>
                <h2 className="text-2xl font-bold text-white mt-1">${totalWithdrawals.toFixed(2)}</h2>
              </div>
              <div className="bg-purple-500 bg-opacity-20 rounded-full p-3">
                <i className="fas fa-arrow-up text-purple-500"></i>
              </div>
            </div>
             <div className="mt-4 text-sm">
              <span className="text-red-500"><i className="fas fa-arrow-down mr-1"></i>5.1%</span>
              <span className="text-gray-400 ml-2">from last month</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-effect rounded-xl p-6 custom-shadow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-medium text-white">Transaction Overview</h3>
              <select className="bg-slate-800 border border-slate-700 rounded-lg text-sm text-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
              </select>
            </div>
            <div className="relative h-[250px]">
              <canvas ref={chartRef}></canvas>
            </div>
          </div>
          
          <div className="glass-effect rounded-xl p-6 custom-shadow">
            <h3 className="font-medium text-white mb-4">Recent Transactions</h3>
            <div className="space-y-4">
              {/* Recent transactions would be mapped here */}
            </div>
          </div>
        </div>
      </div>
  );
}
