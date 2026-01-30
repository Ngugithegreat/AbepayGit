'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { DerivUser, DerivAccount } from '@/lib/types';

// A simplified WebSocket wrapper to mimic DerivAPIBasic
class DerivAPI {
  private ws: WebSocket | null = null;
  private app_id: number;
  private message_callbacks: Map<number, (response: any) => void> = new Map();
  private request_id: number = 1;
  private connection_promise: Promise<void> | null = null;

  constructor({ app_id }: { app_id: number }) {
    this.app_id = app_id;
    this.connect();
  }

  private connect() {
    this.connection_promise = new Promise((resolve, reject) => {
        this.ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${this.app_id}`);

        this.ws.onopen = () => {
            resolve();
        };

        this.ws.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            if (data.req_id && this.message_callbacks.has(data.req_id)) {
              const callback = this.message_callbacks.get(data.req_id);
              callback?.(data);
              this.message_callbacks.delete(data.req_id);
            }
          } catch(e) {
            console.error("Failed to parse WebSocket message:", e)
          }
        };

        this.ws.onclose = () => {
          console.log('Deriv WebSocket disconnected');
        };

        this.ws.onerror = (err) => {
          console.error('Deriv WebSocket error:', err);
          reject(err);
        };
    })
  }

  private async sendRequest(request: object): Promise<any> {
    await this.connection_promise;
    
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        throw new Error("WebSocket is not connected.");
    }
      
    return new Promise((resolve) => {
      const req_id = this.request_id++;
      this.message_callbacks.set(req_id, resolve);
      this.ws!.send(JSON.stringify({ ...request, req_id }));
    });
  }

  async authorize(token: string) {
    return this.sendRequest({ authorize: token });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}


interface AuthContextType {
  isLinked: boolean;
  user: DerivUser | null;
  selectedAccount: DerivAccount | null;
  isLoading: boolean;
  login: (token: string) => Promise<boolean>;
  logout: () => void;
  updateBalance: (newBalance: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<DerivUser | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<DerivAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [api, setApi] = useState<DerivAPI | null>(null);

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID;
    if (!appId) {
        console.error("Deriv App ID is not configured.");
        setIsLoading(false);
        return;
    }
    
    const derivApi = new DerivAPI({ app_id: Number(appId) });
    setApi(derivApi);

    return () => {
      derivApi.disconnect();
    };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('deriv_token');
    setToken(null);
    setUser(null);
    setSelectedAccount(null);
    setIsLoading(false);
  }, []);

  const verifyToken = useCallback(async (authToken: string): Promise<boolean> => {
    if (!api) {
        setIsLoading(false);
        return false;
    }
    setIsLoading(true);
    
    try {
        const authorizeResponse = await api.authorize(authToken);
        const { authorize, error } = authorizeResponse;

        if (error) {
            console.error("Deriv API authorization failed:", error.message);
            logout();
            return false;
        }

        const fullUser = authorize as DerivUser;
        const realAccount = fullUser.account_list.find((acc: DerivAccount) => acc.is_virtual === 0);

        if (realAccount) {
            setUser(fullUser);
            setSelectedAccount(realAccount);
            setToken(authToken);
            localStorage.setItem('deriv_token', authToken);
            setIsLoading(false);
            return true;
        } else {
            console.error("No real Deriv account found for this user.");
            logout();
            setIsLoading(false);
            return false;
        }

    } catch (e) {
        console.error("An error occurred during token verification:", e);
        logout();
        setIsLoading(false);
        return false;
    }
  }, [api, logout]);
  
  useEffect(() => {
    const storedToken = localStorage.getItem('deriv_token');
    if (storedToken) {
      if (api) {
        verifyToken(storedToken);
      }
    } else {
      setIsLoading(false);
    }
  }, [api, verifyToken]);
  
  const login = useCallback(async (authToken: string): Promise<boolean> => {
    return await verifyToken(authToken);
  }, [verifyToken]);

  const updateBalance = (newBalance: number) => {
    if (selectedAccount) {
        setSelectedAccount(prev => prev ? { ...prev, balance: newBalance } : null);
        if (user && user.loginid === selectedAccount.loginid) {
            setUser(prev => prev ? { ...prev, balance: newBalance } : null);
        }
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
