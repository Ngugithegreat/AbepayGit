'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link as LinkIcon, Unlink, Loader2, CheckCircle } from 'lucide-react';

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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const accountSchema = z.object({
  apiToken: z.string().min(1, { message: 'API Token is required.' }),
});

export default function AccountCard() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [linkedAccountId, setLinkedAccountId] = useState('');
  const [linkedAccountName, setLinkedAccountName] = useState('');
  const [linkedAccountBalance, setLinkedAccountBalance] = useState(0);

  const form = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      apiToken: '',
    },
  });

  async function onSubmit(values: z.infer<typeof accountSchema>) {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/link-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiToken: values.apiToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link account.');
      }

      setIsLinked(data.isLinked);
      setLinkedAccountId(data.linkedAccountId);
      setLinkedAccountName(data.linkedAccountName);
      setLinkedAccountBalance(data.linkedAccountBalance);

      toast({
        title: 'Account Linked',
        description: 'Your Deriv account has been successfully linked.',
        variant: 'default',
        className: 'bg-accent text-accent-foreground border-accent',
      });
      form.reset();
    } catch (error: any) {
      toast({
        title: 'Linking Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }

  function handleUnlink() {
    setIsProcessing(true);
    setTimeout(() => {
        setIsLinked(false);
        setLinkedAccountId('');
        setLinkedAccountName('');
        setLinkedAccountBalance(0);
        toast({
            title: 'Account Unlinked',
            description: 'Your Deriv account has been unlinked.',
        });
        setIsProcessing(false);
    }, 1000)
  }

  if (isLinked) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Account Linked</CardTitle>
                <CardDescription>Your Deriv account is connected and ready for transactions.</CardDescription>
            </CardHeader>
            <CardContent>
                <Alert variant="default" className="border-accent bg-accent/10">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    <AlertTitle className="text-accent">Connection Active</AlertTitle>
                    <AlertDescription className="flex flex-col gap-1 mt-2">
                        <span>Welcome, <span className="font-semibold">{linkedAccountName}</span></span>
                        <span>Account ID: <span className="font-semibold">{linkedAccountId}</span></span>
                        <span>Balance: <span className="font-semibold">${linkedAccountBalance.toFixed(2)}</span></span>
                    </AlertDescription>
                </Alert>
            </CardContent>
            <CardFooter>
                 <Button variant="destructive" onClick={handleUnlink} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Unlink className="mr-2 h-4 w-4" />}
                    Unlink Account
                 </Button>
            </CardFooter>
        </Card>
    )
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Link Deriv Account</CardTitle>
            <CardDescription>
              Enter your Deriv API token to connect your account. You can create a token in your Deriv account settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="apiToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Token</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••••••••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Linking...
                </>
              ) : (
                <>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Link Account
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
