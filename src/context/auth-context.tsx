
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
    // Read from localStorage to initialize state
    const userInfoString = localStorage.getItem('user_info');
    
    if (userInfoString) {
      try {
        const userInfo = JSON.parse(userInfoString);
        if (userInfo && userInfo.loginid) {
          setUser(userInfo);
        }
      } catch (e) {
        console.error("Failed to parse user info from localStorage", e);
        // Clear corrupted data
        localStorage.removeItem('user_info');
      }
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

    