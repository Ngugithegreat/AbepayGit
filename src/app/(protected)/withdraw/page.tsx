'use client';

import { AppLayout } from '@/components/app-layout';
import { useAuth } from '@/context/auth-context';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function WithdrawPage() {
  const { selectedAccount, updateBalance } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [phone, setPhone] = useState('');

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) {
        toast({
            title: "Error",
            description: "No account selected.",
            variant: "destructive"
        });
        return;
    }
    const amount = parseFloat(withdrawAmount);
    if(amount > selectedAccount.balance) {
         toast({
            title: "Error",
            description: "Withdrawal amount cannot exceed your balance.",
            variant: "destructive"
        });
        return;
    }
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
        const isSuccess = Math.random() > 0.1;
        
        if(isSuccess) {
            updateBalance(selectedAccount.balance - amount);
            toast({
                title: "Withdrawal Successful",
                description: `Successfully withdrew $${amount.toFixed(2)}.`
            });
            setWithdrawAmount('');
        } else {
            toast({
                title: "Withdrawal Failed",
                description: "Could not process your withdrawal. Please try again.",
                variant: "destructive"
            });
        }
        setIsLoading(false);
    }, 3000);
  }

  return (
      <div className="slide-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Withdraw Funds</h1>
          <p className="text-gray-400">Transfer funds from your Deriv account to M-Pesa</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 glass-effect rounded-xl p-6 custom-shadow">
            <form onSubmit={handleWithdraw} className="space-y-6">
              <div>
                <label htmlFor="withdrawAccount" className="block text-sm font-medium text-gray-300 mb-1">Withdraw from Account</label>
                <input type="text" id="withdrawAccount" disabled value={selectedAccount ? `${selectedAccount.loginid} (Balance: ${selectedAccount.balance.toFixed(2)})` : 'No Account Linked'} className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white disabled:opacity-70"/>
              </div>
              <div>
                <label htmlFor="withdrawPhone" className="block text-sm font-medium text-gray-300 mb-1">M-Pesa Phone Number</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 bg-slate-700 border border-r-0 border-slate-600 rounded-l-md text-gray-400">
                    +254
                  </span>
                  <input type="tel" id="withdrawPhone" value={phone} onChange={(e) => setPhone(e.target.value)} pattern="[0-9]{9}" required placeholder="7XXXXXXXX" className="flex-1 p-3 bg-slate-800 border border-slate-700 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white" />
                </div>
              </div>
              <div>
                <label htmlFor="withdrawAmount" className="block text-sm font-medium text-gray-300 mb-1">Amount (USD)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 sm:text-sm">$</span>
                  </div>
                  <input type="number" id="withdrawAmount" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} required min="1" placeholder="0.00" className="pl-8 w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white" />
                </div>
                 <p className="text-xs text-gray-500 mt-1">Min: $1.00</p>
              </div>
              <div>
                <button type="submit" disabled={isLoading} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition duration-200 flex items-center justify-center disabled:bg-purple-800">
                  {isLoading ? <span className="loader h-5 w-5 border-2 rounded-full"></span> : 'Withdraw Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
  );
}
