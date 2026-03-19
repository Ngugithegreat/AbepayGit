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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only check auth once on mount
    const checkAuth = () => {
      try {
        const loginid = localStorage.getItem('deriv_loginid');
        const userInfo = localStorage.getItem('user_info');

        if (loginid && userInfo) {
          setUser(JSON.parse(userInfo));
          console.log('✅ Auth: User logged in:', loginid);
        } else {
          console.log('ℹ️ Auth: No user found');
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []); // Only run ONCE on mount

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
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
