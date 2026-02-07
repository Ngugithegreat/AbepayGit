'use client';

import { useAuth } from '@/context/auth-context';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function DepositPage() {
  const { selectedAccount, updateBalance } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [kesAmount, setKesAmount] = useState(0);
  const exchangeRate = 130; // Example rate

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const usd = e.target.value;
    setDepositAmount(usd);
    if (usd && !isNaN(parseFloat(usd))) {
        setKesAmount(parseFloat(usd) * exchangeRate);
    } else {
        setKesAmount(0);
    }
  }

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) {
        toast({
            title: "Error",
            description: "No account selected.",
            variant: "destructive"
        });
        return;
    }
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
        const amount = parseFloat(depositAmount);
        const isSuccess = Math.random() > 0.1;
        
        if(isSuccess) {
            updateBalance(selectedAccount.balance + amount);
            toast({
                title: "Deposit Successful",
                description: `Successfully deposited $${amount.toFixed(2)}.`
            });
            setDepositAmount('');
            setKesAmount(0);
        } else {
            toast({
                title: "Deposit Failed",
                description: "Could not process your deposit. Please try again.",
                variant: "destructive"
            });
        }
        setIsLoading(false);
    }, 3000);
  }

  return (
    <div className="slide-in">
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-white">Deposit Funds</h1>
      <p className="text-gray-400">Instantly add funds to your Deriv account via M-Pesa</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 glass-effect rounded-xl p-6 custom-shadow">
        <form onSubmit={handleDeposit} className="space-y-6">
           <div>
            <label htmlFor="depositAccount" className="block text-sm font-medium text-gray-300 mb-1">Deposit to Account</label>
            <input type="text" id="depositAccount" disabled value={selectedAccount ? `${selectedAccount.loginid} (${selectedAccount.currency})` : 'No Account Linked'} className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white disabled:opacity-70"/>
          </div>
          <div>
            <label htmlFor="depositPhone" className="block text-sm font-medium text-gray-300 mb-1">M-Pesa Phone Number</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 bg-slate-700 border border-r-0 border-slate-600 rounded-l-md text-gray-400">
                +254
              </span>
              <input type="tel" id="depositPhone" value={phone} onChange={(e) => setPhone(e.target.value)} pattern="[0-9]{9}" required placeholder="7XXXXXXXX" className="flex-1 p-3 bg-slate-800 border border-slate-700 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white" />
            </div>
          </div>
          <div>
            <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-300 mb-1">Amount (USD)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 sm:text-sm">$</span>
              </div>
              <input type="number" id="depositAmount" value={depositAmount} onChange={handleAmountChange} required min="1" max="5000" placeholder="0.00" className="pl-8 w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white" />
            </div>
            <div className="text-xs text-gray-500 mt-2 flex justify-between">
                <span>Min: $1.00, Max: $5000.00</span>
                <span className="font-medium text-gray-400">Rate: 1 USD ≈ {exchangeRate} KES</span>
            </div>
             {kesAmount > 0 && (
                <p className="text-sm text-green-400 mt-2">You will deposit approximately <span className="font-bold">KES {kesAmount.toFixed(2)}</span>.</p>
            )}
          </div>
          <div>
            <button type="submit" disabled={isLoading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 flex items-center justify-center disabled:bg-blue-800">
              {isLoading ? <span className="loader h-5 w-5 border-2 rounded-full"></span> : 'Deposit Now'}
            </button>
          </div>
        </form>
      </div>
      <div className="glass-effect rounded-xl p-6 custom-shadow">
        <h3 className="font-medium text-white mb-4">How It Works</h3>
        <ul className="space-y-4 text-sm text-gray-300">
          <li className="flex items-start">
            <span className="bg-slate-700 text-blue-400 rounded-full h-6 w-6 flex-shrink-0 flex items-center justify-center mr-3 font-bold">1</span>
            <span>Enter the phone number registered with M-Pesa.</span>
          </li>
          <li className="flex items-start">
            <span className="bg-slate-700 text-blue-400 rounded-full h-6 w-6 flex-shrink-0 flex items-center justify-center mr-3 font-bold">2</span>
            <span>Enter the amount in USD you wish to deposit (Min: $1.00).</span>
          </li>
          <li className="flex items-start">
            <span className="bg-slate-700 text-blue-400 rounded-full h-6 w-6 flex-shrink-0 flex items-center justify-center mr-3 font-bold">3</span>
            <span>Click 'Deposit Now' to initiate the transaction.</span>
          </li>
           <li className="flex items-start">
            <span className="bg-slate-700 text-blue-400 rounded-full h-6 w-6 flex-shrink-0 flex items-center justify-center mr-3 font-bold">4</span>
            <span>You will receive a push notification on your phone. Enter your M-Pesa PIN to confirm.</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
  );
}
