
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  loginid: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, accounts: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only check auth on mount
    const checkAuth = () => {
      try {
        const loginid = localStorage.getItem('deriv_loginid');
        const userInfo = localStorage.getItem('user_info');

        if (loginid && userInfo) {
          setUser(JSON.parse(userInfo));
          console.log('✅ Session restored:', loginid);
        } else {
          console.log('ℹ️ No existing session');
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (token: string, accounts: string) => {
    try {
      console.log('🔐 Logging in...');

      // Store token immediately
      localStorage.setItem('deriv_token1', token);
      localStorage.setItem('deriv_accounts', accounts);

      // Get user info
      const response = await fetch('/api/deriv/get-user-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        const userInfo = {
          loginid: data.user.loginid,
          email: data.user.email,
          name: data.user.fullname,
        };

        // Store user info
        localStorage.setItem('deriv_loginid', data.user.loginid);
        localStorage.setItem('user_info', JSON.stringify(userInfo));

        setUser(userInfo);

        console.log('✅ Login complete:', data.user.loginid);
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('👋 Logging out...');
    
    localStorage.removeItem('deriv_token1');
    localStorage.removeItem('deriv_accounts');
    localStorage.removeItem('deriv_loginid');
    localStorage.removeItem('user_info');
    
    // Clear session storage too
    sessionStorage.removeItem('auth_processed_at');
    
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
