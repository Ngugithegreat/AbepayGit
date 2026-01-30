'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowUpCircle, Loader2 } from 'lucide-react';

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

const withdrawSchema = z.object({
  mpesaNumber: z.string().regex(/^(?:254|\+254|0)?(7(?:(?:[0-9][0-9]))[0-9]{6})$/, 'Please enter a valid Kenyan M-PESA number.'),
  amount: z.coerce.number().positive({ message: 'Please enter a valid amount.' }).min(1, { message: 'Minimum withdrawal is $1.' }),
});

export default function WithdrawCard() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [balance, setBalance] = useState(1250.75); // Mock balance, should be shared state

  const form = useForm<z.infer<typeof withdrawSchema>>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      mpesaNumber: '',
      amount: undefined,
    },
  });

  function onSubmit(values: z.infer<typeof withdrawSchema>) {
    if (values.amount > balance) {
        form.setError('amount', { message: 'Withdrawal amount cannot exceed your balance.' });
        return;
    }
    setIsProcessing(true);
    // Simulate withdrawal processing
    setTimeout(() => {
      setBalance((prev) => prev - values.amount);
      toast({
        title: 'Withdrawal Initiated',
        description: `Your withdrawal of $${values.amount.toFixed(2)} to ${values.mpesaNumber} is being processed.`,
        variant: 'default',
        className: 'bg-accent text-accent-foreground border-accent',
      });
      form.reset();
      setIsProcessing(false);
    }, 3000);
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Make a Withdrawal</CardTitle>
            <CardDescription>
              Funds will be sent to your M-PESA account.
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
                    <Input type="tel" placeholder="254712345678" {...field} />
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
             <div className="text-sm text-muted-foreground">Current Rate: <span className="font-semibold text-foreground">1 USD = 128 KES</span> (example rate)</div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isProcessing} className="w-full sm:w-auto">
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowUpCircle className="mr-2 h-4 w-4" />
                  Initiate Withdrawal
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
