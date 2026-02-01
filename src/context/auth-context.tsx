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

  private connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.connecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connecting = true;
    this.connectionPromise = new Promise((resolve, reject) => {
      this.ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${this.app_id}`);

      this.ws.onopen = () => {
        console.log("✅ Deriv WebSocket connected.");
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
          console.error("Failed to parse WebSocket message:", e);
        }
      };

      this.ws.onclose = () => {
        console.log('Deriv WebSocket disconnected');
        this.ws = null;
        this.connecting = false;
        this.message_callbacks.forEach((cb) => cb.reject(new Error("WebSocket disconnected")));
        this.message_callbacks.clear();
      };

      this.ws.onerror = (err) => {
        console.error('Deriv WebSocket error:', err);
        this.ws = null;
        this.connecting = false;
        reject(err);
      };
    });
    return this.connectionPromise;
  }

  public async sendRequest(request: object, timeoutMs: number = 15000): Promise<any> {
    await this.connect();
    
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket connection failed");
    }
    
    return new Promise((resolve, reject) => {
      const req_id = this.request_id++;
      
      const timeout = setTimeout(() => {
        this.message_callbacks.delete(req_id);
        reject(new Error(`Request timed out after ${timeoutMs / 1000}s`));
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DerivUser | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<DerivAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [api, setApi] = useState<DerivAPI | null>(null);
  
  // The definitive lock to prevent double-execution
  const isInitialized = useRef(false);

  // Initialize API once
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID;
    if (!appId) {
      console.error("❌ Deriv App ID is not configured");
      setIsLoading(false);
      return;
    }
    
    console.log("🔧 Initializing Deriv API");
    const derivApi = new DerivAPI({ app_id: Number(appId) });
    setApi(derivApi);

    return () => {
      console.log("🔌 Disconnecting Deriv API");
      derivApi.disconnect();
    };
  }, []);

  const logout = useCallback(() => {
    console.log("🚪 Logging out");
    localStorage.removeItem('deriv_token');
    setUser(null);
    setSelectedAccount(null);
    // On logout, we need to allow re-initialization if the user logs back in
    isInitialized.current = false;
  }, []);

  // Main authentication effect
  useEffect(() => {
    // Don't run if API isn't ready or if we've already initialized.
    if (!api || isInitialized.current) {
      return;
    }

    // Set the lock immediately. This will not be unset.
    isInitialized.current = true;
    
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('deriv_token');
      
      if (storedToken) {
        console.log("📦 Found stored token. Verifying session ONCE.");
        try {
          const response = await api.authorize(storedToken);
          
          if (response.error) {
            console.error("❌ Authorization failed:", response.error.message);
            logout();
          } else {
            const fullUser = response.authorize as DerivUser;
            const realAccount = fullUser.account_list?.find((acc: DerivAccount) => acc.is_virtual === 0);

            if (!realAccount) {
              console.error("❌ No real account found");
              logout();
            } else {
              console.log("✅ Verification successful:", fullUser.email);
              setUser(fullUser);
              setSelectedAccount(realAccount);
            }
          }
        } catch (error: any) {
          console.error("❌ Verification error:", error.message || error);
          logout();
        }
      } else {
        console.log("ℹ️ No stored token found.");
      }
      
      // No matter what, stop loading at the end.
      setIsLoading(false);
    };

    initializeAuth();
  }, [api, logout]);

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
