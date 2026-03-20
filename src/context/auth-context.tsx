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
  isLinked: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const userInfoString = localStorage.getItem('user_info');
      const hasPassword = localStorage.getItem('user_has_password');

      if (userInfoString && hasPassword === 'true') {
        const userInfo = JSON.parse(userInfoString);
        if (userInfo && userInfo.loginid) {
          setUser(userInfo);
        }
      }
    } catch (e) {
      localStorage.removeItem('user_info');
      localStorage.removeItem('user_has_password');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isLinked: !!user, logout }}>
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
