'use client';

import { useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '../ui/skeleton';

export default function AccountCard() {
  const { toast } = useToast();
  const { isLinked, user, isLoading, logout, selectedAccount } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID;

    if (!appId) {
        setAuthError("Deriv App ID is not configured. Please contact support.");
        return;
    }

    if (typeof window !== 'undefined') {
      const redirectUri = `${window.location.protocol}//${window.location.host}/auth/callback`;
      setAuthUrl(`https://oauth.deriv.com/oauth2/authorize?app_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read+payments+trade`);
    }
  }, []);

  function handleUnlink() {
    setIsLoggingOut(true);
    setTimeout(() => {
        logout();
        toast({
            title: 'Account Unlinked',
            description: 'Your Deriv account has been unlinked.',
        });
        setIsLoggingOut(false);
    }, 1000)
  }
  
  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-full max-w-sm" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-24 w-full" />
            </CardContent>
            <CardFooter>
                 <Skeleton className="h-10 w-36" />
            </CardFooter>
        </Card>
    )
  }

  if (isLinked && user && selectedAccount) {
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
                        <span>Welcome, <span className="font-semibold">{user.fullname}</span></span>
                        <span>Account ID: <span className="font-semibold">{selectedAccount.loginid}</span></span>
                        <span>Balance: <span className="font-semibold">{selectedAccount.currency} {selectedAccount.balance.toFixed(2)}</span></span>
                    </AlertDescription>
                </Alert>
            </CardContent>
            <CardFooter>
                 <Button variant="destructive" onClick={handleUnlink} disabled={isLoggingOut}>
                    {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Unlink className="mr-2 h-4 w-4" />}
                    Unlink Account
                 </Button>
            </CardFooter>
        </Card>
    )
  }

  return (
    <Card>
        <CardHeader>
        <CardTitle>Link Deriv Account</CardTitle>
        <CardDescription>
            To use DerivPay, you need to connect your Deriv account. You will be redirected to Deriv to securely log in and authorize our application.
        </CardDescription>
        </CardHeader>
        <CardContent>
            {authError ? (
                 <Alert variant="destructive">
                    <AlertTitle>Configuration Error</AlertTitle>
                    <AlertDescription>
                        {authError}
                    </AlertDescription>
                </Alert>
            ) : (
                <p className='text-sm text-muted-foreground'>
                    We will request permissions to view your account activity and perform payments on your behalf. We do not store your login credentials.
                </p>
            )}
        </CardContent>
        <CardFooter>
        <Button asChild disabled={!authUrl || !!authError}>
            <a href={authUrl}>
                <LinkIcon className="mr-2 h-4 w-4" />
                Login & Link with Deriv
            </a>
        </Button>
        </CardFooter>
    </Card>
  );
}
