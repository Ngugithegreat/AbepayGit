
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Phone, DollarSign, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function WithdrawPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'amount' | 'phone' | 'verify'>('amount');
  const [usdAmount, setUsdAmount] = useState('');
  const [kesAmount, setKesAmount] = useState(0);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [balance, setBalance] = useState(0);
  const [rate, setRate] = useState(124);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [derivAccount, setDerivAccount] = useState('');

  useEffect(() => {
    loadWithdrawData();
  }, []);

  const loadWithdrawData = async () => {
    setIsLoading(true);
    const loginid = localStorage.getItem('deriv_loginid');
    
    console.log('📍 Withdraw page - loginid:', loginid);
    
    if (loginid) {
        setDerivAccount(loginid);

        // Get M-Pesa phone
        const savedPhone = localStorage.getItem('mpesa_phone');
        if (savedPhone) {
          setMpesaPhone(savedPhone);
        } else {
          // Try to get from Redis
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
    } else {
        setError('No Deriv account found. Please log in again.');
    }
    setIsLoading(false);
  };


  const handleAmountChange = (value: string) => {
    setUsdAmount(value);
    const usd = parseFloat(value) || 0;
    setKesAmount(Math.floor(usd * rate));
    setError('');
  };

  const handleContinue = async () => {
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

    setStep('phone');
  };

  const handlePhoneConfirm = async () => {
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
        toast({ title: "Verification Required", description: "A verification code has been sent to your Deriv email."});
        setStep('verify');
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
        toast({ title: "Withdrawal Successful!", description: `${kesAmount} KES has been sent to ${mpesaPhone}`});
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
    <div className="slide-in">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (step === 'phone') setStep('amount');
              else if (step === 'verify') setStep('phone');
              else router.push('/dashboard');
            }}
            className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5"/>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Withdraw</h1>
            <p className="text-sm text-muted-foreground">Send funds to M-Pesa</p>
          </div>
        </div>

        {/* Balance */}
        <div className="bg-gradient-to-br from-secondary to-secondary/90 rounded-2xl p-6 text-secondary-foreground shadow-xl">
          <p className="text-sm opacity-80 mb-1">Available Balance</p>
          <p className="text-4xl font-bold">${balance.toFixed(2)}</p>
          <p className="text-sm opacity-80 mt-1">≈ {Math.floor(balance * rate).toLocaleString()} KES</p>
        </div>

        {/* Step 1: Amount */}
        {step === 'amount' && (
          <div className="space-y-6">
            <div className="glass-effect rounded-2xl p-6 shadow-lg space-y-4 custom-shadow">
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
              </div>

              {kesAmount > 0 && (
                <div className="bg-success/10 rounded-xl p-4 border border-success/30">
                  <p className="text-sm text-success">
                    You will receive: <strong>{kesAmount.toLocaleString()} KES</strong>
                  </p>
                </div>
              )}

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Min: $1 USD • Max: $2,000 USD</p>
                <p>• Rate: 1 USD = {rate} KES</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  <p>{error}</p>
                </div>
              )}
            </div>

            <button
              onClick={handleContinue}
              disabled={!usdAmount || parseFloat(usdAmount) < 1 || isLoading}
              className="w-full h-14 bg-secondary hover:bg-secondary/90 disabled:bg-muted text-secondary-foreground rounded-xl font-semibold text-lg shadow-lg transition-all flex items-center justify-center"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Confirm Phone */}
        {step === 'phone' && (
          <div className="space-y-6">
            <div className="glass-effect rounded-2xl p-6 shadow-lg space-y-4 custom-shadow">
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Confirm your M-Pesa number to receive funds.
                </p>
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

              <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                <p className="text-sm text-primary">
                  <strong>{kesAmount.toLocaleString()} KES</strong> will be sent to this number.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  <p>{error}</p>
                </div>
              )}
            </div>

            <button
              onClick={handlePhoneConfirm}
              disabled={isLoading || !mpesaPhone}
              className="w-full h-14 bg-secondary hover:bg-secondary/90 disabled:bg-muted text-secondary-foreground rounded-xl font-semibold text-lg shadow-lg transition-all flex items-center justify-center"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin"/> : 'Confirm Withdrawal'}
            </button>
          </div>
        )}

        {/* Step 3: Verification Code */}
        {step === 'verify' && (
          <div className="space-y-6">
            <div className="glass-effect rounded-2xl p-6 shadow-lg space-y-4 custom-shadow">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-3xl">📧</span>
                </div>
                <h3 className="font-semibold text-foreground">Check Your Email</h3>
                <p className="text-sm text-muted-foreground">
                  Deriv has sent a verification code to your email.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Enter Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => {
                    setVerificationCode(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter code"
                  maxLength={48}
                  className="w-full h-14 px-4 bg-input border-border rounded-xl text-foreground text-center text-xl font-mono tracking-widest focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  <p>{error}</p>
                </div>
              )}
            </div>

            <button
              onClick={handleVerifyAndWithdraw}
              disabled={isLoading || verificationCode.length < 6}
              className="w-full h-14 bg-success hover:bg-success/90 disabled:bg-muted text-success-foreground rounded-xl font-semibold text-lg shadow-lg transition-all flex items-center justify-center"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin"/> : 'Verify & Withdraw'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
