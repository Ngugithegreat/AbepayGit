
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ArrowDownLeft, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DepositPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [kesAmount, setKesAmount] = useState('');
  const [usdAmount, setUsdAmount] = useState('0.00');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [exchangeRate, setExchangeRate] = useState(130); // Default rate
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [derivAccount, setDerivAccount] = useState('');

  useEffect(() => {
    // Get logged-in user's account
    const loginid = localStorage.getItem('deriv_loginid');
    if (loginid) {
      setDerivAccount(loginid);
    }
  }, []);
  
  useEffect(() => {
    const loadRate = async () => {
      try {
        const response = await fetch('/api/rates/get');
        const data = await response.json();
        
        if (data.success) {
          setExchangeRate(data.depositRate);
        }
      } catch (error) {
        console.error("Failed to load rate", error);
      }
    };
    
    loadRate();
  }, []);

  const MIN_USD = 1.00;
  const MAX_USD = 2000.00;
  const minKes = MIN_USD * exchangeRate;
  const maxKes = MAX_USD * exchangeRate;

  const handleKesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setKesAmount(value);
    setError('');
    
    const kes = parseFloat(value) || 0;
    const usd = kes / exchangeRate;
    setUsdAmount(usd.toFixed(2));

    // Validate amount
    if (kes > 0 && kes < minKes) {
      setError(`Minimum deposit is ${minKes} KES ($${MIN_USD.toFixed(2)} USD)`);
    } else if (kes > maxKes) {
      setError(`Maximum deposit is ${maxKes.toLocaleString()} KES ($${MAX_USD.toLocaleString()} USD)`);
    } else {
      setError('');
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!derivAccount) {
        toast({
            title: "Error",
            description: "No account selected.",
            variant: "destructive"
        });
        return;
    }

    const kesValue = parseFloat(kesAmount);
    if (kesValue < minKes) {
      setError(`Minimum deposit is ${minKes} KES ($${MIN_USD.toFixed(2)} USD)`);
      return;
    }

    if (kesValue > maxKes) {
      setError(`Maximum deposit is ${maxKes.toLocaleString()} KES ($${MAX_USD.toLocaleString()} USD)`);
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
        const response = await fetch('/api/mpesa/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: phone,
                amount: kesValue,
                derivAccount: derivAccount
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            setModalMessage(`STK push sent! Check your phone (${phone}) and enter your M-Pesa PIN to complete the transaction.`);
            setShowModal(true);
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
    <div className="space-y-6">
      <div className="glass-effect rounded-xl p-6 custom-shadow">
        <form onSubmit={handleDeposit} className="space-y-6">
           <div>
            <label htmlFor="depositAccount" className="block text-sm font-medium text-gray-300 mb-1">Deposit to Account</label>
            <div id="depositAccount" className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white opacity-70">
              {derivAccount || 'Loading account...'}
            </div>
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
              <input type="number" id="depositAmount" value={kesAmount} onChange={handleKesChange} required min={minKes} max={maxKes} placeholder={`Minimum ${minKes.toLocaleString()}`} className="pl-12 w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white" />
            </div>
            
            <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-400">Min: {minKes.toLocaleString()} KES</span>
                <span className="text-gray-400">Rate: 1 USD = {exchangeRate} KES</span>
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
            <button type="submit" disabled={isLoading || !!error || !kesAmount || !derivAccount} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 flex items-center justify-center disabled:bg-blue-800 disabled:cursor-not-allowed">
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
    {showModal && (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6 animate-fade-in">
        <div className="glass-effect rounded-2xl p-8 max-w-sm w-full space-y-6 animate-scale-in custom-shadow">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-900/50 border-2 border-green-500 flex items-center justify-center mb-4">
              <Check className="w-10 h-10 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Action Required
            </h3>
            <p className="text-gray-300">
              {modalMessage}
            </p>
          </div>
          
          <button
            onClick={() => {
              setShowModal(false);
              router.push('/dashboard');
            }}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200"
          >
            Okay
          </button>
        </div>
      </div>
    )}
  </div>
  );
}
