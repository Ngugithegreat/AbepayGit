'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import type { DerivUser, DerivAccount } from '@/lib/types';

// This class is a simplified wrapper for the Deriv WebSocket API.
// It handles connection, authentication, and request/response management.
class DerivAPI {
  private ws: WebSocket | null = null;
  private app_id: number;
  private message_callbacks: Map<number, { resolve: (value: any) => void; reject: (reason?: any) => void; }> = new Map();
  private request_id: number = 1;
  private connectionPromise: Promise<void> | null = null;
  public onBalanceUpdate: ((balance: number) => void) | null = null;

  constructor({ app_id }: { app_id: number }) {
    this.app_id = app_id;
  }

  private async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return Promise.resolve();
    if (this.connectionPromise) return this.connectionPromise;

    this.connectionPromise = new Promise((resolve, reject) => {
      this.ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${this.app_id}`);

      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);

      this.ws.onopen = () => {
        clearTimeout(timeout);
        console.log("✅ WebSocket connected");
        resolve();
      };

      this.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.balance) { 
          this.onBalanceUpdate?.(parseFloat(data.balance.balance));
        }
        if (data.req_id && this.message_callbacks.has(data.req_id)) {
          const callback = this.message_callbacks.get(data.req_id)!;
          data.error ? callback.reject(data.error) : callback.resolve(data);
          this.message_callbacks.delete(data.req_id);
        }
      };
      
      this.ws.onclose = () => { this.ws = null; this.connectionPromise = null; };
      this.ws.onerror = (err) => { clearTimeout(timeout); reject(err); };
    });
    return this.connectionPromise;
  }

  public async sendRequest(request: object, timeoutMs: number = 15000): Promise<any> {
    await this.connect();
    if (!this.ws) throw new Error("Connection failed");
    
    return new Promise((resolve, reject) => {
      const req_id = this.request_id++;
      const timeout = setTimeout(() => {
        this.message_callbacks.delete(req_id);
        reject(new Error(`Request timeout after ${timeoutMs}ms`));
      }, timeoutMs);
      this.message_callbacks.set(req_id, {
        resolve: (response) => { clearTimeout(timeout); resolve(response); },
        reject: (error) => { clearTimeout(timeout); reject(error); }
      });
      this.ws.send(JSON.stringify({ ...request, req_id }));
    });
  }

  async authorize(token: string) { return this.sendRequest({ authorize: token }); }
  disconnect() { this.ws?.close(); }
}

interface AuthContextType {
  isLinked: boolean;
  user: DerivUser | null;
  selectedAccount: DerivAccount | null;
  isLoading: boolean;
  logout: () => void;
  login: (token: string) => Promise<void>;
  updateBalance: (newBalance: number) => void;
  refreshBalance: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DerivUser | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<DerivAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [api, setApi] = useState<DerivAPI | null>(null);
  
  const authLock = useRef(false); // Use a ref for the lock

  const updateBalance = useCallback((newBalance: number) => {
    setSelectedAccount(prev => prev ? { ...prev, balance: newBalance } : null);
    setUser(prevUser => {
      if (!prevUser || !selectedAccount) return prevUser;
      const newAccountList = prevUser.account_list.map(acc => 
          acc.loginid === selectedAccount.loginid ? { ...acc, balance: newBalance } : acc
      );
      const updatedUser = { ...prevUser, account_list: newAccountList, balance: newBalance };
      try {
        localStorage.setItem('deriv_user', JSON.stringify(updatedUser));
      } catch (e) {
        console.error("Failed to update user in local storage", e);
      }
      return updatedUser;
    });
  }, [selectedAccount]);

  const refreshBalance = useCallback(async () => {
    if (!api || !selectedAccount) return;
    try {
      await api.sendRequest({ balance: 1 });
    } catch (error) {
      console.error("❌ Failed to send balance refresh request:", error);
    }
  }, [api, selectedAccount]);

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID;
    if (!appId) { setIsLoading(false); return; }
    const derivApi = new DerivAPI({ app_id: Number(appId) });
    derivApi.onBalanceUpdate = updateBalance;
    setApi(derivApi);
    return () => derivApi.disconnect();
  }, [updateBalance]);

  const logout = useCallback(() => {
    console.log("🚪 Logout");
    localStorage.removeItem('deriv_user');
    localStorage.removeItem('deriv_token');
    setUser(null);
    setSelectedAccount(null);
    api?.disconnect();
  }, [api]);

  const login = useCallback(async (token: string): Promise<void> => {
    if (!api) throw new Error("API not ready");
    if (authLock.current) {
      console.warn("Authentication already in progress. Ignoring concurrent call.");
      return; // Gracefully exit if auth is already in progress
    }
    authLock.current = true;
    console.log("🔐 Logging in with new token");

    try {
      const response = await api.authorize(token);
      const authData = response.authorize as DerivUser;
      localStorage.setItem('deriv_token', token);
      localStorage.setItem('deriv_user', JSON.stringify(authData));

      const clientAccount = authData.account_list?.find(acc => acc.is_virtual === 0);
      if (!clientAccount) throw new Error("No real money accounts found.");

      setUser(authData);
      setSelectedAccount(clientAccount);
      console.log("✅ Auth success:", authData.email);

      if (clientAccount.loginid !== authData.loginid) {
        await api.sendRequest({ account_switch: clientAccount.loginid });
      }
      await api.sendRequest({ balance: 1, subscribe: 1 });
    } catch (error: any) {
      console.error("❌ Auth error during login:", error.message);
      logout(); // Clean up on failure
      throw error; // Re-throw to be caught by the caller
    } finally {
      authLock.current = false;
    }
  }, [api, logout]);

  useEffect(() => {
    const initAuth = async () => {
      if (!api) return;
      setIsLoading(true);
      const token = localStorage.getItem('deriv_token');
      const userJSON = localStorage.getItem('deriv_user');
      if (token && userJSON) {
        try {
          console.log("📦 Previous session found, re-authorizing...");
          await login(token);
        } catch (error) {
          console.log("⚠️ Session invalid, logging out.");
          logout();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, [api, login, logout]);

  const value: AuthContextType = {
    isLinked: !!user && !isLoading,
    user,
    selectedAccount,
    isLoading,
    logout,
    login,
    updateBalance,
    refreshBalance,
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
