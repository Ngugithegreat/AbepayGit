'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  loginid: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true

  useEffect(() => {
    // This effect runs ONLY ONCE on initial client-side mount.
    const checkAuth = () => {
      console.log('--- AuthProvider Mount ---');
      try {
        const loginid = localStorage.getItem('deriv_loginid');
        const hasPassword = localStorage.getItem('user_has_password');
        const userInfoStr = localStorage.getItem('user_info');

        console.log('[AuthProvider] Checking localStorage:');
        console.log(`[AuthProvider] deriv_loginid: ${loginid}`);
        console.log(`[AuthProvider] user_has_password: ${hasPassword}`);

        if (loginid && hasPassword === 'true' && userInfoStr) {
          const userInfo = JSON.parse(userInfoStr);
          setUser(userInfo);
          console.log('[AuthProvider] ✅ User is authenticated. State set.');
        } else {
          setUser(null);
          console.log('[AuthProvider] ❌ User is not authenticated.');
        }
      } catch (error) {
        console.error('[AuthProvider] Error checking auth:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
        console.log('[AuthProvider] Auth check complete. isLoading: false.');
        console.log('--------------------------');
      }
    };

    checkAuth();
  }, []); // The empty dependency array is CRITICAL. It ensures this runs only once.

  const logout = () => {
    console.log('[AuthProvider] Logging out user.');
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    // Use window.location to ensure a full page refresh and state reset.
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
