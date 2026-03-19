
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Function to extract first name, removing titles
const getFirstName = (fullName: string): string => {
  if (!fullName) return '';
  
  // Remove titles like Mr, Ms, Mrs, Dr, Prof
  const name = fullName
    .replace(/^(Mr\.?|Ms\.?|Mrs\.?|Dr\.?|Prof\.?)\s+/i, '')
    .trim();
  
  // Get the first word
  const firstName = name.split(' ')[0];
  
  return firstName || '';
};

export default function WelcomeBackPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userInfoString = localStorage.getItem('user_info');
    if (userInfoString) {
      try {
        const user = JSON.parse(userInfoString);
        // Use the new function to get the first name
        const extractedFirstName = getFirstName(user.name);
        setFirstName(extractedFirstName);
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
          {/* Using the cleaned first name here */}
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
