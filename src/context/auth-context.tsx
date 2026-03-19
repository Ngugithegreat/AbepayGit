
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  loginid: string;
  email: string;
  name: string;
  fullname: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const userInfoString = localStorage.getItem('user_info');
    const hasPassword = localStorage.getItem('user_has_password');
    
    if (userInfoString && hasPassword === 'true') {
      try {
        const userInfo = JSON.parse(userInfoString);
        if (userInfo && userInfo.loginid) {
          setUser(userInfo);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (e) {
        console.error("Failed to parse user info from localStorage", e);
        localStorage.clear();
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }

    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
    // Redirect to login page to ensure clean state
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, logout }}>
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
