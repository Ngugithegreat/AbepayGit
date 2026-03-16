'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function WelcomeBackPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        const fullName = user.name || '';
        const nameParts = fullName.split(' ');
        
        // List of common salutations to filter out
        const salutations = ['Mr', 'Mrs', 'Ms', 'Dr', 'Mr.', 'Mrs.', 'Ms.', 'Dr.'];
        let parsedFirstName = nameParts[0];

        // If the first part is a salutation and there's another part, use the next part
        if (salutations.includes(parsedFirstName) && nameParts.length > 1) {
            parsedFirstName = nameParts[1];
        }
        
        setFirstName(parsedFirstName);
      } catch (e) {
        console.error("Failed to parse user info", e);
        router.push('/login');
      }
    } else {
      // No user info, go to login
      router.push('/login');
    }
    setIsLoading(false);
  }, [router]);

  const handleLogin = () => {
    // Just redirect to login page where email is already filled
    router.push('/login');
  };

  if (isLoading || !firstName) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-16 h-16 animate-spin text-primary"/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 slide-in">
      <div className="w-full max-w-md text-center space-y-8">
        
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-3xl bg-primary/10 backdrop-blur-sm flex items-center justify-center shadow-2xl">
            <span className="text-6xl font-black text-primary">A</span>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Welcome Back, {firstName}!</h1>
          <p className="text-muted-foreground">Ready to continue your session?</p>
        </div>

        <Button
          onClick={handleLogin}
          size="lg"
          className="w-full h-14 text-lg"
        >
          Login to Your Account
        </Button>
      </div>
    </div>
  );
}
