'use client';

import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

const chartData = [
  { day: 'Mon', deposits: 120, withdrawals: 80 },
  { day: 'Tue', deposits: 190, withdrawals: 120 },
  { day: 'Wed', deposits: 300, withdrawals: 200 },
  { day: 'Thu', deposits: 500, withdrawals: 300 },
  { day: 'Fri', deposits: 200, withdrawals: 150 },
  { day: 'Sat', deposits: 300, withdrawals: 250 },
  { day: 'Sun', deposits: 450, withdrawals: 200 },
];

const chartConfig = {
  deposits: {
    label: 'Deposits',
    color: '#22c55e',
  },
  withdrawals: {
    label: 'Withdrawals',
    color: '#a855f7',
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  const { user, selectedAccount } = useAuth();

  return (
    <div className="slide-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400">
          Welcome back, <span id="userName">{user?.fullname || 'User'}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-effect rounded-xl p-6 custom-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm">Deriv Balance</p>
              <h2 className="text-2xl font-bold text-white mt-1">
                {selectedAccount
                  ? `${selectedAccount.currency || 'USD'} ${' '}${(
                      selectedAccount.balance || 0
                    ).toFixed(2)}`
                  : '$0.00'}
              </h2>
            </div>
            <div className="bg-blue-500 bg-opacity-20 rounded-full p-3">
              <i className="fas fa-wallet text-blue-500"></i>
            </div>
          </div>
          <div className="mt-4 text-sm">
            <span className="text-green-500">
              <i className="fas fa-arrow-up mr-1"></i>3.5%
            </span>
            <span className="text-gray-400 ml-2">from last week</span>
          </div>
        </div>

        <Link
          href="/deposit"
          className="glass-effect rounded-xl p-6 custom-shadow block hover:bg-slate-700/70 transition-colors duration-300"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Deposit</h3>
              <p className="text-gray-400 text-sm mt-1">Add funds via M-Pesa</p>
            </div>
            <div className="bg-green-500 bg-opacity-20 rounded-full p-3">
              <i className="fas fa-arrow-down text-green-500"></i>
            </div>
          </div>
          <div className="mt-4 text-sm">
            <span className="text-green-400 font-medium">
              Click to start deposit
            </span>
          </div>
        </Link>

        <Link
          href="/withdraw"
          className="glass-effect rounded-xl p-6 custom-shadow block hover:bg-slate-700/70 transition-colors duration-300"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Withdraw</h3>
              <p className="text-gray-400 text-sm mt-1">Send funds to M-Pesa</p>
            </div>
            <div className="bg-purple-500 bg-opacity-20 rounded-full p-3">
              <i className="fas fa-arrow-up text-purple-500"></i>
            </div>
          </div>
          <div className="mt-4 text-sm">
            <span className="text-purple-400 font-medium">
              Click to start withdrawal
            </span>
          </div>
        </Link>
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
            <ChartContainer config={chartConfig} className="h-full w-full">
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(71, 85, 105, 0.5)"
                />
                <XAxis
                  dataKey="day"
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Legend />
                <Line
                  dataKey="deposits"
                  type="monotone"
                  stroke="var(--color-deposits)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  dataKey="withdrawals"
                  type="monotone"
                  stroke="var(--color-withdrawals)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
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
