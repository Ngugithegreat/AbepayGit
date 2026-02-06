'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowDownCircle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '../ui/skeleton';

const depositSchema = z.object({
  mpesaNumber: z.string().regex(/^(?:254|\+254|0)?(7(?:(?:[0-9][0-9]))[0-9]{6})$/, 'Please enter a valid Kenyan M-PESA number.'),
  amount: z.coerce.number().positive({ message: 'Please enter a valid amount.' }).min(1, { message: 'Minimum deposit is $1.' }).max(5000, { message: 'Maximum deposit is $5000.' }),
});

export default function DepositCard() {
  const { toast } = useToast();
  const { isLinked, selectedAccount, isLoading, updateBalance } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStkPush, setShowStkPush] = useState(false);

  const form = useForm<z.infer<typeof depositSchema>>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: undefined,
      mpesaNumber: '',
    },
  });

  function onSubmit(values: z.infer<typeof depositSchema>) {
    if (!selectedAccount) return;
    setIsProcessing(true);
    setShowStkPush(true);
    // Simulate STK push and transaction processing
    setTimeout(() => {
      const isSuccess = Math.random() > 0.1; // 90% success rate
      const newBalance = (selectedAccount.balance || 0) + values.amount;

      if (isSuccess) {
        updateBalance(newBalance);
        toast({
          title: 'Deposit Successful',
          description: `Successfully deposited $${values.amount.toFixed(2)}. Your new balance is $${newBalance.toFixed(2)}.`,
          variant: 'default',
          className: 'bg-accent text-accent-foreground border-accent',
        });
        form.reset();
      } else {
        toast({
          title: 'Deposit Failed',
          description: 'The M-PESA transaction was not completed. Please try again.',
          variant: 'destructive',
        });
      }
      setIsProcessing(false);
      setShowStkPush(false);
    }, 4000);
  }

  if (!isLinked) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Make a Deposit</CardTitle>
            </CardHeader>
            <CardContent>
                <Alert>
                    <AlertTitle>Account Not Linked</AlertTitle>
                    <AlertDescription>
                        Please link your Deriv account in the settings page to make a deposit.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Make a Deposit</CardTitle>
            <CardDescription>
              {isLoading || !selectedAccount ? <Skeleton className="h-5 w-64" /> : 
              <>
                Your current account balance is{' '}
                <span className="font-semibold text-primary">{selectedAccount.currency || 'USD'} {(selectedAccount.balance || 0).toFixed(2)}</span>
              </>
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="mpesaNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>M-PESA Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="e.g. 254712345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (USD)</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-muted-foreground sm:text-sm">$</span>
                        </div>
                        <Input type="number" placeholder="0.00" {...field} className="pl-7" step="0.01" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="text-sm text-muted-foreground">Current Rate: <span className="font-semibold text-foreground">1 USD = 130 KES</span> (example rate)</div>
            {showStkPush && (
                <Alert>
                    <Loader2 className="h-4 w-4 animate-spin"/>
                    <AlertTitle>Confirm on your phone</AlertTitle>
                    <AlertDescription>
                        A push notification has been sent to your M-PESA number. Please enter your M-PESA PIN to complete the deposit.
                    </AlertDescription>
                </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isProcessing || isLoading} className="w-full sm:w-auto">
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Awaiting Confirmation...
                </>
              ) : (
                <>
                  <ArrowDownCircle className="mr-2 h-4 w-4" />
                  Initiate Deposit
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
