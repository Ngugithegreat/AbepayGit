'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import Chatbot from '@/components/chatbot/chatbot';
import { Loader2 } from 'lucide-react';

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
  const { logout, isLinked, isLoading } = useAuth();
  const router = useRouter();
  
  // This effect protects all routes that use this layout.
  useEffect(() => {
    // If the authentication state is not loading and the user is not linked (logged in),
    // redirect them to the login page.
    if (!isLoading && !isLinked) {
      router.replace('/login');
    }
  }, [isLoading, isLinked, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // While the auth state is loading, or if the user is not linked,
  // show a loading screen. This prevents a flicker of page content
  // before the redirect in the useEffect above can happen.
  if (isLoading || !isLinked) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500"/>
      </div>
    );
  }

  // If the user is authenticated, render the main application layout.
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex-shrink-0 flex items-center">
                <span className="text-blue-500 text-xl font-bold">DerivPay</span>
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
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="ml-4 flex items-center">
                <button
                  onClick={handleLogout}
                  className="bg-slate-700 p-1.5 rounded-full text-gray-300 hover:bg-slate-600 focus:outline-none"
                  aria-label="Logout"
                >
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              </div>
              <div className="ml-4 md:hidden">
                <button
                  id="mobileMenuButton"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="bg-slate-700 p-1.5 rounded-full text-gray-300 hover:bg-slate-600 focus:outline-none"
                  aria-label="Open menu"
                >
                  <i className="fas fa-bars"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div id="mobileMenu" className="md:hidden border-t border-slate-700">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left ${
                    pathname === link.href
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-slate-700 hover:text-white'
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
      <Chatbot />
    </div>
  );
}
