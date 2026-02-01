'use client';

import { AppLayout } from '@/components/app-layout';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLinked, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isLinked) {
      router.replace('/login');
    }
  }, [isLoading, isLinked, router]);

  if (isLoading || !isLinked) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500"/>
        <p className="sr-only">Loading session...</p>
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}
