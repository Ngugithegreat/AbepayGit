'use client';

import { AppLayout } from '@/components/app-layout';
import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLinked, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If loading is finished and the user is not linked, redirect to login.
    if (!isLoading && !isLinked) {
      router.replace('/login');
    }
  }, [isLoading, isLinked, router, pathname]);

  // While the auth state is loading, or if the user is not linked yet,
  // show a full-screen loader. This prevents any content from flashing.
  if (isLoading || !isLinked) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500"/>
        <p className="sr-only">Loading session...</p>
      </div>
    );
  }

  // If loading is complete AND the user is linked, render the AppLayout with the page content.
  return <AppLayout>{children}</AppLayout>;
}
