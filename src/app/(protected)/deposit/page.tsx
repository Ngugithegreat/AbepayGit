'use client';

import { useAuth } from '@/context/auth-context';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function DepositPage() {
  const { selectedAccount } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [kesAmount, setKesAmount] = useState('');
  const [usdAmount, setUsdAmount] = useState(0);
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const exchangeRate = 130; // Example rate

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const kes = e.target.value;
    setKesAmount(kes);
    setMessage('');
    if (kes && !isNaN(parseFloat(kes))) {
        setUsdAmount(parseFloat(kes) / exchangeRate);
    } else {
        setUsdAmount(0);
    }
  }

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) {
        toast({
            title: "Error",
            description: "No account selected.",
            variant: "destructive"
        });
        return;
    }
    const kesAmountNumber = parseFloat(kesAmount);
    if (usdAmount < 1) {
        toast({
            title: "Error",
            description: `Minimum deposit is KES ${exchangeRate} (equivalent to $1 USD).`,
            variant: "destructive"
        });
        return;
    }
    
    setIsLoading(true);
    setMessage('');

    try {
        const response = await fetch('/api/mpesa/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: phone,
                amount: kesAmountNumber,
                loginid: selectedAccount.loginid
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            setMessage('✅ STK push sent! Check your phone and enter M-Pesa PIN to complete the transaction.');
            toast({
                title: "Action Required",
                description: "Check your phone to complete the M-Pesa payment.",
            });
        } else {
            toast({
                title: "Payment Failed",
                description: data.error || "Could not initiate M-Pesa payment. Please try again.",
                variant: "destructive"
            });
        }
    } catch (error) {
        console.error("Deposit error:", error);
        toast({
            title: "Error",
            description: "An unexpected error occurred. Please check your connection and try again.",
            variant: "destructive"
        });
    } finally {
        setIsLoading(false);
    }
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
            <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-300 mb-1">Amount (KES)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 sm:text-sm">KES</span>
              </div>
              <input type="number" id="depositAmount" value={kesAmount} onChange={handleAmountChange} required min="1" placeholder="0" className="pl-12 w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white" />
            </div>
            <div className="text-xs text-gray-500 mt-2 flex justify-between">
                <span>Min: {exchangeRate} KES</span>
                <span className="font-medium text-gray-400">Rate: 1 USD ≈ {exchangeRate} KES</span>
            </div>
             {usdAmount > 0 && (
                <p className="text-sm text-green-400 mt-2">You will deposit approximately <span className="font-bold">${usdAmount.toFixed(2)} USD</span>.</p>
            )}
          </div>
          {message && (
            <div className="p-4 bg-blue-900/50 border border-blue-700 rounded-lg text-blue-300 text-sm">
                {message}
            </div>
          )}
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
            <span>Enter the amount in KES you wish to deposit (Min: {exchangeRate}).</span>
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
