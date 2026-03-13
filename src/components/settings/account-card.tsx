'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function AccountSettings() {
  const { toast } = useToast();
  const { user, selectedAccount, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  function handleUnlink() {
    setIsLoggingOut(true);
    setTimeout(() => {
        logout();
        toast({
            title: 'Account Unlinked',
            description: 'Your Deriv account has been unlinked.',
        });
        setIsLoggingOut(false);
        router.push('/');
    }, 1000)
  }

  return (
    <>
    <div className="glass-effect rounded-xl p-6 custom-shadow mb-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Connected Deriv Account</h2>
        {selectedAccount ? (
            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                    <div className="flex items-center">
                        <i className="fas fa-wallet text-primary text-xl mr-4"></i>
                        <div>
                            <p className="text-sm font-medium text-foreground">{user?.fullname}</p>
                            <p className="text-xs text-muted-foreground">{selectedAccount.loginid}</p>
                        </div>
                    </div>
                    <div className="text-right">
                         <p className="text-sm font-bold text-foreground">{selectedAccount.currency || 'USD'} {(selectedAccount.balance || 0).toFixed(2)}</p>
                         <p className="text-xs text-muted-foreground">Current Balance</p>
                    </div>
                </div>
                 <button onClick={handleUnlink} disabled={isLoggingOut} className="w-full px-3 py-2 bg-destructive/20 hover:bg-destructive/30 text-destructive text-sm font-medium rounded-lg transition duration-200 flex items-center justify-center">
                    {isLoggingOut ? <span className="loader h-4 w-4 border-2 rounded-full"></span> : <><i className="fas fa-unlink mr-2"></i> Unlink Account</>}
                </button>
            </div>
        ) : (
            <p className="text-muted-foreground">No account linked.</p>
        )}
    </div>

    <div className="glass-effect rounded-xl p-6 custom-shadow">
        <h3 className="font-medium text-foreground mb-4">Active Sessions</h3>
        <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
            <p className="text-sm font-medium text-foreground">Current Session</p>
            <p className="text-xs text-muted-foreground">Safari on macOS • Nairobi, Kenya</p>
            </div>
            <div className="px-2 py-0.5 text-xs rounded-full bg-success/10 text-success">Active</div>
        </div>
        <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
            <p className="text-sm font-medium text-foreground">Chrome</p>
            <p className="text-xs text-muted-foreground">Windows • Mombasa, Kenya • 2 days ago</p>
            </div>
            <button className="text-xs text-destructive hover:text-destructive/80">Logout</button>
        </div>
        </div>
        <div className="mt-4">
        <button className="w-full px-3 py-1.5 bg-destructive/20 hover:bg-destructive/30 text-destructive text-sm font-medium rounded-lg transition duration-200">
            Logout from all devices
        </button>
        </div>
    </div>
    </>
  );
}
