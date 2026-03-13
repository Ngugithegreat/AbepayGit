
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
    // Just read from localStorage - NO API CALLS
    const userInfo = localStorage.getItem('user_info');
    const loginid = localStorage.getItem('deriv_loginid');

    if (userInfo && loginid) {
      setUser(JSON.parse(userInfo));
    }

    setIsLoading(false);
  }, []);

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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
