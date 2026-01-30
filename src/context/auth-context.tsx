'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { DerivUser, DerivAccount } from '@/lib/types';

interface AuthContextType {
  isLinked: boolean;
  user: DerivUser | null;
  selectedAccount: DerivAccount | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  updateBalance: (newBalance: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<DerivUser | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<DerivAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const verifyToken = useCallback(async (authToken: string) => {
    setIsLoading(true);
    // In a real app, you would connect to the Deriv WebSocket API here
    // and send an 'authorize' request with the token.
    console.log("Verifying token:", authToken);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock response for a successful authorization
    const mockUser: DerivUser = {
      fullname: 'Real User',
      email: 'real.user@example.com',
      loginid: 'CR1234567',
      account_list: [
        { loginid: 'CR1234567', is_virtual: 0, currency: 'USD', balance: 2500.50 },
        { loginid: 'VRTC987654', is_virtual: 1, currency: 'USD', balance: 10000.00 },
      ],
      balance: 2500.50, // from the first real account
      currency: 'USD',
    };

    // For this prototype, we'll assume the token is valid and set a mock user.
    // We'll select the first real money account.
    const realAccount = mockUser.account_list.find(acc => acc.is_virtual === 0);
    
    if (realAccount) {
      setUser(mockUser);
      setSelectedAccount(realAccount);
      setToken(authToken);
      localStorage.setItem('deriv_token', authToken);
    } else {
      // Handle case where no real account is found
      console.error("No real Deriv account found.");
      logout();
    }
    
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('deriv_token');
    setToken(null);
    setUser(null);
    setSelectedAccount(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('deriv_token');
    if (storedToken) {
      verifyToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, [verifyToken]);
  
  const login = useCallback((authToken: string) => {
    verifyToken(authToken);
  }, [verifyToken]);

  const updateBalance = (newBalance: number) => {
    if (selectedAccount) {
        setSelectedAccount(prev => prev ? { ...prev, balance: newBalance } : null);
        setUser(prev => prev ? { ...prev, balance: newBalance } : null);
    }
  }

  const value = {
    isLinked: !!token,
    user,
    selectedAccount,
    isLoading,
    login,
    logout,
    updateBalance,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
