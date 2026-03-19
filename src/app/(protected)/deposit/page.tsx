
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ArrowDownLeft, Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/auth-context';

// Schema without the dynamic amount validation, which will be handled manually
const formSchema = z.object({
  phone: z.string().min(9, 'Please enter a valid phone number.').max(10, 'Please enter a valid phone number.'),
  amount: z.coerce.number({invalid_type_error: "Please enter a valid amount."}).positive(),
});


export default function DepositPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [usdAmount, setUsdAmount] = useState('0.00');
  const [exchangeRate, setExchangeRate] = useState(130); // Default rate
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [userAccount, setUserAccount] = useState<string | null>(null);

  const MIN_USD = 1.00;
  const MAX_USD = 2000.00;
  
  // Recalculate KES values based on the current exchange rate
  const minKes = MIN_USD * exchangeRate;
  const maxKes = MAX_USD * exchangeRate;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: '',
      amount: undefined,
    },
  });

  const { formState: { errors, isSubmitting }, watch, setError } = form;
  const watchedAmount = watch('amount');

  useEffect(() => {
    // Auth check disabled for testing. Use a dummy account.
    if (user?.loginid) {
      setUserAccount(user.loginid);
    } else {
      const testAccount = 'CR9999999'; // Dummy for testing
      console.log(`Auth check disabled: using test account ${testAccount}`);
      setUserAccount(testAccount);
    }
  }, [user]);
  
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

  useEffect(() => {
    const kes = watchedAmount || 0;
    const usd = kes / exchangeRate;
    setUsdAmount(usd.toFixed(2));
  }, [watchedAmount, exchangeRate]);

  const handleDeposit = async (values: z.infer<typeof formSchema>) => {
    // Manual validation for min/max deposit against the dynamic rate
    if (values.amount < minKes) {
      setError('amount', {
        type: 'manual',
        message: `Minimum deposit is ${minKes.toLocaleString()} KES ($${MIN_USD.toFixed(2)} USD)`
      });
      return;
    }
     if (values.amount > maxKes) {
      setError('amount', {
        type: 'manual',
        message: `Maximum deposit is ${maxKes.toLocaleString()} KES ($${MAX_USD.toLocaleString()} USD)`
      });
      return;
    }

    if (!userAccount) {
        toast({
            title: "Error",
            description: "No Deriv account linked.",
            variant: "destructive"
        });
        return;
    }

    try {
        const response = await fetch('/api/mpesa/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: values.phone,
                amount: values.amount,
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            setModalMessage(`STK push sent! Check your phone (${values.phone}) and enter your M-Pesa PIN to complete the transaction.`);
            setShowModal(true);
            form.reset();
        } else {
            form.setError('root', { type: 'manual', message: data.error || "Could not initiate M-Pesa payment. Please try again." });
        }
    } catch (error) {
        console.error("Deposit error:", error);
        form.setError('root', { type: 'manual', message: "An unexpected network error occurred. Please try again." });
    }
  }

  return (
    <div className="slide-in">
      <div className="mb-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success to-success/90 flex items-center justify-center shadow-lg">
              <ArrowDownLeft className="w-6 h-6 text-success-foreground" strokeWidth={2.5} />
          </div>
          <div>
              <h1 className="text-2xl font-bold text-foreground">Deposit</h1>
              <p className="text-muted-foreground">Add funds via M-Pesa</p>
          </div>
      </div>
      {userAccount && (
        <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20 mb-6">
          <p className="text-sm text-primary">
            Depositing to: <strong>{userAccount}</strong>
          </p>
        </div>
      )}
      <div className="space-y-6">
        <div className="glass-effect rounded-xl p-6 custom-shadow">
          <form onSubmit={form.handleSubmit(handleDeposit)} className="space-y-6">
            <div>
              <label htmlFor="depositPhone" className="block text-sm font-medium text-muted-foreground mb-1">M-Pesa Phone Number</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 bg-muted border border-r-0 border-border rounded-l-md text-muted-foreground">
                  +254
                </span>
                <input type="tel" id="depositPhone" {...form.register('phone')} placeholder="7XXXXXXXX" className="flex-1 p-3 bg-input border border-border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground" />
              </div>
              {errors.phone && <p className="text-destructive text-sm mt-2">{errors.phone.message}</p>}
            </div>
            <div>
              <label htmlFor="depositAmount" className="block text-sm font-medium text-muted-foreground mb-1">Amount (KES)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-muted-foreground sm:text-sm">KES</span>
                </div>
                <input type="number" id="depositAmount" {...form.register('amount')} placeholder={`Minimum ${minKes.toLocaleString()}`} className="pl-12 w-full p-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground" />
              </div>
              {errors.amount && <p className="text-destructive text-sm mt-2">{errors.amount.message}</p>}
              
              <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Min: {minKes.toLocaleString()} KES</span>
                  <span className="text-muted-foreground">Rate: 1 USD = {exchangeRate} KES</span>
              </div>

              {parseFloat(usdAmount) > 0 && !errors.amount && (
                <div className="mt-3 p-3 bg-success/10 rounded-lg border border-success/30">
                  <p className="text-sm text-success">
                    You will receive: <strong className="text-xl">${usdAmount} USD</strong>
                  </p>
                </div>
              )}
            </div>

            {errors.root && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                  {errors.root.message}
              </div>
            )}

            <div>
              <button type="submit" disabled={isSubmitting || !userAccount} className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Deposit Now'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="glass-effect rounded-xl p-6 custom-shadow">
          <h3 className="font-medium text-foreground mb-4">How It Works</h3>
          <ul className="space-y-4 text-sm text-muted-foreground">
          <li className="flex items-start">
              <span className="bg-muted text-primary rounded-full h-6 w-6 flex-shrink-0 flex items-center justify-center mr-3 font-bold">1</span>
              <span>Enter your M-Pesa number and amount in KES.</span>
          </li>
          <li className="flex items-start">
              <span className="bg-muted text-primary rounded-full h-6 w-6 flex-shrink-0 flex items-center justify-center mr-3 font-bold">2</span>
              <span>Click 'Deposit Now' to receive an STK push.</span>
          </li>
          <li className="flex items-start">
              <span className="bg-muted text-primary rounded-full h-6 w-6 flex-shrink-0 flex items-center justify-center mr-3 font-bold">3</span>
              <span>Enter your M-Pesa PIN on your phone to confirm.</span>
          </li>
          <li className="flex items-start">
              <span className="bg-muted text-primary rounded-full h-6 w-6 flex-shrink-0 flex items-center justify-center mr-3 font-bold">4</span>
              <span>Funds are credited to your Deriv account instantly!</span>
          </li>
          </ul>
      </div>

    </div>
    {showModal && (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6 animate-fade-in">
        <div className="glass-effect rounded-2xl p-8 max-w-sm w-full space-y-6 animate-scale-in custom-shadow">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-success/10 border-2 border-success flex items-center justify-center mb-4">
              <Check className="w-10 h-10 text-success" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Action Required
            </h3>
            <p className="text-muted-foreground">
              {modalMessage}
            </p>
          </div>
          
          <button
            onClick={() => {
              setShowModal(false);
              router.push('/dashboard');
            }}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition duration-200"
          >
            Okay
          </button>
        </div>
      </div>
    )}
  </div>
  );
}
