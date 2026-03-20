'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/deposit', label: 'Deposit' },
  { href: '/withdraw', label: 'Withdraw' },
  { href: '/history', label: 'History' },
  { href: '/profile', label: 'Profile' },
  { href: '/settings', label: 'Settings' },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isLinked, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isLinked) {
      router.push('/login');
    }
  }, [isLoading, isLinked, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isLinked) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex-shrink-0 flex items-center">
                <span className="text-primary text-xl font-bold">Abepay</span>
              </Link>
            </div>
            <div className="flex items-center">
              <div className="hidden md:block">
                <div className="flex items-center space-x-1">
                  {navLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        pathname === link.href
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="ml-4 flex items-center">
                <button
                  onClick={logout}
                  className="bg-secondary p-1.5 rounded-full text-secondary-foreground hover:bg-secondary/80 focus:outline-none"
                  aria-label="Logout"
                >
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              </div>
              <div className="ml-4 md:hidden">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="bg-secondary p-1.5 rounded-full text-secondary-foreground hover:bg-secondary/80 focus:outline-none"
                  aria-label="Open menu"
                >
                  <i className="fas fa-bars"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left ${
                    pathname === link.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
