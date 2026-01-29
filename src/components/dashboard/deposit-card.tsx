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

const depositSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Please enter a valid amount.' }).min(10, { message: 'Minimum deposit is $10.' }),
});

export default function DepositCard() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [balance, setBalance] = useState(1250.75); // Mock balance
  const [showStkPush, setShowStkPush] = useState(false);

  const form = useForm<z.infer<typeof depositSchema>>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: undefined,
    },
  });

  function onSubmit(values: z.infer<typeof depositSchema>) {
    setIsProcessing(true);
    setShowStkPush(true);
    // Simulate STK push and transaction processing
    setTimeout(() => {
      const isSuccess = Math.random() > 0.1; // 90% success rate

      if (isSuccess) {
        setBalance((prev) => prev + values.amount);
        toast({
          title: 'Deposit Successful',
          description: `Successfully deposited $${values.amount.toFixed(2)}. Your new balance is $${(balance + values.amount).toFixed(2)}.`,
          variant: 'default',
          className: 'bg-accent text-accent-foreground border-accent',
        });
        form.reset();
      } else {
        toast({
          title: 'Deposit Failed',
          description: 'The MPESA transaction was not completed. Please try again.',
          variant: 'destructive',
        });
      }
      setIsProcessing(false);
      setShowStkPush(false);
    }, 4000);
  }

  return (
    <Card className="max-w-xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Make a Deposit</CardTitle>
            <CardDescription>
              Your current account balance is{' '}
              <span className="font-semibold text-primary">${balance.toFixed(2)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            {showStkPush && (
                <Alert>
                    <Loader2 className="h-4 w-4 animate-spin"/>
                    <AlertTitle>Confirm on your phone</AlertTitle>
                    <AlertDescription>
                        A push notification has been sent to your phone. Please enter your M-PESA PIN to complete the deposit.
                    </AlertDescription>
                </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isProcessing} className="w-full sm:w-auto">
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
