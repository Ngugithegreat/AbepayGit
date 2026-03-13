'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import type { DerivUser, DerivAccount } from '@/lib/types';

// Simplified WebSocket API wrapper
class DerivAPI {
  private ws: WebSocket | null = null;
  private app_id: number;
  private message_callbacks: Map<number, { resolve: (value: any) => void; reject: (reason?: any) => void; }> = new Map();
  private request_id: number = 1;
  private connecting: boolean = false;
  private connectionPromise: Promise<void> | null = null;
  public onBalanceUpdate: ((balance: number) => void) | null = null;

  constructor({ app_id }: { app_id: number }) {
    this.app_id = app_id;
  }

  private async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.connecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connecting = true;
    this.connectionPromise = new Promise((resolve, reject) => {
      this.ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${this.app_id}`);

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
        this.connecting = false;
      }, 10000);

      this.ws.onopen = () => {
        clearTimeout(timeout);
        console.log("✅ WebSocket connected");
        this.connecting = false;
        resolve();
      };

      this.ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          
          if (data.balance) { 
            console.log("💰 Balance update received:", data.balance);
            if (this.onBalanceUpdate) {
              this.onBalanceUpdate(parseFloat(data.balance.balance));
            }
          }
          
          if (data.req_id && this.message_callbacks.has(data.req_id)) {
            const callback = this.message_callbacks.get(data.req_id);
            if (data.error) {
              callback?.reject(data.error);
            } else {
              callback?.resolve(data);
            }
            this.message_callbacks.delete(data.req_id);
          }
        } catch(e) {
          console.error("Parse error:", e);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.ws = null;
        this.connecting = false;
        this.connectionPromise = null;
      };

      this.ws.onerror = (err) => {
        clearTimeout(timeout);
        console.error('WebSocket error:', err);
        this.connecting = false;
        this.connectionPromise = null;
        reject(err);
      };
    });

    return this.connectionPromise;
  }

  public async sendRequest(request: object, timeoutMs: number = 15000): Promise<any> {
    await this.connect();
    
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("Connection failed");
    }
    
    return new Promise((resolve, reject) => {
      const req_id = this.request_id++;
      
      const timeout = setTimeout(() => {
        this.message_callbacks.delete(req_id);
        reject(new Error(`Timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      this.message_callbacks.set(req_id, {
        resolve: (response) => {
          clearTimeout(timeout);
          resolve(response);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        }
      });
      
      this.ws!.send(JSON.stringify({ ...request, req_id }));
    });
  }

  async authorize(token: string) {
    return this.sendRequest({ authorize: token });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
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
  
  const hasInitialized = useRef(false);
  const authLock = useRef(false);

  const updateBalance = useCallback((newBalance: number) => {
    setSelectedAccount(prev => prev ? { ...prev, balance: newBalance } : null);
    setUser(prevUser => {
      if (!prevUser || !selectedAccount) return prevUser;
      const newAccountList = prevUser.account_list.map(acc => 
          acc.loginid === selectedAccount.loginid ? { ...acc, balance: newBalance } : acc
      );
      const updatedUser = { ...prevUser, account_list: newAccountList, balance: newBalance };
      localStorage.setItem('deriv_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, [selectedAccount]);

  const refreshBalance = useCallback(async () => {
    if (!api || !selectedAccount) return;
    console.log("🔄 Requesting balance refresh...");
    try {
      await api.sendRequest({ balance: 1 });
      console.log("✅ Balance refresh request sent.");
    } catch (error) {
      console.error("❌ Failed to send balance refresh request:", error);
    }
  }, [api, selectedAccount]);

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID;
    if (!appId) {
      setIsLoading(false);
      return;
    }
    
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
    authLock.current = false;
  }, [api]);

  const login = useCallback(async (token: string): Promise<void> => {
    if (!api) throw new Error("API not ready");
    if (authLock.current) {
      console.warn("Authentication already in progress. Ignoring concurrent call.");
      return;
    }
    
    authLock.current = true;
    console.log("🔐 Logging in with new token");

    try {
      const response = await api.authorize(token);

      if (response.error) {
        throw new Error(response.error.message);
      }
      
      const authData = response.authorize as DerivUser;
      localStorage.setItem('deriv_token', token);
      localStorage.setItem('deriv_user', JSON.stringify(authData));

      const clientAccount = authData.account_list?.find(acc => acc.is_virtual === 0);
      if (!clientAccount) {
          throw new Error("No real money accounts found.");
      }

      setSelectedAccount(clientAccount);
      setUser(authData);
      
      console.log("✅ Auth success:", authData.email);

      if (clientAccount.loginid !== authData.loginid) {
        await api.sendRequest({ account_switch: clientAccount.loginid });
      }

      await api.sendRequest({ balance: 1, subscribe: 1 });
      console.log(`✅ Subscribed to balance updates for ${clientAccount.loginid}`);

    } catch (error: any) {
      console.error("❌ Auth error during login:", error.message);
      logout();
      throw error; // Re-throw to be caught by the caller
    } finally {
      authLock.current = false;
    }
  }, [api, logout]);

  useEffect(() => {
    if (!api || hasInitialized.current) return;
    
    hasInitialized.current = true;

    const initAuth = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('deriv_token');
      const userJSON = localStorage.getItem('deriv_user');

      if (token && userJSON) {
        console.log("📦 Previous session found, re-authorizing...");
        try {
          const storedUser = JSON.parse(userJSON) as DerivUser;
          setUser(storedUser);
          const clientAccount = storedUser.account_list?.find(acc => acc.is_virtual === 0);
          setSelectedAccount(clientAccount || null);
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
