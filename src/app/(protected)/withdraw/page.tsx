'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Phone, DollarSign, AlertCircle, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function WithdrawPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [usdAmount, setUsdAmount] = useState('');
  const [kesAmount, setKesAmount] = useState(0);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [balance, setBalance] = useState(0);
  const [rate, setRate] = useState(124);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [derivAccount, setDerivAccount] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  useEffect(() => {
    const loginid = localStorage.getItem('deriv_loginid');
    if (loginid) {
      loadWithdrawData(loginid);
    }
  }, []);

  const loadWithdrawData = async (loginid: string) => {
    setIsLoading(true);
    setDerivAccount(loginid);
    
    // Get M-Pesa phone
    const savedPhone = localStorage.getItem('mpesa_phone');
    if (savedPhone) {
      setMpesaPhone(savedPhone);
    } else {
      try {
        const phoneRes = await fetch(`/api/user/get-mpesa?account=${loginid}`);
        const phoneData = await phoneRes.json();
        if (phoneData.success && phoneData.phone) {
          setMpesaPhone(phoneData.phone);
          localStorage.setItem('mpesa_phone', phoneData.phone);
        }
      } catch (e) {
        console.error('Failed to get mpesa phone', e);
      }
    }

    // Get balance
    try {
      const balanceRes = await fetch(`/api/deriv/balance?account=${loginid}`);
      const balanceData = await balanceRes.json();
      if (balanceData.success) {
        setBalance(balanceData.balance);
      } else {
        setError('Could not fetch balance.');
        setBalance(0);
      }
    } catch {
      setError('Could not fetch balance.');
      setBalance(0);
    }
    
    // Get withdrawal rate
    try {
      const rateRes = await fetch('/api/rates/get');
      const rateData = await rateRes.json();
      if (rateData.success) {
        setRate(rateData.withdrawRate);
      }
    } catch {
      // Use default rate
    }

    setIsLoading(false);
  };

  const handleAmountChange = (value: string) => {
    setUsdAmount(value);
    const usd = parseFloat(value) || 0;
    setKesAmount(Math.floor(usd * rate));
    setError('');
  };

  const handleInitiateWithdrawal = async () => {
    const usd = parseFloat(usdAmount);

    if (isNaN(usd) || usd < 1) {
      setError('Minimum withdrawal is $1 USD');
      return;
    }

    if (usd > balance) {
      setError('Insufficient balance');
      return;
    }

    if (usd > 2000) {
      setError('Maximum withdrawal is $2,000 USD');
      return;
    }

    if (!mpesaPhone) {
      setError('Please enter your M-Pesa phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Initiate withdrawal with Deriv
      const response = await fetch('/api/deriv/withdraw/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(usdAmount),
          account: derivAccount,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({ 
          title: "Verification Required", 
          description: "Check your Deriv email for the verification code."
        });
        setShowVerificationModal(true);
      } else {
        setError(data.error || 'Failed to initiate withdrawal');
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndWithdraw = async () => {
    if (!verificationCode || verificationCode.length < 6) {
      setError('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Process withdrawal with verification code
      const response = await fetch('/api/deriv/withdraw/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(usdAmount),
          kesAmount: kesAmount,
          phone: mpesaPhone,
          verificationCode: verificationCode,
          account: derivAccount,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({ 
          title: "Withdrawal Successful!", 
          description: `${kesAmount.toLocaleString()} KES has been sent to ${mpesaPhone}`
        });
        setShowVerificationModal(false);
        router.push('/dashboard');
      } else {
        setError(data.error || 'Withdrawal failed. The code may be incorrect or expired.');
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="slide-in">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center hover:bg-accent/80"
            >
              <ArrowLeft className="w-5 h-5"/>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Withdraw</h1>
              <p className="text-sm text-muted-foreground">Send funds to M-Pesa</p>
            </div>
          </div>

          {/* Balance Card */}
          <div className="bg-gradient-to-br from-secondary to-secondary/90 rounded-2xl p-6 text-secondary-foreground shadow-xl">
            <p className="text-sm opacity-80 mb-1">Available Balance</p>
            <p className="text-4xl font-bold">${balance.toFixed(2)}</p>
            <p className="text-sm opacity-80 mt-1">≈ {Math.floor(balance * rate).toLocaleString()} KES</p>
          </div>

          {/* Withdrawal Form - All in One */}
          <div className="glass-effect rounded-2xl p-6 shadow-lg space-y-6 custom-shadow">
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Amount (USD)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="number"
                  value={usdAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-14 pl-12 pr-4 bg-input border border-border rounded-xl text-foreground text-lg font-semibold focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
              {kesAmount > 0 && (
                <div className="bg-success/10 rounded-xl p-3 border border-success/30 mt-2">
                  <p className="text-sm text-success">
                    You will receive: <strong>{kesAmount.toLocaleString()} KES</strong>
                  </p>
                </div>
              )}
            </div>

            {/* M-Pesa Phone */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                M-Pesa Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="tel"
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                  placeholder="254712345678"
                  className="w-full h-14 pl-12 pr-4 bg-input border border-border rounded-xl text-foreground font-semibold focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
            </div>

            {/* Info */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Min: $1 USD • Max: $2,000 USD</p>
              <p>• Rate: 1 USD = {rate} KES</p>
              <p>• You will receive a verification code via email</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <p>{error}</p>
              </div>
            )}

            {/* Withdraw Button */}
            <button
              onClick={handleInitiateWithdrawal}
              disabled={!usdAmount || parseFloat(usdAmount) < 1 || isLoading || !mpesaPhone}
              className="w-full h-14 bg-gradient-to-r from-[#3B5998] to-[#2d4373] hover:from-[#2d4373] hover:to-[#1e2e4f] disabled:from-gray-300 disabled:to-gray-300 text-white rounded-xl font-semibold text-lg shadow-lg transition-all flex items-center justify-center"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin"/>
              ) : (
                'Confirm Withdrawal'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6 animate-fade-in">
          <div className="glass-effect rounded-2xl p-8 max-w-md w-full space-y-6 animate-scale-in custom-shadow relative">
            {/* Close Button */}
            <button
              onClick={() => setShowVerificationModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">📧</span>
              </div>
              <h3 className="font-semibold text-foreground text-xl">Verification Required</h3>
              <p className="text-sm text-muted-foreground">
                Deriv has sent a verification code to your email. Enter it below to complete the withdrawal.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(e.target.value);
                  setError('');
                }}
                placeholder="Enter code from email"
                maxLength={48}
                className="w-full h-14 px-4 bg-input border border-border rounded-xl text-foreground text-center text-xl font-mono tracking-widest focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <p>{error}</p>
              </div>
            )}

            <button
              onClick={handleVerifyAndWithdraw}
              disabled={isLoading || verificationCode.length < 6}
              className="w-full h-14 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-xl font-semibold text-lg shadow-lg transition-all flex items-center justify-center"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin"/>
              ) : (
                'Verify & Withdraw'
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
