'use client';

import { useAuth } from '@/context/auth-context';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ArrowDownLeft, Info } from 'lucide-react';

export default function DepositPage() {
  const { selectedAccount } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [kesAmount, setKesAmount] = useState('');
  const [usdAmount, setUsdAmount] = useState('0.00');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [exchangeRate, setExchangeRate] = useState(130); // Default rate

  const MIN_USD = 1.00;
  const MAX_USD = 2000.00;
  const MIN_KES = MIN_USD * exchangeRate;
  const MAX_KES = MAX_USD * exchangeRate;

  useEffect(() => {
    const savedRate = localStorage.getItem('deposit_rate');
    if (savedRate) {
      setExchangeRate(Number(savedRate));
    }
  }, [exchangeRate]);

  const handleKesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setKesAmount(value);
    setError('');
    
    const kes = parseFloat(value) || 0;
    const usd = kes / exchangeRate;
    setUsdAmount(usd.toFixed(2));

    // Validate amount
    if (kes > 0 && kes < MIN_KES) {
      setError(`Minimum deposit is ${MIN_KES} KES ($${MIN_USD.toFixed(2)} USD)`);
    } else if (kes > MAX_KES) {
      setError(`Maximum deposit is ${MAX_KES.toLocaleString()} KES ($${MAX_USD.toLocaleString()} USD)`);
    }
  };

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

    const kesValue = parseFloat(kesAmount);
    if (kesValue < MIN_KES) {
      setError(`Minimum deposit is ${MIN_KES} KES ($${MIN_USD.toFixed(2)} USD)`);
      return;
    }

    if (kesValue > MAX_KES) {
      setError(`Maximum deposit is ${MAX_KES.toLocaleString()} KES ($${MAX_USD.toLocaleString()} USD)`);
      return;
    }
    
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
        const response = await fetch('/api/mpesa/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: phone,
                amount: kesValue,
                derivAccount: selectedAccount.loginid
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            toast({
                title: "Action Required",
                description: `✅ STK push sent! Check your phone (${phone}) and enter your M-Pesa PIN.`,
            });
            setKesAmount('');
            setUsdAmount('0.00');
            setPhone('');
        } else {
            setError(data.error || "Could not initiate M-Pesa payment. Please try again.");
        }
    } catch (error) {
        console.error("Deposit error:", error);
        setError("An unexpected network error occurred. Please try again.");
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="slide-in">
    <div className="mb-6 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
            <ArrowDownLeft className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>
        <div>
            <h1 className="text-2xl font-bold text-white">Deposit</h1>
            <p className="text-gray-400">Add funds via M-Pesa</p>
        </div>
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
              <input type="number" id="depositAmount" value={kesAmount} onChange={handleKesChange} required min={MIN_KES} max={MAX_KES} placeholder={`Minimum ${MIN_KES}`} className="pl-12 w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white" />
            </div>
            
            {parseFloat(usdAmount) > 0 && !error && (
              <div className="mt-3 p-3 bg-green-900/50 rounded-lg border border-green-700">
                <p className="text-sm text-green-300">
                  You will receive: <strong className="text-xl">${usdAmount} USD</strong>
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
                {error}
            </div>
          )}

          <div>
            <button type="submit" disabled={isLoading || !!error || !kesAmount} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 flex items-center justify-center disabled:bg-blue-800 disabled:cursor-not-allowed">
              {isLoading ? <span className="loader h-5 w-5 border-2 rounded-full"></span> : 'Deposit Now'}
            </button>
          </div>
        </form>
      </div>
      <div className="glass-effect rounded-xl p-6 custom-shadow space-y-6">
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-700/50">
            <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-green-200 space-y-1">
                <p className="font-semibold">Deposit Rules</p>
                <p>• Minimum: {MIN_KES.toLocaleString()} KES (${MIN_USD.toFixed(2)} USD)</p>
                <p>• Maximum: {MAX_KES.toLocaleString()} KES (${MAX_USD.toLocaleString()} USD)</p>
                <p>• Rate: {exchangeRate} KES = $1 USD</p>
                </div>
            </div>
        </div>
        <div>
            <h3 className="font-medium text-white mb-4">How It Works</h3>
            <ul className="space-y-4 text-sm text-gray-300">
            <li className="flex items-start">
                <span className="bg-slate-700 text-blue-400 rounded-full h-6 w-6 flex-shrink-0 flex items-center justify-center mr-3 font-bold">1</span>
                <span>Enter your M-Pesa number and amount in KES.</span>
            </li>
            <li className="flex items-start">
                <span className="bg-slate-700 text-blue-400 rounded-full h-6 w-6 flex-shrink-0 flex items-center justify-center mr-3 font-bold">2</span>
                <span>Click 'Deposit Now' to receive an STK push.</span>
            </li>
            <li className="flex items-start">
                <span className="bg-slate-700 text-blue-400 rounded-full h-6 w-6 flex-shrink-0 flex items-center justify-center mr-3 font-bold">3</span>
                <span>Enter your M-Pesa PIN on your phone to confirm.</span>
            </li>
            <li className="flex items-start">
                <span className="bg-slate-700 text-blue-400 rounded-full h-6 w-6 flex-shrink-0 flex items-center justify-center mr-3 font-bold">4</span>
                <span>Funds are credited to your Deriv account instantly!</span>
            </li>
            </ul>
        </div>
      </div>
    </div>
  </div>
  );
}
