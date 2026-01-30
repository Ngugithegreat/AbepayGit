'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const { isLinked, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isLinked) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isLoading, isLinked, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-900">
      <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
    </div>
  );
}
