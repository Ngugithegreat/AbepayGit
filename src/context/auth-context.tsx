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
  updateBalance: (newBalance: number) => void;
  handleLogin: (token: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let globalAuthLock = false;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DerivUser | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<DerivAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [api, setApi] = useState<DerivAPI | null>(null);
  
  const hasInitialized = useRef(false);

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID;
    if (!appId) {
      console.error("❌ No App ID");
      setIsLoading(false);
      return;
    }
    
    console.log("🔧 Init API");
    const derivApi = new DerivAPI({ app_id: Number(appId) });
    setApi(derivApi);

    return () => {
      derivApi.disconnect();
    };
  }, []);

  const logout = useCallback(() => {
    console.log("🚪 Logout");
    localStorage.removeItem('deriv_token');
    setUser(null);
    setSelectedAccount(null);
    globalAuthLock = false;
  }, []);

  const verifyToken = useCallback(async (token: string): Promise<boolean> => {
    if (!api) {
      console.error("❌ No API to verify token");
      return false;
    }
    
    if (globalAuthLock) {
      console.log("⚠️ Auth blocked by lock");
    }
    globalAuthLock = true;
    console.log("🔐 Verifying token");

    try {
      const response = await api.authorize(token);
      
      if (response.error) {
        console.error("❌ Auth failed:", response.error.message);
        return false;
      }

      const fullUser = response.authorize as DerivUser;
      const realAccount = fullUser.account_list?.find((acc: DerivAccount) => acc.is_virtual === 0);

      if (!realAccount) {
        console.error("❌ No real account");
        return false;
      }

      console.log("✅ Auth success:", fullUser.email);
      setUser(fullUser);
      setSelectedAccount(realAccount);
      return true;

    } catch (error: any) {
      console.error("❌ Auth error:", error.message);
      return false;
    } finally {
      globalAuthLock = false;
      setIsLoading(false);
      console.log("🔓 Auth finished");
    }
  }, [api]);
  
  const handleLogin = useCallback(async (token: string) => {
      setIsLoading(true);
      localStorage.setItem('deriv_token', token);
      const success = await verifyToken(token);
      if (!success) {
          localStorage.removeItem('deriv_token');
      }
      return success;
  }, [verifyToken]);

  useEffect(() => {
    if (!api || hasInitialized.current) return;
    
    hasInitialized.current = true;

    const init = async () => {
      const token = localStorage.getItem('deriv_token');
      
      if (token) {
        console.log("📦 Token found, verifying session");
        await verifyToken(token);
      } else {
        console.log("ℹ️ No token, not logged in");
        setIsLoading(false);
      }
    };
    
    init();
  }, [api, verifyToken]);

  const updateBalance = useCallback((newBalance: number) => {
    if (selectedAccount) {
      setSelectedAccount(prev => prev ? { ...prev, balance: newBalance } : null);
    }
  }, [selectedAccount]);

  const value: AuthContextType = {
    isLinked: !!user && !isLoading,
    user,
    selectedAccount,
    isLoading,
    logout,
    updateBalance,
    handleLogin,
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
