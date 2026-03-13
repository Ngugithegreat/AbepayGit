'use client';

import { useAuth } from '@/context/auth-context';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function WithdrawPage() {
  const { selectedAccount, updateBalance } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [kesAmount, setKesAmount] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(128); // Default rate

  useEffect(() => {
    const loadRate = async () => {
      try {
        const response = await fetch('/api/rates/get');
        const data = await response.json();
        
        if (data.success) {
          setExchangeRate(data.withdrawRate);
        }
      } catch (error) {
        console.error("Failed to load rate", error);
      }
    };
    
    loadRate();
  }, []);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const usd = e.target.value;
    setWithdrawAmount(usd);
    if (usd && !isNaN(parseFloat(usd))) {
        setKesAmount(parseFloat(usd) * exchangeRate);
    } else {
        setKesAmount(0);
    }
  }

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
    if(amount > (selectedAccount.balance || 0)) {
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
            updateBalance((selectedAccount.balance || 0) - amount);
            toast({
                title: "Withdrawal Successful",
                description: `Successfully withdrew $${amount.toFixed(2)}.`,
            });
            setWithdrawAmount('');
            setKesAmount(0);
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
          <h1 className="text-2xl font-bold text-foreground">Withdraw Funds</h1>
          <p className="text-muted-foreground">Transfer funds from your Deriv account to M-Pesa</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 glass-effect rounded-xl p-6 custom-shadow">
            <form onSubmit={handleWithdraw} className="space-y-6">
              <div>
                <label htmlFor="withdrawAccount" className="block text-sm font-medium text-muted-foreground mb-1">Withdraw from Account</label>
                <input type="text" id="withdrawAccount" disabled value={selectedAccount ? `${selectedAccount.loginid} (Balance: ${(selectedAccount.balance || 0).toFixed(2)})` : 'No Account Linked'} className="w-full p-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground disabled:opacity-70"/>
              </div>
              <div>
                <label htmlFor="withdrawPhone" className="block text-sm font-medium text-muted-foreground mb-1">M-Pesa Phone Number</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 bg-muted border border-r-0 border-border rounded-l-md text-muted-foreground">
                    +254
                  </span>
                  <input type="tel" id="withdrawPhone" value={phone} onChange={(e) => setPhone(e.target.value)} pattern="[0-9]{9}" required placeholder="7XXXXXXXX" className="flex-1 p-3 bg-input border border-border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground" />
                </div>
              </div>
              <div>
                <label htmlFor="withdrawAmount" className="block text-sm font-medium text-muted-foreground mb-1">Amount (USD)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-muted-foreground sm:text-sm">$</span>
                  </div>
                  <input type="number" id="withdrawAmount" value={withdrawAmount} onChange={handleAmountChange} required min="1" placeholder="0.00" className="pl-8 w-full p-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground" />
                </div>
                 <div className="text-xs text-muted-foreground/80 mt-2 flex justify-between">
                    <span>Min: $1.00</span>
                     <span className="font-medium text-muted-foreground">Rate: 1 USD ≈ {exchangeRate} KES</span>
                </div>
                 {kesAmount > 0 && (
                    <p className="text-sm text-success mt-2">You will receive approximately <span className="font-bold">KES {kesAmount.toFixed(2)}</span>.</p>
                )}
              </div>
              <div>
                <button type="submit" disabled={isLoading} className="w-full py-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-medium rounded-lg transition duration-200 flex items-center justify-center disabled:opacity-50">
                  {isLoading ? <span className="loader h-5 w-5 border-2 rounded-full"></span> : 'Withdraw Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
  );
}
